import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Card, 
  Table, 
  Button, 
  Space, 
  Typography, 
  Tag, 
  Popconfirm, 
  message,
  Row,
  Col,
  Statistic,
  Input,
  Select,
  Dropdown,
  Modal
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  SearchOutlined,
  FilterOutlined,
  MoreOutlined,
  BookOutlined,
  UserOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getCourses, deleteCourse, getRevenueStats } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import styled from 'styled-components';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

// Styled components
const PageContainer = styled.div`
  background: #f8fafc;
  min-height: 100vh;
  padding: 0;
`;

const HeaderSection = styled.div`
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  padding: 32px;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 32px;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const StatCard = styled(Card)`
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 10px -2px rgba(0, 0, 0, 0.06);
  }
`;

const ContentSection = styled.div`
  padding: 0 32px 32px;
`;

const FilterSection = styled.div`
  background: #ffffff;
  padding: 24px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  margin-bottom: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const TableContainer = styled.div`
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
`;

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [revenueStats, setRevenueStats] = useState({
    totalRevenue: 0,
    totalStudents: 0,
    totalCourses: 0
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    level: '',
    sortBy: 'created_at',
    sortOrder: 'DESC'
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const navigate = useNavigate();

  // Load courses
  const loadCourses = async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        _page: params.current || pagination.current,
        _limit: params.pageSize || pagination.pageSize,
        _sort: filters.sortBy,
        _order: filters.sortOrder,
        ...params.filters
      };

      // Add search filter
      if (filters.search) {
        queryParams.title_like = filters.search;
      }

      // Add level filter
      if (filters.level) {
        queryParams.level = filters.level;
      }


      const result = await getCourses(queryParams);
      
      setCourses(result.data || []);
      setPagination(prev => ({
        ...prev,
        current: params.current || prev.current,
        total: result.total || 0
      }));
    } catch (error) {
      console.error('Failed to load courses:', error);
      message.error('Không thể tải danh sách khóa học: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load revenue statistics
  const loadRevenueStats = async () => {
    try {
      const stats = await getRevenueStats();
      setRevenueStats({
        totalRevenue: stats.totalRevenue || 0,
        totalStudents: stats.totalStudents || 0,
        totalCourses: stats.totalCourses || 0
      });
    } catch (error) {
      console.error('Failed to load revenue stats:', error);
      // Fallback: calculate from current courses data
      // Note: student_count may not be available in current course data
      // This is a simplified calculation and should be updated when backend provides student_count
      const totalRevenue = courses.reduce((sum, course) => {
        const price = course.discount_price || course.price || 0;
        const students = course.student_count || 0; // Backend should provide this field
        return sum + (price * students);
      }, 0);
      
      setRevenueStats({
        totalRevenue,
        totalStudents: courses.reduce((sum, c) => sum + (c.student_count || 0), 0),
        totalCourses: courses.length
      });
    }
  };

  // Initial load
  useEffect(() => {
    loadCourses();
    loadRevenueStats();
  }, []);

  // Reload revenue stats when courses change
  useEffect(() => {
    if (courses.length > 0) {
      loadRevenueStats();
    }
  }, [courses]);

  // Handle search
  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
    loadCourses({ 
      current: 1, 
      filters: { ...filters, search: value }
    });
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    loadCourses({ 
      current: 1, 
      filters: newFilters 
    });
  };

  // Handle table change (pagination, sorting)
  const handleTableChange = (paginationInfo, filtersInfo, sorter) => {
    const newPagination = {
      current: paginationInfo.current,
      pageSize: paginationInfo.pageSize
    };

    let newFilters = { ...filters };
    if (sorter.field) {
      newFilters.sortBy = sorter.field;
      newFilters.sortOrder = sorter.order === 'ascend' ? 'ASC' : 'DESC';
    }

    setFilters(newFilters);
    setPagination(prev => ({ ...prev, ...newPagination }));
    loadCourses({ ...newPagination, filters: newFilters });
  };

  // Handle delete course
  const handleDelete = async (courseId) => {
    try {
      await deleteCourse(courseId);
      message.success('Xóa khóa học thành công');
      loadCourses();
    } catch (error) {
      console.error('Failed to delete course:', error);
      message.error('Không thể xóa khóa học: ' + error.message);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedRowKeys.map(id => deleteCourse(id)));
      message.success(`Đã xóa ${selectedRowKeys.length} khóa học`);
      setSelectedRowKeys([]);
      loadCourses();
    } catch (error) {
      console.error('Failed to bulk delete:', error);
      message.error('Không thể xóa khóa học: ' + error.message);
    }
  };


  // Level tag
  const getLevelTag = (level) => {
    const colors = {
      'beginner': 'blue',
      'intermediate': 'orange',
      'all_levels': 'green',
      'advanced': 'red'
    };
    const labels = {
      'beginner': 'Beginner',
      'intermediate': 'Intermediate',
      'all_levels': 'All Levels',
      'advanced': 'Advanced'
    };
    return <Tag color={colors[level]}>{labels[level] || level}</Tag>;
  };

  // Action menu for each course
  const getActionMenu = (course) => ({
    items: [
      {
        key: 'view',
        icon: <EyeOutlined />,
        label: 'Xem chi tiết',
        onClick: () => navigate(`/courses/${course.id}`)
      },
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: 'Chỉnh sửa',
        onClick: () => navigate(`/courses/${course.id}/edit`)
      },
      {
        type: 'divider'
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: 'Xóa',
        danger: true,
        onClick: () => {
          Modal.confirm({
            title: 'Xác nhận xóa',
            content: `Bạn có chắc chắn muốn xóa khóa học "${course.title}"?`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: () => handleDelete(course.id)
          });
        }
      }
    ]
  });

  // Table columns
  const columns = [
    {
      title: 'Khóa học',
      dataIndex: 'title',
      key: 'title',
      sorter: true,
      render: (title, record) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{title}</div>
          {record.subtitle && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.subtitle}
            </Text>
          )}
        </div>
      )
    },
    {
      title: 'Cấp độ',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level) => getLevelTag(level)
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      sorter: true,
      render: (price, record) => (
        <div>
          {record.discount_price && record.discount_price < price ? (
            <>
              <div style={{ textDecoration: 'line-through', color: '#999' }}>
                {formatCurrency(price)}
              </div>
              <div style={{ color: '#f5222d', fontWeight: 'bold' }}>
                {formatCurrency(record.discount_price)}
              </div>
            </>
          ) : (
            <div style={{ fontWeight: 'bold' }}>
              {formatCurrency(price)}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Học viên',
      dataIndex: 'student_count',
      key: 'student_count',
      width: 100,
      render: (count) => (
        <div style={{ textAlign: 'center' }}>
          <UserOutlined style={{ marginRight: 4 }} />
          {count || 0}
        </div>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      sorter: true,
      render: (date) => formatDate(date)
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 60,
      render: (_, record) => (
        <Dropdown menu={getActionMenu(record)} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      )
    }
  ];

  // Row selection
  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
    ]
  };

  // Calculate statistics
  const stats = {
    total: courses.length,
    totalRevenue: revenueStats.totalRevenue,
    totalStudents: revenueStats.totalStudents
  };

  return (
    <PageContainer>
      {/* Header */}
      <HeaderSection>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0, color: '#1f2937' }}>
              <BookOutlined style={{ marginRight: 12, color: '#6366f1' }} />
              Quản lý khóa học
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Quản lý tất cả khóa học của bạn
            </Text>
          </Col>
          <Col>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => navigate('/courses/new')}
              size="large"
              style={{
                height: '48px',
                borderRadius: '12px',
                fontWeight: '600',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
              }}
            >
              Tạo khóa học mới
            </Button>
          </Col>
        </Row>
      </HeaderSection>

      <ContentSection>
        {/* Statistics */}
        <StatsContainer>
          <StatCard>
            <Statistic 
              title="Tổng khóa học" 
              value={stats.total} 
              prefix={<BookOutlined style={{ color: '#6366f1' }} />}
              valueStyle={{ color: '#1f2937', fontWeight: '600' }}
            />
          </StatCard>
          <StatCard>
            <Statistic 
              title="Tổng doanh thu" 
              value={stats.totalRevenue}
              formatter={(value) => formatCurrency(value)}
              prefix={<DollarOutlined style={{ color: '#10b981' }} />}
              valueStyle={{ color: '#1f2937', fontWeight: '600' }}
            />
            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
              Từ {stats.totalStudents} học viên
            </Text>
          </StatCard>
        </StatsContainer>


        {/* Filters and Actions */}
        <FilterSection>
          <Row justify="space-between" align="middle">
            <Col>
              <Space size="middle">
                <Search
                  placeholder="Tìm kiếm khóa học..."
                  allowClear
                  onSearch={handleSearch}
                  style={{ 
                    width: 300,
                    borderRadius: '8px'
                  }}
                  size="large"
                />
                <Select
                  placeholder="Cấp độ"
                  allowClear
                  style={{ width: 150 }}
                  onChange={(value) => handleFilterChange('level', value)}
                  size="large"
                >
                  <Option value="beginner">Beginner</Option>
                  <Option value="intermediate">Intermediate</Option>
                  <Option value="all_levels">All Levels</Option>
                  <Option value="advanced">Advanced</Option>
                </Select>
              </Space>
            </Col>
            <Col>
              <Space>
                {selectedRowKeys.length > 0 && (
                  <Popconfirm
                    title={`Xóa ${selectedRowKeys.length} khóa học đã chọn?`}
                    onConfirm={handleBulkDelete}
                  okText="Xóa"
                  cancelText="Hủy"
                >
                  <Button danger>
                    Xóa đã chọn ({selectedRowKeys.length})
                  </Button>
                </Popconfirm>
              )}
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => navigate('/courses/new')}
              >
                Tạo khóa học mới
              </Button>
            </Space>
          </Col>
        </Row>
      </FilterSection>

        {/* Courses Table */}
        <TableContainer>
          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={courses}
            rowKey="id"
            loading={loading}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} của ${total} khóa học`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 1000 }}
            style={{
              borderRadius: '16px',
              overflow: 'hidden'
            }}
          />
        </TableContainer>
      </ContentSection>
    </PageContainer>
  );
};

export default CourseManagement;
