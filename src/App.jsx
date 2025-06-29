import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import viVN from 'antd/locale/vi_VN';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import CourseManagement from './pages/CourseManagement';
import CourseDetail from './pages/CourseDetail';
import CourseForm from './components/Forms/CourseForm';
import CreateCourse from './pages/CreateCourse';
import EditCourse from './pages/EditCourse';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import NotificationManager from './components/NotificationManager';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

// Ant Design theme configuration
const theme = {
  token: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#fa8c16',
    colorError: '#ff4d4f',
    borderRadius: 6,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  },
  components: {
    Layout: {
      siderBg: '#fff',
      headerBg: '#fff',
    },
    Menu: {
      itemBg: 'transparent',
      itemHoverBg: '#f5f5f5',
      itemSelectedBg: '#e6f7ff',
      itemSelectedColor: '#1890ff',
    },
    Tree: {
      nodeHoverBg: '#f5f5f5',
      nodeSelectedBg: '#e6f7ff',
    },
    Card: {
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    },
  },
};

function App() {
  return (
    <ErrorBoundary>
      <ConfigProvider 
        theme={theme} 
        locale={viVN}
      >
        <AntApp>
          <Router>
            <div className="App">
              <Routes>
                {/* Public route - Login */}
                <Route path="/login" element={<Login />} />
                
                {/* Protected routes - Main application */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                {/* Course Management Routes */}
                <Route path="/courses" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <CourseManagement />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/courses/new" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <CourseForm />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/courses/:id" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <CourseDetail />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/courses/:id/edit" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <CourseForm />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                {/* Legacy routes for backward compatibility */}
                <Route path="/courses/:courseId/edit" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <EditCourse />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                
                {/* Redirect legacy routes */}
                <Route path="/dashboard" element={<Navigate to="/" replace />} />
                
                {/* 404 fallback */}
                <Route path="*" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '100px 0',
                        fontSize: '18px',
                        color: '#999'
                      }}>
                        <h2>404 - Không tìm thấy trang</h2>
                        <p>Trang bạn đang tìm không tồn tại.</p>
                      </div>
                    </MainLayout>
                  </ProtectedRoute>
                } />
              </Routes>
              
              {/* Global notification manager */}
              <NotificationManager />
            </div>
          </Router>
        </AntApp>
      </ConfigProvider>
    </ErrorBoundary>
  );
}

export default App;
