import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  InputNumber, 
  Button, 
  Space, 
  message 
} from 'antd';
import { createSection, updateSection } from '../../services/api';

const { TextArea } = Input;

const SectionForm = ({ courseId, section, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const isEditing = !!section;

  useEffect(() => {
    if (section) {
      form.setFieldsValue({
        title: section.title,
        description: section.description,
        order_index: section.order_index
      });
    }
  }, [section, form]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (isEditing) {
        await updateSection(section.id, values);
        message.success('Cập nhật chương thành công');
      } else {
        await createSection(courseId, values);
        message.success('Tạo chương thành công');
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save section:', error);
      message.error('Không thể lưu chương: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        order_index: 1
      }}
    >
      <Form.Item
        name="title"
        label="Tiêu đề chương"
        rules={[
          { required: true, message: 'Vui lòng nhập tiêu đề chương' },
          { max: 200, message: 'Tiêu đề không được quá 200 ký tự' }
        ]}
      >
        <Input placeholder="Ví dụ: Giới thiệu Flutter" />
      </Form.Item>

      <Form.Item
        name="description"
        label="Mô tả chương"
        rules={[
          { max: 500, message: 'Mô tả không được quá 500 ký tự' }
        ]}
      >
        <TextArea 
          rows={3}
          placeholder="Mô tả ngắn gọn về nội dung chương này..."
        />
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

export default SectionForm;
