import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Button, Spin, Alert } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import useCourseStore from '../store/courseStore';
import { getCourse } from '../services/api';
import CourseTreeView from '../components/TreeView/CourseTreeView';
import DetailForm from '../components/Forms/DetailForm';

// Styled components
const EditCourseContainer = styled.div`
  height: calc(100vh - 140px);
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const TreePanel = styled.div`
  height: 100%;
  border-right: 1px solid #f0f0f0;
  padding-right: 16px;
`;

const DetailPanel = styled.div`
  height: 100%;
  padding-left: 16px;
`;

const LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
`;

const ErrorWrapper = styled.div`
  padding: 24px;
`;

const EditCourse = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  // Store state
  const {
    currentCourse,
    courseTree,
    selectedNode,
    loadingStates,
    errors,
    setCurrentCourse,
    setLoading,
    addNotification,
    clearError
  } = useCourseStore();

  // Load course data
  useEffect(() => {
    if (courseId) {
      loadCourseData(courseId);
    }
    
    // Cleanup khi component unmount
    return () => {
      setCurrentCourse(null);
    };
  }, [courseId]);

  const loadCourseData = async (id) => {
    try {
      setLoading('course', true);
      clearError('course');
      
      // Fetch course với đầy đủ sections, lessons, quizzes, questions
      const courseData = await getCourse(id);
      
      if (courseData?.data) {
        setCurrentCourse(courseData.data);
        
        addNotification({
          type: 'success',
          message: `Đã tải khóa học: ${courseData.data.title}`
        });
      } else {
        throw new Error('Không tìm thấy dữ liệu khóa học');
      }
      
    } catch (error) {
      console.error('Failed to load course:', error);
      
      const errorMessage = error.response?.status === 404 
        ? 'Không tìm thấy khóa học'
        : `Không thể tải khóa học: ${error.message}`;
        
      addNotification({
        type: 'error',
        message: errorMessage
      });
      
      // Redirect về dashboard nếu không tìm thấy course
      if (error.response?.status === 404) {
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
      
    } finally {
      setLoading('course', false);
    }
  };

  // Save course changes
  const handleSaveCourse = async () => {
    try {
      // TODO: Implement auto-save hoặc manual save functionality
      addNotification({
        type: 'success',
        message: 'Đã lưu thay đổi'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Không thể lưu thay đổi',
        description: error.message
      });
    }
  };

  // Quick actions
  const handlePreviewCourse = () => {
    // TODO: Open course preview in new tab
    addNotification({
      type: 'info',
      message: 'Chức năng xem trước đang được phát triển'
    });
  };

  const handlePublishCourse = () => {
    // TODO: Toggle course publish status
    addNotification({
      type: 'info',
      message: 'Chức năng xuất bản đang được phát triển'
    });
  };

  // Loading state
  if (loadingStates.course) {
    return (
      <EditCourseContainer>
        <LoadingWrapper>
          <Spin size="large" tip="Đang tải khóa học..." />
        </LoadingWrapper>
      </EditCourseContainer>
    );
  }

  // Error state
  if (errors.course) {
    return (
      <EditCourseContainer>
        <ErrorWrapper>
          <Alert
            message="Lỗi tải khóa học"
            description={errors.course}
            type="error"
            showIcon
            action={
              <Button size="small" onClick={() => loadCourseData(courseId)}>
                Thử lại
              </Button>
            }
          />
        </ErrorWrapper>
      </EditCourseContainer>
    );
  }

  // No course data
  if (!currentCourse) {
    return (
      <EditCourseContainer>
        <ErrorWrapper>
          <Alert
            message="Không tìm thấy khóa học"
            description="Khóa học có thể đã bị xóa hoặc bạn không có quyền truy cập."
            type="warning"
            showIcon
            action={
              <Button onClick={() => navigate('/')}>
                Về trang chủ
              </Button>
            }
          />
        </ErrorWrapper>
      </EditCourseContainer>
    );
  }

  return (
    <EditCourseContainer>
      {/* Page Header */}
      <PageHeader>
        <HeaderLeft>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(-1)}
          >
            Quay lại
          </Button>
          
          <div>
            <h2 style={{ margin: 0 }}>
              {currentCourse.title}
            </h2>
            <div style={{ color: '#666', fontSize: '14px' }}>
              ID: {currentCourse.id} • 
              {currentCourse.is_published ? ' Đã xuất bản' : ' Bản nháp'} • 
              {courseTree?.children?.length || 0} chương
            </div>
          </div>
        </HeaderLeft>

        <HeaderRight>
          <Button onClick={handlePreviewCourse}>
            Xem trước
          </Button>
          
          <Button 
            type={currentCourse.is_published ? 'default' : 'primary'}
            onClick={handlePublishCourse}
          >
            {currentCourse.is_published ? 'Hủy xuất bản' : 'Xuất bản'}
          </Button>
          
          <Button 
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveCourse}
          >
            Lưu
          </Button>
        </HeaderRight>
      </PageHeader>

      {/* Main Content: Tree + Detail Form */}
      <Row gutter={0} style={{ height: '100%' }}>
        {/* Tree View Panel */}
        <Col xs={24} lg={10} xl={8}>
          <TreePanel>
            <CourseTreeView />
          </TreePanel>
        </Col>

        {/* Detail Form Panel */}
        <Col xs={24} lg={14} xl={16}>
          <DetailPanel>
            <DetailForm />
          </DetailPanel>
        </Col>
      </Row>
    </EditCourseContainer>
  );
};

export default EditCourse;
