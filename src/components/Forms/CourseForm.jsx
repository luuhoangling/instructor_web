import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Card, 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  Switch, 
  Button, 
  Space, 
  Typography, 
  Upload, 
  message,
  Row,
  Col,
  Divider,
  Spin
} from 'antd';
import { 
  SaveOutlined, 
  ArrowLeftOutlined, 
  UploadOutlined,
  EyeOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { createCourse, updateCourse, getCourse } from '../../services/api';
import { getCurrentUser } from '../../services/authService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const CourseForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [thumbnailList, setThumbnailList] = useState([]);
  const [videoList, setVideoList] = useState([]);
  const navigate = useNavigate();
  const { id } = useParams();
  
  const isEditing = !!id;
  const currentUser = getCurrentUser();

  // Load course data for editing
  useEffect(() => {
    if (isEditing) {
      loadCourseData();
    }
  }, [id]);

  // Set username when component mounts
  useEffect(() => {
    if (currentUser) {
      form.setFieldsValue({
        username: currentUser?.username || currentUser?.name || ''
      });
    }
  }, [currentUser, form]);

  const loadCourseData = async () => {
    setLoadingData(true);
    try {
      const course = await getCourse(id);
      
      // Populate form
      form.setFieldsValue({
        title: course.title,
        subtitle: course.subtitle,
        description: course.description,
        price: course.price,
        discount_price: course.discount_price,
        level: course.level,
        is_featured: course.is_featured,
        category_id: course.category_id,
        username: currentUser?.username || currentUser?.name || course.username || ''
      });

      // Set file lists
      if (course.thumbnail_url) {
        setThumbnailList([{
          uid: '-1',
          name: 'thumbnail.jpg',
          status: 'done',
          url: course.thumbnail_url,
        }]);
      }

      if (course.preview_video_url) {
        setVideoList([{
          uid: '-1',
          name: 'preview.mp4',
          status: 'done',
          url: course.preview_video_url,
        }]);
      }

    } catch (error) {
      console.error('Failed to load course:', error);
      message.error('Không thể tải thông tin khóa học: ' + error.message);
    } finally {
      setLoadingData(false);
    }
  };

  // Handle form submit
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      let isFormData = false;
      let data = { 
        ...values, 
        username: currentUser?.username || currentUser?.name || values.username 
      };
      
      // Remove ALL time-related fields completely
      const timeRelatedFields = [
        'created_at', 'updated_at', 'deleted_at', 'createdAt', 'updatedAt', 'deletedAt',
        'id', 'user_id', 'instructor_id', 'course_id',
        'timestamp', 'time', 'date', 'datetime', 'created', 'updated', 'modified'
      ];
      
      // Remove all time-related fields
      timeRelatedFields.forEach(field => {
        if (data[field]) {
          console.log(`DEBUG: Removing time field: ${field} = ${data[field]}`);
          delete data[field];
        }
      });
      
      // Remove any field that contains time/timestamp patterns
      Object.keys(data).forEach(key => {
        const value = data[key];
        if (value && typeof value === 'string' && (
          value.includes('T') || // Any field with T (time)
          value.includes('Z') || // Any field with Z (timezone)
          value.includes('+') && value.includes(':') || // Timezone offset
          /^\d{4}-\d{2}-\d{2}T/.test(value) || // ISO date with time
          /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(value) || // SQL datetime
          /time|date|created|updated|modified/i.test(key) // Field names with time keywords
        )) {
          console.log(`DEBUG: Removing time-related field: ${key} = ${value}`);
          delete data[key];
        }
      });
      
      // Remove empty or null values
      Object.keys(data).forEach(key => {
        if (data[key] === null || data[key] === undefined || data[key] === '') {
          console.log(`DEBUG: Removing empty field: ${key} = ${data[key]}`);
          delete data[key];
        }
      });
      
      // Only send allowed fields for course update - STRICT WHITELIST
      const allowedFields = [
        'title', 'subtitle', 'description', 'price', 'discount_price', 
        'level', 'category_id', 'username', 'is_featured', 'is_published',
        'thumbnail_url', 'preview_video_url', 'demo_video_url',
        'total_duration', 'requirements', 'what_you_learn'
      ];
      
      const cleanedData = {};
      allowedFields.forEach(field => {
        if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
          // Double check - no time fields allowed
          const value = data[field];
          if (typeof value === 'string' && (
            value.includes('T') || value.includes('Z') || 
            value.includes('+') || /^\d{4}-\d{2}-\d{2}T/.test(value)
          )) {
            console.error(`ERROR: Time field found in allowed field: ${field} = ${value}`);
            return; // Skip this field
          }
          cleanedData[field] = value;
        }
      });
      
      data = cleanedData;
      
      console.log('DEBUG: Final cleaned data (STRICT WHITELIST):');
      console.log(JSON.stringify(data, null, 2));
      
      // Debug: Log all data before processing
      console.log('DEBUG: Raw form data before processing:');
      console.log(JSON.stringify(data, null, 2));
      
      // Debug: Check for any remaining time fields
      console.log('DEBUG: Checking for any remaining time fields:');
      Object.entries(data).forEach(([key, value]) => {
        if (value && typeof value === 'string' && (
          value.includes('T') || value.includes('Z') || 
          value.includes('+') || /^\d{4}-\d{2}-\d{2}T/.test(value)
        )) {
          console.error(`ERROR: Found time field that should be removed: ${key} = ${value}`);
        }
      });

      // Prepare FormData if files are present
      if (thumbnailList[0]?.originFileObj || videoList[0]?.originFileObj) {
        isFormData = true;
        const formData = new FormData();
        
        // Append all form fields (only allowed fields)
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            // Skip ALL time-related fields
            if (typeof value === 'string' && (
              value.includes('T') || // Any field with T (time)
              value.includes('Z') || // Any field with Z (timezone)
              value.includes('+') && value.includes(':') || // Timezone offset
              /^\d{4}-\d{2}-\d{2}T/.test(value) || // ISO date with time
              /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(value) || // SQL datetime
              /time|date|created|updated|modified/i.test(key) // Field names with time keywords
            )) {
              console.log(`DEBUG: Skipping time field in FormData: ${key} = ${value}`);
              return;
            }
            
            if (typeof value === 'boolean') {
              formData.append(key, value.toString());
            } else if (typeof value === 'number') {
              formData.append(key, value.toString());
            } else if (value instanceof Date) {
              // Skip Date objects completely
              console.log(`DEBUG: Skipping Date object in FormData: ${key} = ${value}`);
              return;
            } else {
              formData.append(key, value);
            }
          }
        });

        // Append files with correct field names for Supabase
        if (thumbnailList[0]?.originFileObj) {
          console.log('DEBUG: Appending thumbnail file:', thumbnailList[0].originFileObj.name);
          formData.append('thumbnail', thumbnailList[0].originFileObj);
        } else if (thumbnailList[0]?.url) {
          console.log('DEBUG: Appending thumbnail URL:', thumbnailList[0].url);
          formData.append('thumbnail_url', thumbnailList[0].url);
        }

        if (videoList[0]?.originFileObj) {
          console.log('DEBUG: Appending video file:', videoList[0].originFileObj.name);
          formData.append('preview_video', videoList[0].originFileObj);
        } else if (videoList[0]?.url) {
          console.log('DEBUG: Appending video URL:', videoList[0].url);
          formData.append('preview_video_url', videoList[0].url);
        }

        // Debug: Log all FormData entries
        console.log('DEBUG: FormData contents:');
        for (let [key, value] of formData.entries()) {
          if (value instanceof File) {
            console.log(`${key}: [File] ${value.name} (${value.size} bytes)`);
          } else {
            console.log(`${key}:`, value, `(type: ${typeof value})`);
            
            // Check for time fields in FormData
            if (typeof value === 'string' && (
              value.includes('T') || value.includes('Z') || 
              value.includes('+') || /^\d{4}-\d{2}-\d{2}T/.test(value)
            )) {
              console.error(`ERROR: Found time field in FormData: ${key} = ${value}`);
            }
          }
        }
        
        // Debug: Check for timestamp fields that might cause issues
        console.log('DEBUG: Checking for timestamp fields in data:');
        Object.entries(data).forEach(([key, value]) => {
          if (value && (value instanceof Date || (typeof value === 'string' && value.includes('T')))) {
            console.log(`TIMESTAMP FIELD: ${key} = ${value} (type: ${typeof value})`);
          }
        });
        
        // Debug: Show example format
        console.log('DEBUG: Example FormData format:');
        console.log('const formData = new FormData();');
        console.log('');
        console.log('// Basic info');
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (typeof value === 'string') {
              console.log(`formData.append('${key}', '${value}');`);
            } else if (typeof value === 'number') {
              console.log(`formData.append('${key}', '${value}');`);
            } else if (typeof value === 'boolean') {
              console.log(`formData.append('${key}', '${value}');`);
            }
          }
        });
        
        console.log('');
        console.log('// Files');
        if (thumbnailList[0]?.originFileObj) {
          console.log(`formData.append('thumbnail', imageFile); // File object`);
        }
        if (videoList[0]?.originFileObj) {
          console.log(`formData.append('preview_video', videoFile); // File object`);
        }

        data = formData;
      } else {
        // No new files, just use existing URLs
        data.thumbnail_url = thumbnailList[0]?.url;
        data.preview_video_url = videoList[0]?.url;
        
        // Debug: Log JSON data being sent
        console.log('DEBUG: Sending JSON data (no files):');
        console.log(JSON.stringify(data, null, 2));
      }

      // Final debug before API call
      console.log('DEBUG: FINAL DATA BEING SENT TO API:');
      console.log('isFormData:', isFormData);
      if (isFormData) {
        console.log('FormData entries:');
        for (let [key, value] of data.entries()) {
          if (value instanceof File) {
            console.log(`${key}: [File] ${value.name}`);
          } else {
            console.log(`${key}: ${value} (type: ${typeof value})`);
          }
        }
      } else {
        console.log('JSON data:', JSON.stringify(data, null, 2));
      }
      
      let result;
      if (isEditing) {
        result = await updateCourse(id, data, isFormData);
        message.success('Cập nhật khóa học thành công');
      } else {
        result = await createCourse(data, isFormData);
        message.success('Tạo khóa học thành công');
      }

      // Navigate to course detail or management
      navigate(`/courses/${result.id || id}`);
      
    } catch (error) {
      console.error('Failed to save course:', error);
      
      // Debug: Log detailed error information
      if (error.response) {
        console.error('Server response status:', error.response.status);
        console.error('Server response data:', error.response.data);
        console.error('Server response headers:', error.response.headers);
      }
      
      // Show more detailed error message
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      message.error('Không thể lưu khóa học: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle save and publish
  const handleSaveAndPublish = () => {
    form.setFieldsValue({ is_published: true });
    form.submit();
  };

  // File upload handlers
  const handleThumbnailChange = (info) => {
    setThumbnailList(info.fileList.slice(-1));
  };

  const handleVideoChange = (info) => {
    setVideoList(info.fileList.slice(-1));
  };

  // Upload props
  const uploadProps = {
    beforeUpload: (file) => {
      // Validate file size (max 10MB for images, 100MB for videos)
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        message.error(`File quá lớn! Tối đa ${isVideo ? '100MB' : '10MB'}`);
        return Upload.LIST_IGNORE;
      }
      return true;
    },
    showUploadList: true,
    customRequest: ({ file, onSuccess }) => {
      // Không upload ở đây, upload khi onChange
      setTimeout(() => {
        onSuccess('ok');
      }, 0);
    },
  };

  if (loadingData) {
    return (
      <Layout.Content style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Đang tải thông tin khóa học...</div>
      </Layout.Content>
    );
  }

  return (
    <Layout.Content style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
          style={{ marginBottom: 16 }}
        >
          Quay lại
        </Button>
        <Title level={2}>
          {isEditing ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới'}
        </Title>
        <Text type="secondary">
          {isEditing ? 'Cập nhật thông tin khóa học' : 'Điền thông tin để tạo khóa học mới'}
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          level: 'beginner',
          is_featured: false,
          price: 0,
          username: currentUser?.username || currentUser?.name || ''
        }}
      >
        <Row gutter={24}>
          {/* Basic Information */}
          <Col span={16}>
            <Card title="Thông tin cơ bản" style={{ marginBottom: 24 }}>
              <Form.Item
                name="title"
                label="Tiêu đề khóa học"
                rules={[
                  { required: true, message: 'Vui lòng nhập tiêu đề khóa học' },
                  { max: 200, message: 'Tiêu đề không được quá 200 ký tự' }
                ]}
              >
                <Input 
                  placeholder="Ví dụ: Học Flutter từ A-Z"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="username"
                label="Tên giảng viên"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên giảng viên' },
                  { max: 100, message: 'Tên giảng viên không được quá 100 ký tự' }
                ]}
              >
                <Input 
                  placeholder="Tên giảng viên"
                  size="large"
                  readOnly
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                />
              </Form.Item>

              <Form.Item
                name="subtitle"
                label="Phụ đề"
                rules={[
                  { max: 300, message: 'Phụ đề không được quá 300 ký tự' }
                ]}
              >
                <Input 
                  placeholder="Mô tả ngắn gọn về khóa học"
                />
              </Form.Item>

              <Form.Item
                name="description"
                label="Mô tả chi tiết"
                rules={[
                  { required: true, message: 'Vui lòng nhập mô tả khóa học' }
                ]}
              >
                <TextArea 
                  rows={6}
                  placeholder="Mô tả chi tiết về nội dung, mục tiêu học tập..."
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="level"
                    label="Cấp độ"
                    rules={[
                      { required: true, message: 'Vui lòng chọn cấp độ' }
                    ]}
                  >
                    <Select size="large">
                      <Option value="beginner">Beginner</Option>
                      <Option value="intermediate">Intermediate</Option>
                      <Option value="all_levels">All Levels</Option>
                      <Option value="advanced">Advanced</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="price"
                    label="Giá gốc (VNĐ)"
                    rules={[
                      { required: true, message: 'Vui lòng nhập giá khóa học' },
                      { type: 'number', min: 0, message: 'Giá phải lớn hơn hoặc bằng 0' }
                    ]}
                  >
                    <InputNumber 
                      style={{ width: '100%' }}
                      size="large"
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/\$\s?|(,*)/g, '')}
                      placeholder="0"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="discount_price"
                    label="Giá ưu đãi (VNĐ)"
                    rules={[
                      { type: 'number', min: 0, message: 'Giá phải lớn hơn hoặc bằng 0' }
                    ]}
                  >
                    <InputNumber 
                      style={{ width: '100%' }}
                      size="large"
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/\$\s?|(,*)/g, '')}
                      placeholder="Để trống nếu không có ưu đãi"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Media */}
            <Card title="Hình ảnh & Video" style={{ marginBottom: 24 }}>
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    label="Hình đại diện"
                    extra="Kích thước khuyến nghị: 1280x720px, định dạng JPG/PNG, tối đa 10MB"
                  >
                    <Upload
                      {...uploadProps}
                      listType="picture-card"
                      fileList={thumbnailList}
                      onChange={handleThumbnailChange}
                      accept="image/*"
                      maxCount={1}
                    >
                      {thumbnailList.length === 0 && (
                        <div>
                          <UploadOutlined />
                          <div style={{ marginTop: 8 }}>Tải lên</div>
                        </div>
                      )}
                    </Upload>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Video giới thiệu"
                    extra="Định dạng MP4/WebM, tối đa 100MB"
                  >
                    <Upload
                      {...uploadProps}
                      fileList={videoList}
                      onChange={handleVideoChange}
                      accept="video/*"
                      maxCount={1}
                    >
                      <Button icon={<PlayCircleOutlined />}>
                        Tải video giới thiệu
                      </Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* Settings */}
          <Col span={8}>
            <Card title="Cài đặt" style={{ marginBottom: 24 }}>
              <Form.Item
                name="category_id"
                label="Danh mục"
                rules={[
                  { required: true, message: 'Vui lòng chọn danh mục' }
                ]}
              >
                <Select placeholder="Chọn danh mục">
                  <Option value={1}>Develop</Option>
                  <Option value={2}>Design</Option>
                  <Option value={3}>Marketing</Option>
                  <Option value={4}>Develop</Option>
                  <Option value={5}>Business</Option>
                  <Option value={6}>Language</Option>
                  <Option value={7}>Photo</Option>
                  <Option value={8}>Music</Option>
                  <Option value={9}>Personal</Option>
                </Select>
              </Form.Item>

              <Divider />


              <Form.Item
                name="is_featured"
                label="Khóa học nổi bật"
                valuePropName="checked"
              >
                <Switch 
                  checkedChildren="Có" 
                  unCheckedChildren="Không"
                />
              </Form.Item>

              <Divider />

              <div style={{ textAlign: 'center' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button 
                    type="primary" 
                    size="large"
                    icon={<SaveOutlined />}
                    loading={loading}
                    onClick={handleSaveAndPublish}
                    style={{ width: '100%' }}
                  >
                    {isEditing ? 'Lưu & Xuất bản' : 'Tạo & Xuất bản'}
                  </Button>

                  {isEditing && (
                    <Button 
                      type="link"
                      icon={<EyeOutlined />}
                      onClick={() => navigate(`/courses/${id}`)}
                    >
                      Xem khóa học
                    </Button>
                  )}
                </Space>
              </div>
            </Card>
          </Col>
        </Row>
      </Form>
    </Layout.Content>
  );
};

export default CourseForm;

