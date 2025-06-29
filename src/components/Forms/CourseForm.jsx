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
import { uploadFile } from '../../services/upload';

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

  // Load course data for editing
  useEffect(() => {
    if (isEditing) {
      loadCourseData();
    }
  }, [id]);

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
        is_published: course.is_published,
        is_featured: course.is_featured,
        category_id: course.category_id
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
      let data = { ...values };
      // Chuẩn bị file cho FormData nếu có file mới
      if (thumbnailList[0]?.originFileObj || videoList[0]?.originFileObj) {
        isFormData = true;
        const formData = new FormData();
        Object.entries(values).forEach(([key, value]) => {
          formData.append(key, value);
        });
        if (thumbnailList[0]?.originFileObj) {
          formData.append('thumbnail', thumbnailList[0].originFileObj);
        } else if (thumbnailList[0]?.url) {
          formData.append('thumbnail_url', thumbnailList[0].url);
        }
        if (videoList[0]?.originFileObj) {
          formData.append('preview_video', videoList[0].originFileObj);
        } else if (videoList[0]?.url) {
          formData.append('preview_video_url', videoList[0].url);
        }
        data = formData;
      } else {
        data.thumbnail_url = thumbnailList[0]?.url;
        data.preview_video_url = videoList[0]?.url;
      }
      let result;
      if (isEditing) {
        result = await updateCourse(id, data, isFormData);
        message.success('Cập nhật khóa học thành công');
      } else {
        result = await createCourse(data);
        message.success('Tạo khóa học thành công');
      }

      // Navigate to course detail or management
      navigate(`/courses/${result.id || id}`);
      
    } catch (error) {
      console.error('Failed to save course:', error);
      message.error('Không thể lưu khóa học: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle save as draft
  const handleSaveDraft = () => {
    form.setFieldsValue({ is_published: false });
    form.submit();
  };

  // Handle publish
  const handlePublish = () => {
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
          level: 'Beginner',
          is_published: false,
          is_featured: false,
          price: 0
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
                      <Option value="Beginner">Cơ bản</Option>
                      <Option value="Intermediate">Trung cấp</Option>
                      <Option value="Advanced">Nâng cao</Option>
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
                  <Option value={1}>Lập trình Web</Option>
                  <Option value={2}>Mobile Development</Option>
                  <Option value={3}>Data Science</Option>
                  <Option value={4}>DevOps</Option>
                  <Option value={5}>UI/UX Design</Option>
                </Select>
              </Form.Item>

              <Divider />

              <Form.Item
                name="is_published"
                label="Trạng thái xuất bản"
                valuePropName="checked"
              >
                <Switch 
                  checkedChildren="Đã xuất bản" 
                  unCheckedChildren="Bản nháp"
                />
              </Form.Item>

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
                    onClick={handlePublish}
                    style={{ width: '100%' }}
                  >
                    {isEditing ? 'Lưu & Xuất bản' : 'Tạo & Xuất bản'}
                  </Button>
                  
                  <Button 
                    size="large"
                    icon={<SaveOutlined />}
                    loading={loading}
                    onClick={handleSaveDraft}
                    style={{ width: '100%' }}
                  >
                    {isEditing ? 'Lưu bản nháp' : 'Lưu bản nháp'}
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
