import axios from 'axios';

// Base URL cho authentication API
const AUTH_BASE_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:3000/api/auth';

// Create axios instance cho auth
const authClient = axios.create({
  baseURL: AUTH_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor để thêm token vào header
authClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Auth Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Auth Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor để xử lý auth errors
authClient.interceptors.response.use(
  (response) => {
    console.log('Auth Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
    console.error('Auth Response Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

/**
 * Đăng nhập người dùng
 * @param {string} username_acc - Tên tài khoản từ form
 * @param {string} password - Mật khẩu
 * @returns {Promise} Thông tin user và token
 */
export const login = async (username_acc, password) => {
  try {
    const response = await authClient.post('/user/login', {
      username: username_acc, // Map username_acc thành username cho server
      password
    });

    const data = response.data.data || response.data;
    
    // Kiểm tra xem user có phải giảng viên không
    if (!data.user.is_instructor) {
      throw new Error('Chỉ giảng viên mới được phép truy cập hệ thống này');
    }

    // Lưu token và thông tin user vào localStorage
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    localStorage.setItem('user_data', JSON.stringify(data.user));

    return data;
  } catch (error) {
    console.error('Login Error:', error);
    
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('Đăng nhập thất bại. Vui lòng thử lại.');
    }
  }
};

/**
 * Đăng xuất người dùng
 */
export const logout = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
  window.location.href = '/login';
};

/**
 * Kiểm tra xem user đã đăng nhập chưa
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('auth_token');
  const userData = localStorage.getItem('user_data');
  return !!(token && userData);
};

/**
 * Lấy thông tin user hiện tại
 * @returns {Object|null}
 */
export const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

/**
 * Kiểm tra xem user có phải giảng viên không
 * @returns {boolean}
 */
export const isInstructor = () => {
  const user = getCurrentUser();
  return user?.is_instructor === true || user?.is_instructor === 'true';
};

/**
 * Lấy token hiện tại
 * @returns {string|null}
 */
export const getToken = () => {
  return localStorage.getItem('auth_token');
};

/**
 * Verify token với server
 * @returns {Promise}
 */
export const verifyToken = async () => {
  try {
    const response = await authClient.get('/user/verify');
    return response.data;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw error;
  }
};

/**
 * Refresh token nếu cần
 * @returns {Promise}
 */
export const refreshToken = async () => {
  try {
    const response = await authClient.post('/user/refresh');
    const { token } = response.data;
    
    if (token) {
      localStorage.setItem('auth_token', token);
    }
    
    return response.data;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  }
};

export default {
  login,
  logout,
  isAuthenticated,
  getCurrentUser,
  isInstructor,
  getToken,
  verifyToken,
  refreshToken
};
