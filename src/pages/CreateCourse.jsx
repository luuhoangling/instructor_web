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
  const [videoList, setVideoList] = useState([]);
  const [demoVideoList, setDemoVideoList] = useState([]);

  // Form steps configuration
  const steps = [
    {
      title: 'Thông tin cơ bản',
      description: 'Tên, mô tả và thông tin chung',
      fields: ['title', 'subtitle', 'description', 'level']
    },
    {
      title: 'Danh mục & Giá cả',
      description: 'Chọn danh mục và thiết lập giá',
      fields: ['category_id', 'price', 'discount_price']
    },
    {
      title: 'Nội dung học',
      description: 'Thời lượng, yêu cầu và nội dung học',
      fields: ['total_duration', 'requirements', 'what_you_learn']
    },
    {
      title: 'Media & Trạng thái',
      description: 'Upload media và thiết lập trạng thái',
      fields: ['thumbnail_url', 'preview_video_url', 'demo_video_url', 'is_published', 'is_featured']
    },
    {
      title: 'Xác nhận',
      description: 'Xem lại thông tin trước khi tạo',
      fields: []
    }
  ];

  // Level options
  const levelOptions = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'all_levels', label: 'All Levels' },
    { value: 'advanced', label: 'Advanced' }
  ];

  // Category options
  const categoryOptions = [
    { value: 1, label: 'Develop' },
    { value: 2, label: 'Design' },
    { value: 3, label: 'Marketing' },
    { value: 4, label: 'Develop' },
    { value: 5, label: 'Business' },
    { value: 6, label: 'Language' },
    { value: 7, label: 'Photo' },
    { value: 8, label: 'Music' },
    { value: 9, label: 'Personal' }
  ];

  // Form validation rules
  const validationRules = {
    title: [
      { required: true, message: 'Vui lòng nhập tên khóa học!' },
      { min: 5, message: 'Tên khóa học phải có ít nhất 5 ký tự!' },
      { max: 100, message: 'Tên khóa học không được quá 100 ký tự!' }
    ],
    description: [
      { required: true, message: 'Vui lòng nhập mô tả khóa học!' },
      { min: 20, message: 'Mô tả phải có ít nhất 20 ký tự!' }
    ],
    subtitle: [
      { max: 200, message: 'Phụ đề không được quá 200 ký tự!' }
    ],
    price: [
      { type: 'number', min: 0, message: 'Giá phải lớn hơn hoặc bằng 0!' }
    ],
    discount_price: [
      { type: 'number', min: 0, message: 'Giá giảm phải lớn hơn hoặc bằng 0!' }
    ],
    total_duration: [
      { type: 'number', min: 0, message: 'Thời lượng phải lớn hơn hoặc bằng 0!' }
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
  const handleThumbnailChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const handleVideoChange = ({ fileList: newVideoList }) => {
    setVideoList(newVideoList);
  };

  const handleDemoVideoChange = ({ fileList: newDemoVideoList }) => {
    setDemoVideoList(newDemoVideoList);
  };

  const thumbnailUploadProps = {
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
    onChange: handleThumbnailChange,
    fileList
  };

  const videoUploadProps = {
    name: 'file',
    multiple: false,
    accept: 'video/*',
    beforeUpload: (file) => {
      const isVideo = file.type.startsWith('video/');
      if (!isVideo) {
        message.error('Chỉ được upload file video!');
        return false;
      }
      const isLt100M = file.size / 1024 / 1024 < 100;
      if (!isLt100M) {
        message.error('Kích thước file phải nhỏ hơn 100MB!');
        return false;
      }
      return false; // Prevent auto upload
    },
    onChange: handleVideoChange,
    fileList: videoList
  };

  const demoVideoUploadProps = {
    name: 'file',
    multiple: false,
    accept: 'video/*',
    beforeUpload: (file) => {
      const isVideo = file.type.startsWith('video/');
      if (!isVideo) {
        message.error('Chỉ được upload file video!');
        return false;
      }
      const isLt100M = file.size / 1024 / 1024 < 100;
      if (!isLt100M) {
        message.error('Kích thước file phải nhỏ hơn 100MB!');
        return false;
      }
      return false; // Prevent auto upload
    },
    onChange: handleDemoVideoChange,
    fileList: demoVideoList
  };

  // Form submission
  const handleSubmit = async () => {
    try {
      setLoading('course', true);
      
      // Get all form values
      const values = await form.validateFields();
      const finalData = { ...formData, ...values };

      // Đảm bảo các trường boolean có giá trị mặc định
      finalData.is_published = true; // Luôn xuất bản khi tạo khóa học
      finalData.is_featured = finalData.is_featured || false;
      
      // Đảm bảo các trường số có giá trị hợp lệ
      if (finalData.price === undefined || finalData.price === null) {
        finalData.price = 0;
      }
      if (finalData.discount_price === undefined || finalData.discount_price === null) {
        finalData.discount_price = 0;
      }

      // Prepare FormData if files are present
      let courseData = finalData;
      let isFormData = false;

      if (fileList.length > 0 && fileList[0].originFileObj || videoList.length > 0 && videoList[0].originFileObj || demoVideoList.length > 0 && demoVideoList[0].originFileObj) {
        isFormData = true;
        const formData = new FormData();
        
        // Append all form fields
        Object.entries(finalData).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (typeof value === 'boolean') {
              formData.append(key, value.toString());
            } else if (typeof value === 'number') {
              formData.append(key, value.toString());
            } else if (key === 'requirements' || key === 'what_you_learn') {
              // Handle requirements and what_you_learn as string with newlines
              if (typeof value === 'string') {
                formData.append(key, value);
              } else if (Array.isArray(value)) {
                formData.append(key, value.join('\n'));
              }
            } else {
              formData.append(key, value);
            }
          }
        });

        // Append files with correct field names for Supabase
        if (fileList.length > 0 && fileList[0].originFileObj) {
          console.log('DEBUG: Appending thumbnail file:', fileList[0].originFileObj.name);
          formData.append('thumbnail', fileList[0].originFileObj);
        }
        if (videoList.length > 0 && videoList[0].originFileObj) {
          console.log('DEBUG: Appending preview video file:', videoList[0].originFileObj.name);
          formData.append('preview_video', videoList[0].originFileObj);
        }
        if (demoVideoList.length > 0 && demoVideoList[0].originFileObj) {
          console.log('DEBUG: Appending demo video file:', demoVideoList[0].originFileObj.name);
          formData.append('demo_video', demoVideoList[0].originFileObj);
        }

        // Debug: Log all FormData entries
        console.log('DEBUG: FormData contents:');
        for (let [key, value] of formData.entries()) {
          if (value instanceof File) {
            console.log(`${key}: [File] ${value.name} (${value.size} bytes)`);
          } else {
            console.log(`${key}:`, value);
          }
        }
        
        // Debug: Show example format
        console.log('DEBUG: Example FormData format:');
        console.log('const formData = new FormData();');
        console.log('');
        console.log('// Basic info');
        Object.entries(finalData).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '' && 
              !['requirements', 'what_you_learn'].includes(key)) {
            if (typeof value === 'string') {
              console.log(`formData.append('${key}', '${value}');`);
            } else if (typeof value === 'number') {
              console.log(`formData.append('${key}', '${value}');`);
            } else if (typeof value === 'boolean') {
              console.log(`formData.append('${key}', '${value}');`);
            }
          }
        });
        
        // Handle requirements and what_you_learn separately
        if (finalData.requirements) {
          console.log(`formData.append('requirements', '${finalData.requirements}');`);
        }
        if (finalData.what_you_learn) {
          console.log(`formData.append('what_you_learn', '${finalData.what_you_learn}');`);
        }
        
        console.log('');
        console.log('// Files');
        if (fileList.length > 0 && fileList[0].originFileObj) {
          console.log(`formData.append('thumbnail', imageFile); // File object`);
        }
        if (videoList.length > 0 && videoList[0].originFileObj) {
          console.log(`formData.append('preview_video', videoFile); // File object`);
        }
        if (demoVideoList.length > 0 && demoVideoList[0].originFileObj) {
          console.log(`formData.append('demo_video', demoVideoFile); // File object`);
        }
        
        console.log('');
        console.log('// Arrays as JSON strings hoặc separate values');
        if (finalData.requirements) {
          console.log(`formData.append('requirements', '${finalData.requirements}');`);
        }
        if (finalData.what_you_learn) {
          console.log(`formData.append('what_you_learn', '${finalData.what_you_learn}');`);
        }

        courseData = formData;
      }

      // Create course
      const result = await createCourse(courseData, isFormData);
      
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
            
            <Col span={24}>
              <Form.Item
                name="level"
                label="Cấp độ"
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

      case 1:
        return (
          <Row gutter={[24, 24]}>
            <Col span={24}>
              <Form.Item
                name="category_id"
                label="Danh mục"
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
          </Row>
        );

      case 2:
        return (
          <Row gutter={[24, 24]}>
            <Col span={24}>
              <Form.Item
                name="total_duration"
                label="Tổng thời lượng (phút)"
                rules={validationRules.total_duration}
              >
                <InputNumber
                  placeholder="120"
                  style={{ width: '100%' }}
                  size="large"
                />
              </Form.Item>
            </Col>
            
            <Col span={24}>
              <Form.Item
                name="requirements"
                label="Yêu cầu trước khi học"
              >
                <TextArea 
                  rows={4}
                  placeholder="Ví dụ: Kiến thức cơ bản về lập trình, Máy tính có kết nối internet..."
                />
              </Form.Item>
            </Col>
            
            <Col span={24}>
              <Form.Item
                name="what_you_learn"
                label="Bạn sẽ học được gì"
              >
                <TextArea 
                  rows={4}
                  placeholder="Ví dụ: Tạo ứng dụng Android cơ bản, Sử dụng Android Studio, Thiết kế giao diện người dùng..."
                />
              </Form.Item>
            </Col>
          </Row>
        );

      case 3:
        return (
          <Row gutter={[24, 24]}>
            <Col span={24}>
              <Form.Item
                name="thumbnail_url"
                label="Hình đại diện"
              >
                <Upload {...thumbnailUploadProps}>
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
                <Upload {...videoUploadProps}>
                  <Button icon={<UploadOutlined />}>Tải lên video giới thiệu</Button>
                </Upload>
                <div style={{ marginTop: 8, color: '#666', fontSize: '12px' }}>
                  Định dạng MP4/WebM, tối đa 100MB
                </div>
              </Form.Item>
            </Col>
            
            <Col span={24}>
              <Form.Item
                name="demo_video_url"
                label="Video demo"
              >
                <Upload {...demoVideoUploadProps}>
                  <Button icon={<UploadOutlined />}>Tải lên video demo</Button>
                </Upload>
                <div style={{ marginTop: 8, color: '#666', fontSize: '12px' }}>
                  Định dạng MP4/WebM, tối đa 100MB
                </div>
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

      case 4:
        return (
          <PreviewCard title="Xem lại thông tin khóa học">
            <div className="course-preview-header">
              <div className="course-thumbnail">
                {fileList.length > 0 ? (
                  <img 
                     src={fileList[0].originFileObj ? URL.createObjectURL(fileList[0].originFileObj) : fileList[0].url} 
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
            is_featured: false,
            is_published: false,
            price: 0,
            discount_price: 0,
            level: 'beginner',
            total_duration: 0,
            requirements: '',
            what_you_learn: ''
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
