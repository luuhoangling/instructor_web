import React from 'react';
import { Layout as AntLayout, Menu, Button, Breadcrumb, notification, Dropdown, Avatar, Space, Typography } from 'antd';
import {
  DashboardOutlined,
  BookOutlined,
  PlusOutlined,
  UndoOutlined,
  RedoOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  ProfileOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import useCourseStore from '../../store/courseStore';
import { getCurrentUser, logout } from '../../services/authService';

const { Header, Sider, Content } = AntLayout;
const { Text } = Typography;

// Styled components
const StyledLayout = styled(AntLayout)`
  min-height: 100vh;
`;

const StyledHeader = styled(Header)`
  background: #fff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  z-index: 1;
  min-height: 64px;
`;

const StyledSider = styled(Sider)`
  background: #fff;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.06);
`;

const StyledContent = styled(Content)`
  padding: 24px;
  background: #f0f2f5;
  overflow-y: auto;
`;

const Logo = styled.div`
  font-size: 20px;
  font-weight: bold;
  color: #1890ff;
  margin-right: 24px;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const UndoRedoGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 8px;
  border-radius: 20px;
  background: #f5f5f5;
  cursor: pointer;
  transition: background 0.2s;
  min-width: 0;
  max-width: 220px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  height: 36px;
  box-sizing: border-box;

  &:hover {
    background: #e6f7ff;
  }

  .ant-avatar {
    flex-shrink: 0;
  }

  .ant-typography {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
    max-width: 120px;
  }
`;

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = getCurrentUser();

  // Zustand store
  const { undo, redo, canUndo, canRedo } = useCourseStore();

  // Menu items
  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/courses',
      icon: <BookOutlined />,
      label: 'Khóa học',
      children: [
        {
          key: '/courses/new',
          icon: <PlusOutlined />,
          label: 'Tạo khóa học mới',
        },
      ],
    },
  ];

  // User menu items
  const userMenuItems = [
    {
      key: 'profile',
      icon: <ProfileOutlined />,
      label: 'Thông tin cá nhân',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
    },
  ];

  // Get current selected menu key from pathname
  const getSelectedKey = () => {
    const { pathname } = location;

    // Exact matches
    if (pathname === '/') return ['/'];
    if (pathname === '/courses/new') return ['/courses/new'];
    if (pathname.startsWith('/courses/') && pathname.includes('/edit')) {
      return ['/courses'];
    }

    // Default fallback
    return [pathname];
  };

  // Get breadcrumb items
  const getBreadcrumbItems = () => {
    const { pathname } = location;
    const segments = pathname.split('/').filter(Boolean);

    const items = [{ title: 'Trang chủ' }];

    if (segments.length === 0) {
      return items;
    }

    if (segments[0] === 'courses') {
      items.push({ title: 'Khóa học' });

      if (segments[1] === 'new') {
        items.push({ title: 'Tạo mới' });
      } else if (segments[1] && segments[2] === 'edit') {
        items.push({ title: `Khóa học #${segments[1]}` });
        items.push({ title: 'Chỉnh sửa' });
      }
    }

    return items;
  };

  // Menu click handler
  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  // Undo/Redo handlers
  const handleUndo = () => {
    try {
      undo();
      notification.success({
        message: 'Đã hoàn tác',
        duration: 2,
      });
    } catch (error) {
      notification.error({
        message: 'Không thể hoàn tác',
        description: error.message,
      });
    }
  };

  const handleRedo = () => {
    try {
      redo();
      notification.success({
        message: 'Đã làm lại',
        duration: 2,
      });
    } catch (error) {
      notification.error({
        message: 'Không thể làm lại',
        description: error.message,
      });
    }
  };

  // Create new course handler
  const handleCreateCourse = () => {
    navigate('/courses/new');
  };

  // Handle user menu click
  const handleUserMenuClick = ({ key }) => {
    switch (key) {
      case 'logout':
        logout();
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'settings':
        navigate('/settings');
        break;
      default:
        break;
    }
  };

  return (
    <StyledLayout>
      {/* Sidebar */}
      <StyledSider width={250} collapsible>
        <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
          <Logo>KMB Web</Logo>
        </div>
        <Menu
          mode="inline"
          selectedKeys={getSelectedKey()}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ border: 'none' }}
        />
      </StyledSider>

      <AntLayout>
        {/* Header */}
        <StyledHeader>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Breadcrumb items={getBreadcrumbItems()} />
          </div>

          <HeaderActions>
            {/* Undo/Redo buttons - chỉ hiển thị khi có tree data */}
            {location.pathname.includes('/edit') && (
              <UndoRedoGroup>
                <Button
                  icon={<UndoOutlined />}
                  disabled={!canUndo()}
                  onClick={handleUndo}
                  title="Hoàn tác (Ctrl+Z)"
                >
                  Hoàn tác
                </Button>
                <Button
                  icon={<RedoOutlined />}
                  disabled={!canRedo()}
                  onClick={handleRedo}
                  title="Làm lại (Ctrl+Y)"
                >
                  Làm lại
                </Button>
              </UndoRedoGroup>
            )}

            {/* Create Course Button */}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateCourse}
            >
              Tạo khóa học
            </Button>

            {/* User Profile Dropdown */}
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleUserMenuClick,
              }}
              placement="bottomRight"
              trigger={['click']}
            >
              <UserInfo>
                <Avatar
                  src={currentUser?.avatar_url}
                  icon={<UserOutlined />}
                  size="small"
                />
                <Space direction="vertical" size={0}>
                  <Text strong style={{ fontSize: '14px', lineHeight: 1 }}>
                    {currentUser?.username || 'Giảng viên'}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px', lineHeight: 1 }}>
                    {currentUser?.bio || 'Giảng viên'}
                  </Text>
                </Space>
              </UserInfo>
            </Dropdown>
          </HeaderActions>
        </StyledHeader>

        {/* Main Content */}
        <StyledContent>
          {children}
        </StyledContent>
      </AntLayout>
    </StyledLayout>
  );
};

export default MainLayout;
