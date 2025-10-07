import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Alert, Typography, Divider } from 'antd';
import { UserOutlined, LockOutlined, BookOutlined } from '@ant-design/icons';
import { login, isAuthenticated } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import './Login.css';

// Styled components
const LoginContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const LoginCard = styled(Card)`
  width: 100%;
  max-width: 400px;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
  
  .ant-card-body {
    padding: 40px;
  }
`;

const LogoSection = styled.div`
  text-align: center;
  margin-bottom: 32px;
  
  .logo-icon {
    font-size: 48px;
    color: #6366f1;
    margin-bottom: 16px;
  }
  
  .logo-text {
    font-size: 28px;
    font-weight: 700;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 8px;
  }
  
  .logo-subtitle {
    color: #6b7280;
    font-size: 16px;
  }
`;

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
    <LoginContainer>
      <LoginCard bordered={false}>
        <LogoSection>
          <BookOutlined className="logo-icon" />
          <div className="logo-text">
            Hệ Thống Quản Lý Khóa Học
          </div>
          <div className="logo-subtitle">
            Dành cho giảng viên
          </div>
        </LogoSection>

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
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;
