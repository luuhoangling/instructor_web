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
  PlayCircleOutlined,
  UserOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getCourses, deleteCourse, getRevenueStats } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

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
    status: '',
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

      // Add status filter
      if (filters.status !== '') {
        queryParams.is_published = filters.status === 'published';
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

  // Course status tag
  const getStatusTag = (course) => {
    if (course.is_published) {
      return <Tag color="green">Đã xuất bản</Tag>;
    }
    return <Tag color="orange">Bản nháp</Tag>;
  };

  // Level tag
  const getLevelTag = (level) => {
    const colors = {
      'Beginner': 'blue',
      'Intermediate': 'orange', 
      'Advanced': 'red'
    };
    const labels = {
      'Beginner': 'Cơ bản',
      'Intermediate': 'Trung cấp',
      'Advanced': 'Nâng cao'
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
      title: 'Trạng thái',
      dataIndex: 'is_published',
      key: 'is_published',
      width: 120,
      render: (_, record) => getStatusTag(record)
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
    published: courses.filter(c => c.is_published).length,
    draft: courses.filter(c => !c.is_published).length,
    totalRevenue: revenueStats.totalRevenue,
    totalStudents: revenueStats.totalStudents
  };

  return (
    <Layout.Content style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <BookOutlined style={{ marginRight: 8 }} />
          Quản lý khóa học
        </Title>
        <Text type="secondary">
          Quản lý tất cả khóa học của bạn
        </Text>
      </div>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card>
            <Statistic 
              title="Tổng khóa học" 
              value={stats.total} 
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic 
              title="Tổng doanh thu" 
              value={stats.totalRevenue}
              formatter={(value) => formatCurrency(value)}
              prefix={<DollarOutlined />}
            />
            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
              Từ {stats.totalStudents} học viên
            </Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card>
            <Statistic 
              title="Đã xuất bản" 
              value={stats.published} 
              prefix={<PlayCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic 
              title="Bản nháp" 
              value={stats.draft} 
              prefix={<EditOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Actions */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space size="middle">
              <Search
                placeholder="Tìm kiếm khóa học..."
                allowClear
                onSearch={handleSearch}
                style={{ width: 250 }}
              />
              <Select
                placeholder="Cấp độ"
                allowClear
                style={{ width: 120 }}
                onChange={(value) => handleFilterChange('level', value)}
              >
                <Option value="Beginner">Cơ bản</Option>
                <Option value="Intermediate">Trung cấp</Option>
                <Option value="Advanced">Nâng cao</Option>
              </Select>
              <Select
                placeholder="Trạng thái"
                allowClear
                style={{ width: 120 }}
                onChange={(value) => handleFilterChange('status', value)}
              >
                <Option value="published">Đã xuất bản</Option>
                <Option value="draft">Bản nháp</Option>
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
      </Card>

      {/* Courses Table */}
      <Card>
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
        />
      </Card>
    </Layout.Content>
  );
};

export default CourseManagement;
