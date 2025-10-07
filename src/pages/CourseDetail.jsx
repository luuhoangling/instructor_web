import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Card, 
  Typography, 
  Button, 
  Space, 
  Row, 
  Col, 
  Tag, 
  Descriptions, 
  Divider,
  message,
  Modal,
  Spin
} from 'antd';
import { 
  EditOutlined, 
  ArrowLeftOutlined, 
  PlusOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  EyeOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { getCourse } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import CourseTreeView from '../components/TreeView/CourseTreeView';
import styled from 'styled-components';

// Styled components
const PageContainer = styled.div`
  background: #f8fafc;
  min-height: 100vh;
  padding: 32px;
`;

const HeaderSection = styled.div`
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  padding: 32px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  margin-bottom: 32px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
`;

const ContentSection = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 32px;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const MainContent = styled.div`
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const InfoCard = styled(Card)`
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  
  .ant-card-head {
    background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
    border-bottom: 1px solid #e2e8f0;
  }
`;
import SectionForm from '../components/Forms/SectionForm';
import LessonForm from '../components/Forms/LessonForm';
import QuizForm from '../components/Forms/QuizForm';

const { Title, Text, Paragraph } = Typography;

const CourseDetail = () => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(''); // 'section', 'lesson', 'quiz'
  const [editingItem, setEditingItem] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();

  // Load course data
  useEffect(() => {
    loadCourseData();
  }, [id]);

  const loadCourseData = async () => {
    setLoading(true);
    try {
      const courseData = await getCourse(id);
      setCourse(courseData);
    } catch (error) {
      console.error('Failed to load course:', error);
      message.error('Không thể tải thông tin khóa học: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle node selection in tree
  const handleNodeSelect = (selectedKeys, { node }) => {
    // Chỉ set selected node, không auto mở video
    setSelectedNode(node);
  };

  // Handle add new item
  const handleAddNew = (type, parentNode = null) => {
    console.log('DEBUG: handleAddNew called', { type, parentNode });
    setModalType(type);
    setEditingItem(null);
    setSelectedNode(parentNode);
    setModalVisible(true);
  };

  // Handle edit item
  const handleEdit = (item, type) => {
    setModalType(type);
    setEditingItem(item);
    setModalVisible(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setModalVisible(false);
    setModalType('');
    setEditingItem(null);
    // Reload course data to refresh tree
    loadCourseData();
  };

  // Get status tag - chỉ hiển thị nếu đã xuất bản
  const getStatusTag = (course) => {
    if (course?.is_published) {
      return <Tag color="green">Đã xuất bản</Tag>;
    }
    return null; // Không hiển thị gì nếu chưa xuất bản
  };

  // Get level tag
  const getLevelTag = (level) => {
    const colors = {
      'Beginner': 'blue',
      'Intermediate': 'orange', 
      'Advanced': 'red'
    };
    const labels = {
      'Beginner': 'Cơ bản',
      'Intermediate': 'Trung cấp',
      'Advanced': 'Nâng cao'
    };
    return <Tag color={colors[level]}>{labels[level] || level}</Tag>;
  };

  // Render modal content based on type
  const renderModalContent = () => {
    switch (modalType) {
      case 'section':
        return (
          <SectionForm
            courseId={id}
            section={editingItem}
            onSuccess={handleModalClose}
            onCancel={handleModalClose}
          />
        );
      case 'lesson':
        return (
          <LessonForm
            courseId={id}
            sectionId={selectedNode?.data?.id}
            lesson={editingItem}
            onSuccess={handleModalClose}
            onCancel={handleModalClose}
          />
        );
      case 'quiz':
        return (
          <QuizForm
            lessonId={selectedNode?.data?.id}
            quiz={editingItem}
            onSuccess={handleModalClose}
            onCancel={handleModalClose}
          />
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    // Gán callback để TreeView có thể gọi reload dữ liệu khi xóa
    window.refreshCourseData = () => {
      if (typeof loadCourseData === 'function') {
        loadCourseData();
      }
    };
    return () => {
      window.refreshCourseData = undefined;
    };
  }, [course]);

  if (loading) {
    return (
      <Layout.Content style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Đang tải thông tin khóa học...</div>
      </Layout.Content>
    );
  }

  if (!course) {
    return (
      <Layout.Content style={{ padding: '24px', textAlign: 'center' }}>
        <Text type="secondary">Không tìm thấy khóa học</Text>
      </Layout.Content>
    );
  }

  return (
    <PageContainer>
      {/* Header */}
      <HeaderSection>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/courses')}
          style={{ 
            marginBottom: 24,
            borderRadius: '8px',
            height: '40px'
          }}
        >
          Quay lại danh sách
        </Button>
        
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0, color: '#1f2937' }}>
              {course.title}
            </Title>
            <Space style={{ marginTop: 12 }}>
              {getStatusTag(course)}
              {getLevelTag(course.level)}
              {course.is_featured && <Tag color="gold">Nổi bật</Tag>}
            </Space>
          </Col>
          <Col>
            <Space>
              <Button 
                type="primary" 
                icon={<EditOutlined />}
                onClick={() => navigate(`/courses/${id}/edit`)}
                style={{
                  borderRadius: '8px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                }}
              >
                Chỉnh sửa
              </Button>
              <Button 
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleAddNew('section')}
              >
                Thêm chương mới
              </Button>
            </Space>
          </Col>
        </Row>
      </HeaderSection>

      <ContentSection>
        {/* Main Content */}
        <MainContent>
          <CourseTreeView 
            course={course} 
            onSelect={handleNodeSelect}
            onEdit={handleEdit}
            onAddSection={() => handleAddNew('section')}
            onAddLesson={(sectionNode) => handleAddNew('lesson', sectionNode)}
            onAddQuiz={(lessonNode) => handleAddNew('quiz', lessonNode)}
            selectedKeys={selectedNode ? [selectedNode.key] : []}
          />
        </MainContent>

        {/* Sidebar */}
        <Sidebar>
          <InfoCard title="Thông tin khóa học">
            {course.thumbnail_url && (
              <div style={{ marginBottom: 16, textAlign: 'center' }}>
                <img 
                  src={course.thumbnail_url} 
                  alt={course.title}
                  style={{ 
                    width: '100%', 
                    maxHeight: 200, 
                    objectFit: 'cover',
                    borderRadius: 12 
                  }}
                />
              </div>
            )}
            
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Phụ đề">
                {course.subtitle || <Text type="secondary">Chưa có</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="Giá gốc">
                {formatCurrency(course.price)}
              </Descriptions.Item>
              {course.discount_price && (
                <Descriptions.Item label="Giá ưu đãi">
                  <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>
                    {formatCurrency(course.discount_price)}
                  </Text>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Danh mục">
                <Tag>ID: {course.category_id}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {formatDate(course.created_at)}
              </Descriptions.Item>
            </Descriptions>

            {course.description && (
              <>
                <Divider />
                <div>
                  <Text strong>Mô tả:</Text>
                  <Paragraph style={{ marginTop: 8 }}>
                    {course.description}
                  </Paragraph>
                </div>
              </>
            )}

            {course.preview_video_url && (
              <>
                <Divider />
                <div>
                  <Text strong>Video giới thiệu:</Text>
                  <div style={{ marginTop: 8 }}>
                    <video 
                      controls 
                      style={{ width: '100%', borderRadius: 8 }}
                      src={course.preview_video_url}
                    />
                  </div>
                </div>
              </>
            )}
          </InfoCard>
        </Sidebar>
      </ContentSection>

      {/* Modal for forms */}
      <Modal
        title={
          modalType === 'section' 
            ? (editingItem ? 'Chỉnh sửa chương' : 'Thêm chương mới')
            : modalType === 'lesson'
            ? (editingItem ? 'Chỉnh sửa bài học' : 'Thêm bài học mới')
            : modalType === 'quiz'
            ? (editingItem ? 'Chỉnh sửa quiz' : 'Thêm quiz mới')
            : ''
        }
        open={modalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={modalType === 'quiz' ? 800 : 600}
        destroyOnClose
      >
        {renderModalContent()}
      </Modal>
    </PageContainer>
  );
};

export default CourseDetail;
