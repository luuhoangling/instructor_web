import axios from 'axios';
import { getToken } from './authService';

// Base configuration for API
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/instructor';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor để thêm auth token và log request
apiClient.interceptors.request.use(
  (config) => {
    // Thêm auth token vào header nếu có
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('API Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor để xử lý response và errors
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('Response Error:', error.response?.status, error.message);
    
    // Xử lý lỗi 401 - Unauthorized
    if (error.response?.status === 401) {
      // Xóa token và redirect về login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// ==================== COURSES API ====================

/**
 * Lấy danh sách khóa học với phân trang theo API docs
 * @param {Object} params - Query parameters
 * @param {number} params._page - Trang hiện tại (bắt đầu từ 1)
 * @param {number} params._limit - Số lượng items trên mỗi trang
 * @param {number} params._start - Vị trí bắt đầu (alternative pagination)
 * @param {number} params._end - Vị trí kết thúc (alternative pagination)
 * @param {string} params._sort - Trường sắp xếp (title, created_at, price)
 * @param {string} params._order - Thứ tự (ASC, DESC)
 * @returns {Promise} API response với data và total
 */
export const getCourses = async (params = {}) => {
  try {
    const { _page = 1, _limit = 10, ...otherParams } = params;
    const response = await apiClient.get('/courses', {
      params: { _page, _limit, ...otherParams }
    });
    
    // API trả về data và total theo docs
    return {
      data: response.data.data || response.data,
      total: response.data.total || parseInt(response.headers['x-total-count'] || '0')
    };
  } catch (error) {
    console.error('Failed to fetch courses:', error);
    throw new Error(error.response?.data?.error || `Failed to fetch courses: ${error.message}`);
  }
};

/**
 * Lấy thông tin chi tiết một khóa học theo API docs
 * @param {string|number} id - ID của khóa học
 * @returns {Promise} API response với data
 */
export const getCourse = async (id) => {
  try {
    const response = await apiClient.get(`/courses/${id}`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Failed to fetch course ${id}:`, error);
    throw new Error(error.response?.data?.error || `Failed to fetch course ${id}: ${error.message}`);
  }
};

/**
 * Tạo khóa học mới theo API docs
 * @param {Object} data - Dữ liệu khóa học
 * @param {string} data.title - Tiêu đề khóa học (required)
 * @param {string} data.subtitle - Phụ đề khóa học
 * @param {string} data.description - Mô tả khóa học
 * @param {number} data.price - Giá khóa học
 * @param {number} data.discount_price - Giá giảm
 * @param {string} data.level - Cấp độ (Beginner, Intermediate, Advanced)
 * @param {string} data.thumbnail_url - URL thumbnail
 * @param {string} data.preview_video_url - URL video preview
 * @param {boolean} data.is_published - Trạng thái xuất bản
 * @param {boolean} data.is_featured - Trạng thái featured
 * @param {number} data.category_id - ID danh mục
 * @returns {Promise} API response với course mới được tạo
 */
export const createCourse = async (data) => {
  try {
    const response = await apiClient.post('/courses', data);
    return response.data.data || response.data;
  } catch (error) {
    console.error('Failed to create course:', error);
    throw new Error(error.response?.data?.error || `Failed to create course: ${error.message}`);
  }
};

/**
 * Cập nhật thông tin khóa học theo API docs
 * @param {string|number} id - ID của khóa học
 * @param {Object} data - Dữ liệu cập nhật (các trường tương tự createCourse)
 * @returns {Promise} API response
 */
export const updateCourse = async (id, data, isFormData = false) => {
  try {
    const config = isFormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined;
    const response = await apiClient.put(`/courses/${id}`, data, config);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Failed to update course ${id}:`, error);
    throw new Error(error.response?.data?.error || `Failed to update course ${id}: ${error.message}`);
  }
};

/**
 * Xóa khóa học theo API docs
 * @param {string|number} id - ID của khóa học
 * @returns {Promise} API response (204 No Content)
 */
export const deleteCourse = async (id) => {
  try {
    const response = await apiClient.delete(`/courses/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to delete course ${id}:`, error);
    throw new Error(error.response?.data?.error || `Failed to delete course ${id}: ${error.message}`);
  }
};

// ==================== SECTIONS API ====================

/**
 * Lấy danh sách sections theo API docs - dùng query parameter course_id
 * @param {string|number} courseId - ID của khóa học
 * @param {Object} params - Query parameters tương tự getCourses
 * @returns {Promise} API response với data và total
 */
export const getSections = async (courseId, params = {}) => {
  console.log('DEBUG: getSections called', { courseId, params }); // Debug log
  try {
    const { _page = 1, _limit = 10, ...otherParams } = params;
    const response = await apiClient.get('/sections', {
      params: { course_id: courseId, _page, _limit, ...otherParams }
    });
    
    return {
      data: response.data.data || response.data,
      total: response.data.total || parseInt(response.headers['x-total-count'] || '0')
    };
  } catch (error) {
    console.error('Failed to fetch sections:', error);
    throw new Error(error.response?.data?.error || `Failed to fetch sections: ${error.message}`);
  }
};

/**
 * Lấy thông tin chi tiết một section theo API docs
 * @param {string|number} sectionId - ID của section
 * @returns {Promise} Section data
 */
export const getSection = async (sectionId) => {
  console.log('DEBUG: getSection called', { sectionId }); // Debug log
  try {
    const response = await apiClient.get(`/sections/${sectionId}`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Failed to fetch section ${sectionId}:`, error);
    throw new Error(error.response?.data?.error || `Failed to fetch section ${sectionId}: ${error.message}`);
  }
};

/**
 * Tạo section mới trong course
 * @param {string|number} courseId - ID của khóa học
 * @param {Object} data - Dữ liệu section
 * @param {string} data.title - Tiêu đề section (required)
 * @param {string} data.description - Mô tả section
 * @param {number} data.order_index - Thứ tự section
 * @returns {Promise} Section mới được tạo
 */
export const createSection = async (courseId, data) => {
  console.log('DEBUG: createSection called', { courseId, data }); // Debug log
  try {
    const response = await apiClient.post(`/courses/${courseId}/sections`, data);
    return response.data.data || response.data;
  } catch (error) {
    console.error('Failed to create section:', error);
    throw new Error(error.response?.data?.error || `Failed to create section: ${error.message}`);
  }
};

/**
 * Cập nhật thông tin section theo API docs
 * @param {string|number} sectionId - ID của section
 * @param {Object} data - Dữ liệu cập nhật
 * @returns {Promise} Section đã cập nhật
 */
export const updateSection = async (sectionId, data) => {
  console.log('DEBUG: updateSection called', { sectionId, data }); // Debug log
  try {
    const response = await apiClient.put(`/sections/${sectionId}`, data);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Failed to update section ${sectionId}:`, error);
    throw new Error(error.response?.data?.error || `Failed to update section ${sectionId}: ${error.message}`);
  }
};

/**
 * Xóa section theo API docs
 * @param {string|number} sectionId - ID của section
 * @returns {Promise} API response
 */
export const deleteSection = async (sectionId) => {
  console.log('DEBUG: deleteSection called', { sectionId }); // Debug log
  try {
    const response = await apiClient.delete(`/sections/${sectionId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to delete section ${sectionId}:`, error);
    throw new Error(error.response?.data?.error || `Failed to delete section ${sectionId}: ${error.message}`);
  }
};

// ==================== LESSONS API ====================

/**
 * Lấy danh sách lessons theo API docs - dùng query parameter section_id
 * @param {string|number} sectionId - ID của section
 * @param {Object} params - Query parameters
 * @returns {Promise} API response với data và total
 */
export const getLessons = async (sectionId, params = {}) => {
  console.log('DEBUG: getLessons called', { sectionId, params }); // Debug log
  try {
    const { _page = 1, _limit = 10, ...otherParams } = params;
    const response = await apiClient.get('/lessons', {
      params: { section_id: sectionId, _page, _limit, ...otherParams }
    });
    
    return {
      data: response.data.data || response.data,
      total: response.data.total || parseInt(response.headers['x-total-count'] || '0')
    };
  } catch (error) {
    console.error('Failed to fetch lessons:', error);
    throw new Error(error.response?.data?.error || `Failed to fetch lessons: ${error.message}`);
  }
};

/**
 * Lấy thông tin chi tiết một lesson theo API docs
 * @param {string|number} lessonId - ID của lesson
 * @returns {Promise} Lesson data
 */
export const getLesson = async (lessonId) => {
  console.log('DEBUG: getLesson called', { lessonId }); // Debug log
  try {
    const response = await apiClient.get(`/lessons/${lessonId}`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Failed to fetch lesson ${lessonId}:`, error);
    throw new Error(error.response?.data?.error || `Failed to fetch lesson ${lessonId}: ${error.message}`);
  }
};

/**
 * Tạo lesson mới theo API docs
 * @param {string|number} sectionId - ID của section
 * @param {Object} data - Dữ liệu lesson
 * @param {string} data.title - Tiêu đề lesson (required)
 * @param {string} data.description - Mô tả lesson
 * @param {string} data.content_type - Loại nội dung (video, text, file)
 * @param {string} data.content_url - URL nội dung
 * @param {string} data.content_text - Nội dung dạng text
 * @param {number} data.duration - Thời lượng (giây)
 * @param {boolean} data.is_free - Có miễn phí không
 * @param {boolean} data.can_preview - Có thể xem trước không
 * @param {number} data.order_index - Thứ tự lesson
 * @returns {Promise} Lesson mới được tạo
 */
export const createLesson = async (sectionId, data, isFormData = false) => {
  console.log('DEBUG: createLesson called', { sectionId, data, isFormData }); // Debug log
  try {
    const config = isFormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined;
    const response = await apiClient.post(`/sections/${sectionId}/lessons`, data, config);
    return response.data.data || response.data;
  } catch (error) {
    console.error('Failed to create lesson:', error);
    throw new Error(error.response?.data?.error || `Failed to create lesson: ${error.message}`);
  }
};

/**
 * Cập nhật thông tin lesson theo API docs
 * @param {string|number} lessonId - ID của lesson
 * @param {Object} data - Dữ liệu cập nhật
 * @returns {Promise} Lesson đã cập nhật
 */
export const updateLesson = async (lessonId, data, isFormData = false) => {
  console.log('DEBUG: updateLesson called', { lessonId, data, isFormData }); // Debug log
  try {
    const config = isFormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined;
    const response = await apiClient.put(`/lessons/${lessonId}`, data, config);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Failed to update lesson ${lessonId}:`, error);
    throw new Error(error.response?.data?.error || `Failed to update lesson ${lessonId}: ${error.message}`);
  }
};

/**
 * Xóa lesson theo API docs
 * @param {string|number} lessonId - ID của lesson
 * @returns {Promise} API response
 */
export const deleteLesson = async (lessonId) => {
  console.log('DEBUG: deleteLesson called', { lessonId }); // Debug log
  try {
    const response = await apiClient.delete(`/lessons/${lessonId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to delete lesson ${lessonId}:`, error);
    throw new Error(error.response?.data?.error || `Failed to delete lesson ${lessonId}: ${error.message}`);
  }
};

// ==================== QUIZZES API ====================

/**
 * Lấy danh sách quizzes theo API docs - dùng query parameter lesson_id
 * @param {string|number} lessonId - ID của lesson
 * @param {Object} params - Query parameters
 * @returns {Promise} API response với data và total
 */
export const getQuizzes = async (lessonId, params = {}) => {
  console.log('DEBUG: getQuizzes called', { lessonId, params }); // Debug log
  try {
    const { _page = 1, _limit = 10, ...otherParams } = params;
    const response = await apiClient.get('/quizzes', {
      params: { lesson_id: lessonId, _page, _limit, ...otherParams }
    });
    
    return {
      data: response.data.data || response.data,
      total: response.data.total || parseInt(response.headers['x-total-count'] || '0')
    };
  } catch (error) {
    console.error('Failed to fetch quizzes:', error);
    throw new Error(error.response?.data?.error || `Failed to fetch quizzes: ${error.message}`);
  }
};

/**
 * Lấy thông tin chi tiết một quiz theo API docs
 * @param {string|number} quizId - ID của quiz
 * @returns {Promise} Quiz data
 */
export const getQuiz = async (quizId) => {
  console.log('DEBUG: getQuiz called', { quizId }); // Debug log
  try {
    const response = await apiClient.get(`/quizzes/${quizId}`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Failed to fetch quiz ${quizId}:`, error);
    throw new Error(error.response?.data?.error || `Failed to fetch quiz ${quizId}: ${error.message}`);
  }
};

/**
 * Tạo quiz mới cho lesson
 * @param {string|number} lessonId - ID của lesson
 * @param {Object} data - Dữ liệu quiz
 * @param {string} data.title - Tiêu đề quiz (required)
 * @param {string} data.description - Mô tả quiz
 * @returns {Promise} Quiz mới được tạo
 */
export const createQuiz = async (lessonId, data) => {
  console.log('DEBUG: createQuiz called', { lessonId, data }); // Debug log
  try {
    const response = await apiClient.post(`/lessons/${lessonId}/quizzes`, data);
    return response.data.data || response.data;
  } catch (error) {
    console.error('Failed to create quiz:', error);
    throw new Error(error.response?.data?.error || `Failed to create quiz: ${error.message}`);
  }
};

/**
 * Cập nhật thông tin quiz theo API docs
 * @param {string|number} quizId - ID của quiz
 * @param {Object} data - Dữ liệu cập nhật
 * @returns {Promise} Quiz đã cập nhật
 */
export const updateQuiz = async (quizId, data) => {
  console.log('DEBUG: updateQuiz called', { quizId, data }); // Debug log
  try {
    const response = await apiClient.put(`/quizzes/${quizId}`, data);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Failed to update quiz ${quizId}:`, error);
    throw new Error(error.response?.data?.error || `Failed to update quiz ${quizId}: ${error.message}`);
  }
};

/**
 * Xóa quiz theo API docs
 * @param {string|number} quizId - ID của quiz
 * @returns {Promise} API response
 */
export const deleteQuiz = async (quizId) => {
  console.log('DEBUG: deleteQuiz called', { quizId }); // Debug log
  try {
    const response = await apiClient.delete(`/quizzes/${quizId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to delete quiz ${quizId}:`, error);
    throw new Error(error.response?.data?.error || `Failed to delete quiz ${quizId}: ${error.message}`);
  }
};

/**
 * Lấy danh sách questions theo API docs - dùng query parameter quiz_id
 * @param {string|number} quizId - ID của quiz
 * @param {Object} params - Query parameters
 * @returns {Promise} API response với data và total
 */
export const getQuestions = async (quizId, params = {}) => {
  console.log('DEBUG: getQuestions called', { quizId, params }); // Debug log
  try {
    const { _page = 1, _limit = 10, ...otherParams } = params;
    const response = await apiClient.get('/questions', {
      params: { quiz_id: quizId, _page, _limit, ...otherParams }
    });
    
    return {
      data: response.data.data || response.data,
      total: response.data.total || parseInt(response.headers['x-total-count'] || '0')
    };
  } catch (error) {
    console.error('Failed to fetch questions:', error);
    throw new Error(error.response?.data?.error || `Failed to fetch questions: ${error.message}`);
  }
};

/**
 * Lấy thông tin chi tiết một question theo API docs
 * @param {string|number} questionId - ID của question
 * @returns {Promise} Question data
 */
export const getQuestion = async (questionId) => {
  console.log('DEBUG: getQuestion called', { questionId }); // Debug log
  try {
    const response = await apiClient.get(`/questions/${questionId}`);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Failed to fetch question ${questionId}:`, error);
    throw new Error(error.response?.data?.error || `Failed to fetch question ${questionId}: ${error.message}`);
  }
};

/**
 * Tạo question mới cho quiz
 * @param {string|number} quizId - ID của quiz
 * @param {Object} data - Dữ liệu question
 * @param {string} data.question_text - Nội dung câu hỏi (required)
 * @param {Array<string>} data.options - Các lựa chọn (required)
 * @param {number} data.correct_option - Index của đáp án đúng (required)
 * @param {string} data.explanation - Giải thích đáp án
 * @param {number} data.order_index - Thứ tự câu hỏi
 * @returns {Promise} Question mới được tạo
 */
export const createQuestion = async (quizId, data) => {
  console.log('DEBUG: createQuestion called', { quizId, data }); // Debug log
  try {
    const response = await apiClient.post(`/quizzes/${quizId}/questions`, data);
    return response.data.data || response.data;
  } catch (error) {
    console.error('Failed to create question:', error);
    throw new Error(error.response?.data?.error || `Failed to create question: ${error.message}`);
  }
};

/**
 * Cập nhật thông tin question theo API docs
 * @param {string|number} questionId - ID của question
 * @param {Object} data - Dữ liệu cập nhật
 * @returns {Promise} Question đã cập nhật
 */
export const updateQuestion = async (questionId, data) => {
  console.log('DEBUG: updateQuestion called', { questionId, data }); // Debug log
  try {
    const response = await apiClient.put(`/questions/${questionId}`, data);
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Failed to update question ${questionId}:`, error);
    throw new Error(error.response?.data?.error || `Failed to update question ${questionId}: ${error.message}`);
  }
};

/**
 * Xóa question theo API docs
 * @param {string|number} questionId - ID của question
 * @returns {Promise} API response
 */
export const deleteQuestion = async (questionId) => {
  console.log('DEBUG: deleteQuestion called', { questionId }); // Debug log
  try {
    const response = await apiClient.delete(`/questions/${questionId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to delete question ${questionId}:`, error);
    throw new Error(error.response?.data?.error || `Failed to delete question ${questionId}: ${error.message}`);
  }
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Helper function để build tree structure từ course data
 * @param {Object} courseData - Course data với sections, lessons, quizzes
 * @returns {Object} Tree structure cho tree component
 */
export const buildCourseTree = (courseData) => {
  const { id, title, sections = [] } = courseData;
  
  return {
    key: `course-${id}`,
    title,
    type: 'course',
    data: courseData,
    children: sections.map(section => ({
      key: `section-${section.id}`,
      title: section.title,
      type: 'section',
      data: section,
      children: [
        // Lessons
        ...(section.lessons || []).map(lesson => ({
          key: `lesson-${lesson.id}`,
          title: lesson.title,
          type: 'lesson',
          data: lesson,
          isLeaf: true
        })),
        // Quizzes
        ...(section.quizzes || []).map(quiz => ({
          key: `quiz-${quiz.id}`,
          title: quiz.title,
          type: 'quiz',
          data: quiz,
          children: (quiz.questions || []).map(question => ({
            key: `question-${question.id}`,
            title: question.question_text,
            type: 'question',
            data: question,
            isLeaf: true
          }))
        }))
      ]
    }))
  };
};

export default apiClient;
