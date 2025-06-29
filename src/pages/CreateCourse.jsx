import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  Switch, 
  Button, 
  Card, 
  Space, 
  Steps,
  Row,
  Col,
  Upload,
  message
} from 'antd';
import { 
  SaveOutlined, 
  ArrowLeftOutlined,
  UploadOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import useCourseStore from '../store/courseStore';
import { createCourse } from '../services/api';

const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

// Styled components
const CreateCourseContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const StepsContainer = styled.div`
  margin-bottom: 32px;
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
`;

const FormCard = styled(Card)`
  margin-bottom: 24px;
  
  .ant-card-body {
    padding: 32px;
  }
`;

const FormActions = styled.div`
  position: sticky;
  bottom: 0;
  background: #fff;
  padding: 16px 0;
  border-top: 1px solid #f0f0f0;
  margin-top: 24px;
  text-align: center;
`;

const PreviewCard = styled(Card)`
  margin-top: 24px;
  
  .course-preview-header {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
  }
  
  .course-thumbnail {
    width: 200px;
    height: 120px;
    background: #f5f5f5;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
  }
  
  .course-info {
    flex: 1;
  }
`;

const CreateCourse = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  // Store state
  const { addNotification, setLoading, loadingStates } = useCourseStore();
  
  // Local state
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [fileList, setFileList] = useState([]);

  // Form steps configuration
  const steps = [
    {
      title: 'Thông tin cơ bản',
      description: 'Tên, mô tả và thông tin chung',
      fields: ['title', 'subtitle', 'description', 'category_id']
    },
    {
      title: 'Giá cả & Cấp độ',
      description: 'Thiết lập giá và độ khó',
      fields: ['price', 'discount_price', 'level']
    },
    {
      title: 'Media & Xuất bản',
      description: 'Hình ảnh, video và trạng thái',
      fields: ['thumbnail_url', 'preview_video_url', 'is_published', 'is_featured']
    },
    {
      title: 'Xác nhận',
      description: 'Xem lại thông tin trước khi tạo',
      fields: []
    }
  ];

  // Level options
  const levelOptions = [
    { value: 'Beginner', label: 'Người mới bắt đầu' },
    { value: 'Intermediate', label: 'Trung cấp' },
    { value: 'Advanced', label: 'Nâng cao' }
  ];

  // Category options (mock data)
  const categoryOptions = [
    { value: 1, label: 'Lập trình' },
    { value: 2, label: 'Thiết kế' },
    { value: 3, label: 'Marketing' },
    { value: 4, label: 'Kinh doanh' },
    { value: 5, label: 'Ngoại ngữ' }
  ];

  // Form validation rules
  const validationRules = {
    title: [
      { required: true, message: 'Vui lòng nhập tên khóa học!' },
      { min: 5, message: 'Tên khóa học phải có ít nhất 5 ký tự!' },
      { max: 100, message: 'Tên khóa học không được quá 100 ký tự!' }
    ],
    subtitle: [
      { max: 200, message: 'Phụ đề không được quá 200 ký tự!' }
    ],
    description: [
      { required: true, message: 'Vui lòng nhập mô tả khóa học!' },
      { min: 20, message: 'Mô tả phải có ít nhất 20 ký tự!' }
    ],
    price: [
      { type: 'number', min: 0, message: 'Giá phải lớn hơn hoặc bằng 0!' }
    ],
    discount_price: [
      { type: 'number', min: 0, message: 'Giá giảm phải lớn hơn hoặc bằng 0!' }
    ],
    category_id: [
      { required: true, message: 'Vui lòng chọn danh mục!' }
    ],
    level: [
      { required: true, message: 'Vui lòng chọn cấp độ!' }
    ]
  };

  // Step navigation handlers
  const nextStep = async () => {
    try {
      const currentFields = steps[currentStep].fields;
      if (currentFields.length > 0) {
        // Validate current step fields
        const values = await form.validateFields(currentFields);
        setFormData(prev => ({ ...prev, ...values }));
      }
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    } catch (error) {
      console.error('Validation failed:', error);
      addNotification({
        type: 'warning',
        message: 'Vui lòng kiểm tra lại thông tin nhập vào'
      });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  // File upload handlers
  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: 'image/*',
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('Chỉ được upload file hình ảnh!');
        return false;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('Kích thước file phải nhỏ hơn 5MB!');
        return false;
      }
      return false; // Prevent auto upload
    },
    onChange: handleUploadChange,
    fileList
  };

  // Form submission
  const handleSubmit = async () => {
    try {
      setLoading('course', true);
      
      // Get all form values
      const values = await form.validateFields();
      const finalData = { ...formData, ...values };

      // TODO: Handle file upload to server here
      if (fileList.length > 0) {
        // Upload thumbnail and get URL
        // finalData.thumbnail_url = uploadedUrl;
        console.log('Files to upload:', fileList);
      }

      // Create course
      const result = await createCourse(finalData);
      
      addNotification({
        type: 'success',
        message: 'Tạo khóa học thành công!',
        description: `Khóa học "${finalData.title}" đã được tạo.`
      });

      // Navigate to edit page
      navigate(`/courses/${result.data.id}/edit`);
      
    } catch (error) {
      console.error('Failed to create course:', error);
      addNotification({
        type: 'error',
        message: 'Không thể tạo khóa học',
        description: error.message
      });
    } finally {
      setLoading('course', false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Row gutter={[24, 24]}>
            <Col span={24}>
              <Form.Item
                name="title"
                label="Tên khóa học"
                rules={validationRules.title}
              >
                <Input 
                  placeholder="Ví dụ: Học React từ cơ bản đến nâng cao"
                  size="large"
                />
              </Form.Item>
            </Col>
            
            <Col span={24}>
              <Form.Item
                name="subtitle"
                label="Phụ đề"
                rules={validationRules.subtitle}
              >
                <Input 
                  placeholder="Mô tả ngắn gọn về khóa học"
                  size="large"
                />
              </Form.Item>
            </Col>
            
            <Col span={24}>
              <Form.Item
                name="description"
                label="Mô tả chi tiết"
                rules={validationRules.description}
              >
                <TextArea 
                  rows={6}
                  placeholder="Mô tả chi tiết về nội dung, mục tiêu và lợi ích của khóa học..."
                />
              </Form.Item>
            </Col>
            
            <Col span={24}>
              <Form.Item
                name="category_id"
                label="Danh mục"
                rules={validationRules.category_id}
              >
                <Select 
                  placeholder="Chọn danh mục khóa học"
                  size="large"
                >
                  {categoryOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        );

      case 1:
        return (
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="price"
                label="Giá khóa học (VND)"
                rules={validationRules.price}
              >
                <InputNumber
                  placeholder="299000"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  style={{ width: '100%' }}
                  size="large"
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} md={12}>
              <Form.Item
                name="discount_price"
                label="Giá khuyến mãi (VND)"
                rules={validationRules.discount_price}
              >
                <InputNumber
                  placeholder="199000"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  style={{ width: '100%' }}
                  size="large"
                />
              </Form.Item>
            </Col>
            
            <Col span={24}>
              <Form.Item
                name="level"
                label="Cấp độ"
                rules={validationRules.level}
              >
                <Select 
                  placeholder="Chọn cấp độ khóa học"
                  size="large"
                >
                  {levelOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        );

      case 2:
        return (
          <Row gutter={[24, 24]}>
            <Col span={24}>
              <Form.Item
                name="thumbnail_url"
                label="Hình đại diện"
              >
                <Upload {...uploadProps}>
                  <Button icon={<UploadOutlined />}>Tải lên hình ảnh</Button>
                </Upload>
                <div style={{ marginTop: 8, color: '#666', fontSize: '12px' }}>
                  Kích thước đề xuất: 1280x720px, định dạng JPG/PNG, tối đa 5MB
                </div>
              </Form.Item>
            </Col>
            
            <Col span={24}>
              <Form.Item
                name="preview_video_url"
                label="Video giới thiệu"
              >
                <Input 
                  placeholder="https://youtube.com/watch?v=..."
                  size="large"
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} md={12}>
              <Form.Item
                name="is_published"
                label="Xuất bản ngay"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            
            <Col xs={24} md={12}>
              <Form.Item
                name="is_featured"
                label="Khóa học nổi bật"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        );

      case 3:
        return (
          <PreviewCard title="Xem lại thông tin khóa học">
            <div className="course-preview-header">
              <div className="course-thumbnail">
                {fileList.length > 0 ? (
                  <img 
                    src={URL.createObjectURL(fileList[0].originFileObj)} 
                    alt="thumbnail"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                  />
                ) : (
                  'Chưa có hình ảnh'
                )}
              </div>
              <div className="course-info">
                <h3>{formData.title || form.getFieldValue('title')}</h3>
                <p style={{ color: '#666', marginBottom: 8 }}>
                  {formData.subtitle || form.getFieldValue('subtitle')}
                </p>
                <div>
                  <strong>Cấp độ:</strong> {
                    levelOptions.find(opt => opt.value === (formData.level || form.getFieldValue('level')))?.label
                  }
                </div>
                <div>
                  <strong>Giá:</strong> {
                    (formData.price || form.getFieldValue('price'))?.toLocaleString() || '0'
                  } VND
                  {(formData.discount_price || form.getFieldValue('discount_price')) && (
                    <span style={{ color: '#f50', marginLeft: 8 }}>
                      → {(formData.discount_price || form.getFieldValue('discount_price')).toLocaleString()} VND
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div>
              <strong>Mô tả:</strong>
              <p style={{ marginTop: 8, color: '#666' }}>
                {formData.description || form.getFieldValue('description')}
              </p>
            </div>
          </PreviewCard>
        );

      default:
        return null;
    }
  };

  return (
    <CreateCourseContainer>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
          style={{ marginBottom: 16 }}
        >
          Quay lại
        </Button>
        <h1>Tạo khóa học mới</h1>
      </div>

      {/* Steps */}
      <StepsContainer>
        <Steps current={currentStep}>
          {steps.map((step, index) => (
            <Step 
              key={index}
              title={step.title} 
              description={step.description}
            />
          ))}
        </Steps>
      </StepsContainer>

      {/* Form */}
      <FormCard>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            is_published: false,
            is_featured: false,
            price: 0
          }}
        >
          {renderStepContent()}
        </Form>

        <FormActions>
          <Space size="middle">
            {currentStep > 0 && (
              <Button size="large" onClick={prevStep}>
                Quay lại
              </Button>
            )}
            
            {currentStep < steps.length - 1 ? (
              <Button type="primary" size="large" onClick={nextStep}>
                Tiếp theo
              </Button>
            ) : (
              <Button 
                type="primary" 
                size="large" 
                icon={<SaveOutlined />}
                onClick={handleSubmit}
                loading={loadingStates.course}
              >
                Tạo khóa học
              </Button>
            )}
          </Space>
        </FormActions>
      </FormCard>
    </CreateCourseContainer>
  );
};

export default CreateCourse;
