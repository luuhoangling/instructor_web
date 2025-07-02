import React, { useEffect } from 'react';
import { Form, Input, InputNumber, Switch, Button, Card, Space } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import useCourseStore from '../../store/courseStore';
import { 
  createCourse, 
  updateCourse,
  createSection,
  updateSection,
  createLesson,
  updateLesson,
  createQuiz,
  updateQuiz,
  createQuestion,
  updateQuestion
} from '../../services/api';

const { TextArea } = Input;

// Styled components
const FormContainer = styled(Card)`
  height: 100%;
  .ant-card-body {
    height: calc(100vh - 250px);
    overflow-y: auto;
  }
`;

const FormActions = styled.div`
  position: sticky;
  bottom: 0;
  background: #fff;
  padding: 16px 0;
  border-top: 1px solid #f0f0f0;
  margin-top: 24px;
`;

// Form field configurations cho từng loại node
const getFormFields = (nodeType) => {
  const baseFields = {
    title: { 
      label: 'Tiêu đề', 
      rules: [{ required: true, message: 'Vui lòng nhập tiêu đề!' }],
      component: Input
    },
    description: { 
      label: 'Mô tả', 
      component: TextArea,
      props: { rows: 3 }
    },
    order_index: { 
      label: 'Thứ tự', 
      component: InputNumber,
      props: { min: 0, style: { width: '100%' } }
    }
  };

  const fieldConfigs = {
    course: {
      ...baseFields,
      price: { 
        label: 'Giá (USD)', 
        component: InputNumber,
        props: { min: 0, formatter: value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') }
      },
      is_published: { 
        label: 'Đã xuất bản', 
        component: Switch 
      },
      duration_minutes: { 
        label: 'Thời lượng (phút)', 
        component: InputNumber,
        props: { min: 0 }
      }
    },
    
    section: {
      ...baseFields
    },
    
    lesson: {
      ...baseFields,
      content: { 
        label: 'Nội dung', 
        component: TextArea,
        props: { rows: 6 }
      },
      duration_minutes: { 
        label: 'Thời lượng (phút)', 
        component: InputNumber,
        props: { min: 0 }
      },
      video_url: { 
        label: 'URL Video', 
        component: Input,
        props: { placeholder: 'https://...' }
      }
    },
    
    quiz: {
      ...baseFields,
      time_limit_minutes: { 
        label: 'Giới hạn thời gian (phút)', 
        component: InputNumber,
        props: { min: 0 }
      },
      passing_score: { 
        label: 'Điểm đậu (%)', 
        component: InputNumber,
        props: { min: 0, max: 100 }
      },
      max_attempts: { 
        label: 'Số lần làm tối đa', 
        component: InputNumber,
        props: { min: 1 }
      }
    },
    
    question: {
      question_text: { 
        label: 'Câu hỏi', 
        rules: [{ required: true, message: 'Vui lòng nhập câu hỏi!' }],
        component: TextArea,
        props: { rows: 3 }
      },
      question_type: { 
        label: 'Loại câu hỏi', 
        component: Input,
        props: { placeholder: 'multiple_choice, true_false, essay...' }
      },
      correct_answer: { 
        label: 'Đáp án đúng', 
        component: TextArea,
        props: { rows: 2 }
      },
      explanation: { 
        label: 'Giải thích', 
        component: TextArea,
        props: { rows: 2 }
      },
      points: { 
        label: 'Điểm số', 
        component: InputNumber,
        props: { min: 0 }
      },
      order_index: baseFields.order_index
    }
  };

  return fieldConfigs[nodeType] || {};
};

// API function mapping
const getApiFunction = (nodeType, isCreate) => {
  const apiMap = {
    course: { create: createCourse, update: updateCourse },
    section: { create: createSection, update: updateSection },
    lesson: { create: createLesson, update: updateLesson },
    quiz: { create: createQuiz, update: updateQuiz },
    question: { create: createQuestion, update: updateQuestion }
  };

  return apiMap[nodeType]?.[isCreate ? 'create' : 'update'];
};

const DetailForm = () => {
  const [form] = Form.useForm();
  
  // Store state
  const { 
    selectedNode, 
    currentCourse,
    addNode, 
    updateNode, 
    addNotification,
    setLoading 
  } = useCourseStore();

  // Form state
  const nodeType = selectedNode?.type;
  const nodeData = selectedNode?.data;
  const isCreateMode = !nodeData?.id; // Nếu không có ID thì là create mode

  // Form fields configuration
  const formFields = getFormFields(nodeType);

  // Load initial form data
  useEffect(() => {
    if (selectedNode && nodeData) {
      form.setFieldsValue(nodeData);
    } else {
      form.resetFields();
    }
  }, [selectedNode, nodeData, form]);

  // Form submission handler
  const handleSubmit = async (values) => {
    if (!nodeType) return;

    try {
      setLoading(nodeType, true);
      
      const apiFunction = getApiFunction(nodeType, isCreateMode);
      if (!apiFunction) {
        throw new Error(`API function not found for ${nodeType}`);
      }

      let result;
      
      // Prepare API call parameters based on node type and hierarchy
      if (isCreateMode) {
        // Create new item
        switch (nodeType) {
          case 'course':
            result = await apiFunction(values);
            break;
            
          case 'section':
            if (!currentCourse?.id) throw new Error('Course ID is required');
            result = await apiFunction(currentCourse.id, values);
            break;
            
          case 'lesson':
            if (!nodeData?.section_id) {
              throw new Error('Section ID is required');
            }
            // Đảm bảo các trường boolean có giá trị mặc định
            const lessonData = {
              ...values,
              is_free: values.is_free !== undefined ? values.is_free : false,
              can_preview: values.can_preview !== undefined ? values.can_preview : false,
              duration: values.duration !== undefined ? values.duration : 0
            };
            result = await apiFunction(nodeData.section_id, lessonData);
            break;
            
          case 'quiz':
            if (!nodeData?.lesson_id) {
              throw new Error('Lesson ID is required');
            }
            // Đảm bảo các trường boolean có giá trị mặc định nếu cần
            const quizData = {
              ...values,
              // Thêm validation cho quiz nếu cần
            };
            result = await apiFunction(nodeData.lesson_id, quizData);
            break;
            
          case 'question':
            if (!nodeData?.quiz_id) {
              throw new Error('Quiz ID is required');
            }
            result = await apiFunction(nodeData.quiz_id, values);
            break;
            
          default:
            throw new Error(`Unsupported node type: ${nodeType}`);
        }
        
        // Add new node to tree
        if (result?.data) {
          const newNode = {
            key: `${nodeType}-${result.data.id}`,
            title: values.title || values.question_text,
            type: nodeType,
            data: result.data,
            isLeaf: nodeType === 'lesson' || nodeType === 'question'
          };
          
          // Find parent key để add node
          const parentKey = selectedNode?.key || `course-${currentCourse?.id}`;
          addNode(parentKey, newNode, nodeType);
        }
        
        addNotification({
          type: 'success',
          message: `Đã tạo ${nodeType} thành công!`
        });
        
      } else {
        // Update existing item
        switch (nodeType) {
          case 'course':
            result = await apiFunction(nodeData.id, values);
            break;
            
          case 'section':
            result = await apiFunction(nodeData.course_id, nodeData.id, values);
            break;
            
          case 'lesson':
            result = await apiFunction(nodeData.course_id, nodeData.section_id, nodeData.id, values);
            break;
            
          case 'quiz':
            result = await apiFunction(nodeData.course_id, nodeData.section_id, nodeData.id, values);
            break;
            
          case 'question':
            result = await apiFunction(
              nodeData.course_id, 
              nodeData.section_id, 
              nodeData.quiz_id, 
              nodeData.id, 
              values
            );
            break;
            
          default:
            throw new Error(`Unsupported node type: ${nodeType}`);
        }
        
        // Update node in tree
        updateNode(selectedNode.key, values);
        
        addNotification({
          type: 'success',
          message: `Đã cập nhật ${nodeType} thành công!`
        });
      }
      
    } catch (error) {
      console.error('Form submission error:', error);
      addNotification({
        type: 'error',
        message: `Lỗi ${isCreateMode ? 'tạo' : 'cập nhật'} ${nodeType}`,
        description: error.message
      });
    } finally {
      setLoading(nodeType, false);
    }
  };

  // Form validation error handler
  const handleSubmitFailed = (errorInfo) => {
    console.error('Form validation failed:', errorInfo);
    addNotification({
      type: 'warning',
      message: 'Vui lòng kiểm tra lại thông tin nhập vào'
    });
  };

  // Reset form
  const handleReset = () => {
    if (nodeData) {
      form.setFieldsValue(nodeData);
    } else {
      form.resetFields();
    }
    
    addNotification({
      type: 'info',
      message: 'Đã reset form'
    });
  };

  // Render form fields
  const renderFormFields = () => {
    return Object.entries(formFields).map(([fieldName, config]) => {
      const { label, rules, component: Component, props = {} } = config;
      
      return (
        <Form.Item
          key={fieldName}
          name={fieldName}
          label={label}
          rules={rules}
        >
          <Component {...props} />
        </Form.Item>
      );
    });
  };

  // Don't render if no node selected
  if (!selectedNode || !nodeType) {
    return (
      <FormContainer title="Thông tin chi tiết">
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
          Chọn một mục trong cây để xem chi tiết
        </div>
      </FormContainer>
    );
  }

  const title = isCreateMode 
    ? `Tạo ${nodeType} mới` 
    : `Chỉnh sửa ${nodeType}: ${nodeData?.title || nodeData?.question_text}`;

  return (
    <FormContainer title={title}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onFinishFailed={handleSubmitFailed}
        autoComplete="off"
        initialValues={{
          // Default values for lesson
          is_free: false,
          can_preview: false,
          duration: 0,
          order_index: 1,
          content_type: 'video',
          // Default values for course
          is_published: false,
          is_featured: false,
          price: 0,
          discount_price: 0,
          level: 'Beginner'
        }}
      >
        {renderFormFields()}
        
        <FormActions>
          <Space>
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<SaveOutlined />}
              loading={false} // TODO: Add loading state
            >
              {isCreateMode ? 'Tạo mới' : 'Cập nhật'}
            </Button>
            
            <Button 
              icon={<ReloadOutlined />}
              onClick={handleReset}
            >
              Reset
            </Button>
          </Space>
        </FormActions>
      </Form>
    </FormContainer>
  );
};

export default DetailForm;
