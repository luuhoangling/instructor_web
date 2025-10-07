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
import ProfilePage from './pages/ProfilePage';

// Ant Design theme configuration - Modern Design
const theme = {
  token: {
    colorPrimary: '#6366f1', // Modern indigo
    colorSuccess: '#10b981', // Modern emerald
    colorWarning: '#f59e0b', // Modern amber
    colorError: '#ef4444', // Modern red
    colorInfo: '#3b82f6', // Modern blue
    borderRadius: 12, // More rounded corners
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
    fontSize: 14,
    lineHeight: 1.6,
    colorText: '#1f2937',
    colorTextSecondary: '#6b7280',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f8fafc',
  },
  components: {
    Layout: {
      siderBg: '#ffffff',
      headerBg: '#ffffff',
      bodyBg: '#f8fafc',
    },
    Menu: {
      itemBg: 'transparent',
      itemHoverBg: '#f1f5f9',
      itemSelectedBg: '#e0e7ff',
      itemSelectedColor: '#6366f1',
      itemActiveBg: '#e0e7ff',
      borderRadius: 8,
    },
    Tree: {
      nodeHoverBg: '#f1f5f9',
      nodeSelectedBg: '#e0e7ff',
      nodeSelectedColor: '#6366f1',
    },
    Card: {
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      borderRadius: 12,
      headerBg: '#f8fafc',
    },
    Button: {
      borderRadius: 8,
      fontWeight: 500,
    },
    Input: {
      borderRadius: 8,
    },
    Select: {
      borderRadius: 8,
    },
    Table: {
      borderRadius: 12,
      headerBg: '#f8fafc',
    },
    Tag: {
      borderRadius: 6,
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
                
                {/* Profile route */}
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ProfilePage />
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
