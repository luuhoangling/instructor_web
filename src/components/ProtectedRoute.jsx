import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import { LoadingOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { isAuthenticated, isInstructor, getCurrentUser, verifyToken, logout } from '../services/authService';

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const validateAuth = async () => {
      try {
        // Kiểm tra xem có token và user data không
        if (!isAuthenticated()) {
          setLoading(false);
          return;
        }

        // Kiểm tra xem user có phải giảng viên không
        if (!isInstructor()) {
          setError('Chỉ giảng viên mới được phép truy cập hệ thống này');
          setLoading(false);
          return;
        }

        // Verify token với server (tuỳ chọn)
        try {
          await verifyToken();
          setIsValid(true);
        } catch (verifyError) {
          console.warn('Token verification failed, but continuing with local auth');
          // Nếu verify thất bại nhưng vẫn có local auth, tiếp tục
          setIsValid(true);
        }

      } catch (err) {
        console.error('Auth validation error:', err);
        setError('Phiên đăng nhập không hợp lệ');
      } finally {
        setLoading(false);
      }
    };

    validateAuth();
  }, [location.pathname]);

  // Hiển thị loading spinner
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <Spin 
          size="large" 
          indicator={<LoadingOutlined style={{ fontSize: 48, color: '#1890ff' }} />}
          tip="Đang xác thực..."
        />
      </div>
    );
  }

  // Hiển thị lỗi nếu không phải giảng viên
  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '20px'
      }}>
        <Result
          icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
          title="Không có quyền truy cập"
          subTitle={error}
          extra={[
            <Button type="primary" key="logout" onClick={logout}>
              Đăng xuất
            </Button>,
            <Button key="back" onClick={() => window.history.back()}>
              Quay lại
            </Button>
          ]}
        />
      </div>
    );
  }

  // Redirect về login nếu chưa đăng nhập
  if (!isAuthenticated() || !isValid) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render component con nếu đã authenticated
  return children;
};

export default ProtectedRoute;
