import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Alert, Typography, Divider } from 'antd';
import { UserOutlined, LockOutlined, BookOutlined } from '@ant-design/icons';
import { login, isAuthenticated } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const { Title, Text } = Typography;

const Login = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Redirect nếu đã đăng nhập
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (values) => {
    setLoading(true);
    setError('');

    try {
      // Map username_acc từ form thành username cho server
      const result = await login(values.username_acc, values.password);
      
      console.log('Login successful:', result);
      
      // Redirect về trang chính sau khi đăng nhập thành công
      navigate('/', { replace: true });
      
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background"></div>
      <div className="login-content">
        <Card className="login-card" bordered={false}>
          <div className="login-header">
            <BookOutlined className="login-icon" />
            <Title level={2} className="login-title">
              Hệ Thống Quản Lý Khóa Học
            </Title>
            <Text type="secondary" className="login-subtitle">
              Dành cho giảng viên
            </Text>
          </div>

          <Divider />

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              onClose={() => setError('')}
              style={{ marginBottom: 24 }}
            />
          )}

          <Form
            form={form}
            name="login"
            onFinish={handleLogin}
            layout="vertical"
            size="large"
            autoComplete="off"
          >
            <Form.Item
              name="username_acc"
              label="Tên tài khoản"
              rules={[
                {
                  required: true,
                  message: 'Vui lòng nhập tên tài khoản!',
                }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Nhập tên tài khoản (ví dụ: tk1)"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                {
                  required: true,
                  message: 'Vui lòng nhập mật khẩu!',
                }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="login-button"
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
