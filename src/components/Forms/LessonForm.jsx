import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  Switch, 
  Button, 
  Space, 
  Upload,
  message,
  Tabs
} from 'antd';
import { UploadOutlined, PlayCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import { createLesson, updateLesson } from '../../services/api';

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const LessonForm = ({ courseId, sectionId, lesson, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [contentType, setContentType] = useState('video');
  const [fileList, setFileList] = useState([]);

  const isEditing = !!lesson;

  useEffect(() => {
    if (lesson) {
      form.setFieldsValue({
        title: lesson.title,
        description: lesson.description,
        content_type: lesson.content_type,
        content_text: lesson.content_text,
        duration: lesson.duration,
        is_free: lesson.is_free,
        can_preview: lesson.can_preview,
        order_index: lesson.order_index
      });
      setContentType(lesson.content_type);
      // Chỉ set fileList nếu có content_url thực tế (không phải blob:)
      if (lesson.content_url && !lesson.content_url.startsWith('blob:')) {
        setFileList([{
          uid: '-1',
          name: lesson.content_type === 'video' ? 'video.mp4' : 'file.pdf',
          status: 'done',
          url: lesson.content_url,
        }]);
      } else {
        setFileList([]);
      }
    }
  }, [lesson, form]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      let response;
      if (contentType === 'video' && fileList.length > 0) {
        const fileObj = fileList[0].originFileObj || fileList[0];
        console.log('[DEBUG] fileList:', fileList);
        console.log('[DEBUG] fileObj:', fileObj);
        if (!(fileObj instanceof File)) {
          message.error('File video không hợp lệ!');
          setLoading(false);
          return;
        }
        const formData = new FormData();
        formData.append('title', values.title);
        formData.append('description', values.description || '');
        formData.append('content_type', values.content_type);
        formData.append('order_index', values.order_index);
        formData.append('duration', values.duration || 0);
        formData.append('is_free', values.is_free);
        formData.append('can_preview', values.can_preview);
        formData.append('section_id', sectionId);
        formData.append('course_id', courseId);
        formData.append('video', fileObj);
        // Debug log FormData
        for (let pair of formData.entries()) {
          console.log(`[DEBUG] FormData: ${pair[0]} =`, pair[1]);
        }
        if (isEditing) {
          response = await updateLesson(lesson.id, formData, true);
          message.success('Cập nhật bài học thành công');
        } else {
          response = await createLesson(sectionId, formData, true);
          message.success('Tạo bài học thành công');
        }
        console.log('[DEBUG] Server response:', response);
      } else {
        const lessonData = {
          ...values,
          content_url: fileList[0]?.url || fileList[0]?.response?.url,
          section_id: sectionId,
          course_id: courseId
        };
        console.log('[DEBUG] lessonData (no video):', lessonData);
        if (isEditing) {
          await updateLesson(lesson.id, lessonData);
          message.success('Cập nhật bài học thành công');
        } else {
          await createLesson(sectionId, lessonData);
          message.success('Tạo bài học thành công');
        }
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save lesson:', error);
      message.error('Không thể lưu bài học: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (info) => {
    console.log('[DEBUG] handleFileChange info:', info);
    setFileList(info.fileList);
    if (info.file.status === 'done') {
      message.success(`${info.file.name} tải lên thành công`);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} tải lên thất bại`);
    }
  };

  // Bỏ customRequest, chỉ chọn file, không upload lên server ngay
  const uploadProps = {
    beforeUpload: (file) => {
      const maxSize = contentType === 'video' ? 500 * 1024 * 1024 : 50 * 1024 * 1024;
      if (file.size > maxSize) {
        message.error(`File quá lớn! Tối đa ${contentType === 'video' ? '500MB' : '50MB'}`);
        return false;
      }
      return true;
    },
    onRemove: (file) => {
      setFileList([]);
    },
    onChange: (info) => {
      // Chỉ giữ file cuối cùng
      setFileList(info.fileList.slice(-1));
    },
    fileList: fileList,
    maxCount: 1,
    accept: contentType === 'video' ? 'video/*' : '.pdf,.doc,.docx,.ppt,.pptx',
    showUploadList: true,
    customRequest: ({ onSuccess }) => {
      // Không upload ngay, chỉ giả lập thành công để hiển thị file
      setTimeout(() => {
        onSuccess('ok');
      }, 0);
    }
  };

  const renderContentFields = () => {
    switch (contentType) {
      case 'video':
        return (
          <Form.Item
            label="Video bài học"
            extra="Định dạng MP4/WebM, tối đa 500MB"
          >
            <Upload
              {...uploadProps}
              fileList={fileList}
              onChange={handleFileChange}
              accept="video/*"
              maxCount={1}
            >
              <Button icon={<PlayCircleOutlined />}>
                Tải video bài học
              </Button>
            </Upload>
          </Form.Item>
        );
      
      case 'text':
        return (
          <Form.Item
            name="content_text"
            label="Nội dung bài học"
            rules={[
              { required: true, message: 'Vui lòng nhập nội dung bài học' }
            ]}
          >
            <TextArea 
              rows={10}
              placeholder="Nhập nội dung bài học dạng text..."
            />
          </Form.Item>
        );
      
      case 'file':
        return (
          <Form.Item
            label="File tài liệu"
            extra="Định dạng PDF/DOC/PPT, tối đa 50MB"
          >
            <Upload
              {...uploadProps}
              fileList={fileList}
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.ppt,.pptx"
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>
                Tải file tài liệu
              </Button>
            </Upload>
          </Form.Item>
        );
      
      default:
        return null;
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        content_type: 'video',
        is_free: false,
        can_preview: false,
        order_index: 1,
        duration: 0
      }}
    >
      <Tabs defaultActiveKey="basic">
        <TabPane tab="Thông tin cơ bản" key="basic">
          <Form.Item
            name="title"
            label="Tiêu đề bài học"
            rules={[
              { required: true, message: 'Vui lòng nhập tiêu đề bài học' },
              { max: 200, message: 'Tiêu đề không được quá 200 ký tự' }
            ]}
          >
            <Input placeholder="Ví dụ: Cài đặt Flutter SDK" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả bài học"
            rules={[
              { max: 500, message: 'Mô tả không được quá 500 ký tự' }
            ]}
          >
            <TextArea 
              rows={3}
              placeholder="Mô tả ngắn gọn về nội dung bài học..."
            />
          </Form.Item>

          <Form.Item
            name="content_type"
            label="Loại nội dung"
            rules={[
              { required: true, message: 'Vui lòng chọn loại nội dung' }
            ]}
          >
            <Select 
              onChange={setContentType}
              placeholder="Chọn loại nội dung"
            >
              <Option value="video">
                <PlayCircleOutlined /> Video
              </Option>
              <Option value="text">
                <FileTextOutlined /> Text
              </Option>
              <Option value="file">
                <UploadOutlined /> File tài liệu
              </Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="order_index"
            label="Thứ tự"
            rules={[
              { required: true, message: 'Vui lòng nhập thứ tự' },
              { type: 'number', min: 1, message: 'Thứ tự phải lớn hơn 0' }
            ]}
          >
            <InputNumber 
              style={{ width: '100%' }}
              placeholder="1"
              min={1}
            />
          </Form.Item>

          {contentType === 'video' && (
            <Form.Item
              name="duration"
              label="Thời lượng (giây)"
              rules={[
                { type: 'number', min: 0, message: 'Thời lượng phải lớn hơn hoặc bằng 0' }
              ]}
            >
              <InputNumber 
                style={{ width: '100%' }}
                placeholder="0"
                min={0}
              />
            </Form.Item>
          )}
        </TabPane>

        <TabPane tab="Nội dung" key="content">
          {renderContentFields()}
        </TabPane>

        <TabPane tab="Cài đặt" key="settings">
          <Form.Item
            name="is_free"
            label="Bài học miễn phí"
            valuePropName="checked"
          >
            <Switch 
              checkedChildren="Miễn phí" 
              unCheckedChildren="Trả phí"
            />
          </Form.Item>

          <Form.Item
            name="can_preview"
            label="Cho phép xem trước"
            valuePropName="checked"
          >
            <Switch 
              checkedChildren="Có" 
              unCheckedChildren="Không"
            />
          </Form.Item>
        </TabPane>
      </Tabs>

      <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
        <Space>
          <Button onClick={onCancel}>
            Hủy
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {isEditing ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default LessonForm;
