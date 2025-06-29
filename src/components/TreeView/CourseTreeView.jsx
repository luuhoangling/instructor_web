import React, { useState, useEffect, useMemo } from 'react';
import { Tree, Dropdown, Button, Modal, message, Space, Typography } from 'antd';
import { 
  BookOutlined, 
  AppstoreOutlined,
  PlayCircleOutlined,
  QuestionCircleOutlined,
  FileTextOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { 
  deleteSection,
  deleteLesson,
  deleteQuiz
} from '../../services/api';

const { Text } = Typography;

const CourseTreeView = ({ 
  course, 
  onSelect, 
  onEdit, 
  onAddSection, 
  onAddLesson, 
  onAddQuiz,
  selectedKeys = []
}) => {
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [autoExpandParent, setAutoExpandParent] = useState(true);

  // Auto expand course node on mount
  useEffect(() => {
    if (course) {
      setExpandedKeys([`course-${course.id}`]);
    }
  }, [course]);

  // Build tree data from course
  const treeData = useMemo(() => {
    if (!course) return [];

    return [{
      title: course.title,
      key: `course-${course.id}`,
      // icon: <BookOutlined />, // Loại bỏ icon
      type: 'course',
      data: course,
      children: (course.sections || []).map(section => ({
        title: section.title,
        key: `section-${section.id}`,
        // icon: <AppstoreOutlined />, // Loại bỏ icon
        type: 'section',
        data: section,
        children: [
          // Lessons
          ...(section.lessons || []).map(lesson => ({
            title: lesson.title,
            key: `lesson-${lesson.id}`,
            // icon: lesson.content_type === 'video' ? <PlayCircleOutlined /> : <FileTextOutlined />, // Loại bỏ icon
            type: 'lesson',
            data: lesson,
            children: (lesson.quizzes || []).map(quiz => ({
              title: quiz.title,
              key: `quiz-${quiz.id}`,
              // icon: <QuestionCircleOutlined />, // Loại bỏ icon
              type: 'quiz',
              data: quiz,
              isLeaf: true
            }))
          }))
        ]
      }))
    }];
  }, [course]);

  // Handle node select
  const handleSelect = (selectedKeys, info) => {
    if (selectedKeys.length > 0 && onSelect) {
      onSelect(selectedKeys, info);
    }
  };

  // Handle expand
  const handleExpand = (expandedKeys) => {
    setExpandedKeys(expandedKeys);
    setAutoExpandParent(false);
  };

  // Handle delete
  const handleDelete = async (node) => {
    console.log('DEBUG: handleDelete called for node:', node); // Debug log
    const { type, data } = node;
    
    Modal.confirm({
      title: 'Xác nhận xóa',
      icon: <ExclamationCircleOutlined />,
      content: `Bạn có chắc chắn muốn xóa ${
        type === 'section' ? 'chương' : 
        type === 'lesson' ? 'bài học' : 
        type === 'quiz' ? 'quiz' : 'item'
      } "${node.title}"?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        console.log('DEBUG: onOk confirmed for node:', node); // Debug log
        try {
          switch (type) {
            case 'section':
              await deleteSection(data.id);
              break;
            case 'lesson':
              await deleteLesson(data.id);
              break;
            case 'quiz':
              await deleteQuiz(data.id);
              break;
          }
          message.success('Xóa thành công');
          // Gọi callback nếu có, hạn chế reload toàn trang
          if (typeof window.refreshCourseData === 'function') {
            window.refreshCourseData();
          }
        } catch (error) {
          console.error('Delete failed:', error);
          message.error('Không thể xóa: ' + error.message);
        }
      }
    });
  };

  // Get dropdown menu for each node
  const getDropdownMenu = (node) => {
    const { type } = node;
    
    const items = [
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: 'Chỉnh sửa',
        onClick: () => onEdit && onEdit(node.data, type)
      }
    ];

    // Add context-specific actions
    if (type === 'section') {
      items.push({
        key: 'add-lesson',
        icon: <PlusOutlined />,
        label: 'Thêm bài học',
        onClick: () => onAddLesson && onAddLesson(node)
      });
    }

    if (type === 'lesson') {
      items.push({
        key: 'add-quiz',
        icon: <PlusOutlined />,
        label: 'Thêm quiz',
        onClick: () => onAddQuiz && onAddQuiz(node)
      });
    }

    // Add delete action
    if (type !== 'course') {
      items.push(
        { type: 'divider' },
        {
          key: 'delete',
          icon: <DeleteOutlined />,
          label: 'Xóa',
          danger: true,
          onClick: () => handleDelete(node)
        }
      );
    }

    return { items };
  };

  // Custom title renderer with actions
  const titleRender = (node) => {
    // Nếu là bài học thì thêm sự kiện click để luôn mở content_url
    const handleLessonClick = (e) => {
      e.stopPropagation();
      if (node.type === 'lesson' && node.data?.content_url) {
        window.open(node.data.content_url, '_blank');
      }
    };
    // Xác định style phân cấp
    let level = 0;
    if (node.type === 'section') level = 1;
    if (node.type === 'lesson') level = 2;
    if (node.type === 'quiz') level = 3;
    const bgColors = ['#fff', '#f9fafb', '#f3f6fa', '#eef3f7'];
    const borderColors = ['#d9d9d9', '#b3b3b3', '#8c8c8c', '#595959'];
    return (
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', cursor: node.type === 'lesson' ? 'pointer' : 'default',
          paddingLeft: 8 + level * 16,
          borderLeft: `3px solid ${borderColors[level]}`,
          background: bgColors[level],
          minHeight: 36
        }}
        onClick={node.type === 'lesson' ? handleLessonClick : undefined}
      >
        <Space size={4}>
          {/* {node.icon} */}
          <Text>{node.title}</Text>
          {node.type === 'lesson' && node.data?.is_free && (
            <Text type="secondary" style={{ fontSize: '12px' }}>(Miễn phí)</Text>
          )}
          {node.type === 'lesson' && node.data?.duration && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              ({Math.floor(node.data.duration / 60)}:{(node.data.duration % 60).toString().padStart(2, '0')})
            </Text>
          )}
        </Space>
        <Dropdown 
          menu={getDropdownMenu(node)} 
          trigger={['click']}
          onClick={(e) => e.stopPropagation()}
        >
          <Button 
            type="text" 
            size="small" 
            icon={<MoreOutlined />}
            onClick={(e) => e.stopPropagation()}
            style={{ opacity: 0.7 }}
          />
        </Dropdown>
      </div>
    );
  };

  if (!course) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <Text type="secondary">Không có dữ liệu khóa học</Text>
      </div>
    );
  }

  return (
    <div style={{ height: '600px', overflow: 'auto' }}>
      <Tree
        // showIcon // Loại bỏ icon
        onSelect={handleSelect}
        onExpand={handleExpand}
        expandedKeys={expandedKeys}
        autoExpandParent={autoExpandParent}
        selectedKeys={selectedKeys}
        treeData={treeData}
        titleRender={titleRender}
        blockNode
      />
      
      {(!course.sections || course.sections.length === 0) && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px',
          border: '2px dashed #d9d9d9',
          borderRadius: '6px',
          margin: '16px 0'
        }}>
          {/* <AppstoreOutlined style={{ fontSize: '24px', color: '#d9d9d9', marginBottom: '8px' }} /> */}
          <div style={{ color: '#999', marginBottom: '8px' }}>
            Chưa có chương nào
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={onAddSection}
          >
            Tạo chương đầu tiên
          </Button>
        </div>
      )}
    </div>
  );
};

export default CourseTreeView;
