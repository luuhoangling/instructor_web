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
      icon: <BookOutlined />,
      type: 'course',
      data: course,
      children: (course.sections || []).map(section => ({
        title: section.title,
        key: `section-${section.id}`,
        icon: <AppstoreOutlined />,
        type: 'section',
        data: section,
        children: [
          // Lessons
          ...(section.lessons || []).map(lesson => ({
            title: lesson.title,
            key: `lesson-${lesson.id}`,
            icon: lesson.content_type === 'video' ? <PlayCircleOutlined /> : <FileTextOutlined />,
            type: 'lesson',
            data: lesson,
            children: (lesson.quizzes || []).map(quiz => ({
              title: quiz.title,
              key: `quiz-${quiz.id}`,
              icon: <QuestionCircleOutlined />,
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
          // Trigger parent refresh
          window.location.reload();
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
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        width: '100%'
      }}>
        <Space size={4}>
          {node.icon}
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
        showIcon
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
          <AppstoreOutlined style={{ fontSize: '24px', color: '#d9d9d9', marginBottom: '8px' }} />
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
