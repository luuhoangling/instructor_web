# 🎓 API Giảng Viên - Hướng Dẫn Sử Dụng

**Base URL**: `http://localhost:3000/api/instructor`

## 🔐 Authentication

### 📋 Tổng quan
Tất cả API endpoints của giảng viên đều yêu cầu authentication. Hệ thống sử dụng JWT (JSON Web Token) để xác thực và phân quyền.

### 🔑 JWT Token Structure
```javascript
{
  "id": 123,           // ID của giảng viên
  "username": "john_instructor",
  "is_instructor": true,
  "is_active": true,
  "iat": 1672531200,   // Issued at
  "exp": 1672617600    // Expires at
}
```

### 📤 Headers yêu cầu
Mọi request đều phải có header Authorization:

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Ví dụ:**
```javascript
const headers = {
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  'Content-Type': 'application/json'
};

fetch('/api/instructor/courses', {
  method: 'GET',
  headers: headers
});
```

### 🚪 Đăng nhập và lấy Token

#### POST `/api/auth/login`
```javascript
// Request
POST /api/auth/login
{
  "username": "instructor@example.com",
  "password": "your_password"
}

// Response (Success)
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 123,
      "username": "instructor@example.com",
      "is_instructor": true,
      "is_active": true
    }
  }
}

// Response (Error)
{
  "error": "Thông tin đăng nhập không chính xác"
}
```

### 🔄 Refresh Token

#### POST `/api/auth/refresh`
```javascript
// Request
POST /api/auth/refresh
{
  "refresh_token": "your_refresh_token"
}

// Response
{
  "success": true,
  "data": {
    "token": "new_jwt_token...",
    "refresh_token": "new_refresh_token..."
  }
}
```

### 🚪 Đăng xuất

#### POST `/api/auth/logout`
```javascript
// Request
POST /api/auth/logout
Headers: {
  "Authorization": "Bearer <JWT_TOKEN>"
}

// Response
{
  "success": true,
  "message": "Đăng xuất thành công"
}
```

### ⚠️ Xử lý lỗi Authentication

| Status Code | Error | Meaning | Action |
|-------------|-------|---------|---------|
| `401` | `Token không được cung cấp` | Thiếu Authorization header | Thêm header Authorization |
| `401` | `Token không hợp lệ` | JWT token sai hoặc hết hạn | Làm mới token hoặc đăng nhập lại |
| `403` | `Không có quyền instructor` | User không phải instructor | Chỉ instructor mới truy cập được |
| `403` | `Tài khoản đã bị vô hiệu hóa` | Account bị khóa | Liên hệ admin |

### 🧪 Test Authentication (Development)

Trong môi trường development, bạn có thể sử dụng test token:

```javascript
const testHeaders = {
  'Authorization': 'Bearer test-token',
  'X-Test-Instructor-ID': '1', // ID giảng viên test (1, 2, 3...)
  'Content-Type': 'application/json'
};

// Tạo nhiều instructor test
// ID 1: test-instructor-1
// ID 2: test-instructor-2
// ID 3: test-instructor-3
```

**⚠️ Lưu ý:** Test token chỉ hoạt động trong development mode!

### 🔒 Security Best Practices

#### 1. Token Storage
```javascript
// ✅ Đúng - Lưu trong memory hoặc secure storage
const token = localStorage.getItem('instructor_token');

// ❌ Sai - Không lưu trong cookie không secure
document.cookie = `token=${token}`; // Không an toàn
```

#### 2. Token Expiration Handling
```javascript
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (response.status === 401) {
      // Token hết hạn, redirect về login
      window.location.href = '/login';
      return;
    }

    return response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
```

#### 3. Automatic Token Refresh
```javascript
let isRefreshing = false;
let failedQueue = [];

const refreshToken = async () => {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refresh_token: getRefreshToken()
      })
    });

    const data = await response.json();
    setToken(data.data.token);
    setRefreshToken(data.data.refresh_token);

    // Process failed queue
    failedQueue.forEach(({ resolve }) => resolve(data.data.token));
    failedQueue = [];

    return data.data.token;
  } catch (error) {
    failedQueue.forEach(({ reject }) => reject(error));
    failedQueue = [];
    // Redirect to login
    window.location.href = '/login';
    throw error;
  } finally {
    isRefreshing = false;
  }
};
```

### 📱 Mobile App Authentication

#### React Native Example
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  static async login(username, password) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      
      if (data.success) {
        await AsyncStorage.setItem('instructor_token', data.data.token);
        await AsyncStorage.setItem('refresh_token', data.data.refresh_token);
        return data;
      }
      
      throw new Error(data.error);
    } catch (error) {
      throw error;
    }
  }

  static async getToken() {
    return await AsyncStorage.getItem('instructor_token');
  }

  static async logout() {
    await AsyncStorage.multiRemove(['instructor_token', 'refresh_token']);
  }
}
```

### 🌐 Web App Authentication

#### JavaScript/React Example
```javascript
class InstructorAuth {
  constructor() {
    this.baseURL = '/api/instructor';
    this.token = localStorage.getItem('instructor_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, config);

    if (response.status === 401) {
      this.logout();
      throw new Error('Authentication required');
    }

    return response.json();
  }

  login(token) {
    this.token = token;
    localStorage.setItem('instructor_token', token);
  }

  logout() {
    this.token = null;
    localStorage.removeItem('instructor_token');
    window.location.href = '/login';
  }

  isAuthenticated() {
    return !!this.token;
  }
}

// Usage
const auth = new InstructorAuth();

// Tạo course
const newCourse = await auth.request('/courses', {
  method: 'POST',
  body: JSON.stringify({
    title: 'New Course',
    description: 'Course description'
  })
});
```

## 🏗️ Cấu Trúc Dữ Liệu

### Course (Khóa học)
```javascript
{
  "id": 1,
  "title": "Học Flutter từ A-Z",
  "subtitle": "Khóa học Flutter cho người mới bắt đầu",
  "description": "Mô tả chi tiết khóa học...",
  "price": 199000,
  "discount_price": 149000,
  "level": "Beginner", // Beginner, Intermediate, Advanced
  "thumbnail_url": "https://example.com/thumb.jpg",
  "preview_video_url": "https://example.com/preview.mp4",
  "is_published": true,
  "is_featured": false,
  "user_id": 1, // ID giảng viên
  "category_id": 1,
  "created_at": "2025-06-29T00:00:00Z",
  "updated_at": "2025-06-29T00:00:00Z"
}
```

### Section (Chương)
```javascript
{
  "id": 1,
  "title": "Giới thiệu Flutter",
  "description": "Chương đầu tiên về Flutter",
  "order_index": 1,
  "course_id": 1,
  "created_at": "2025-06-29T00:00:00Z"
}
```

### Lesson (Bài học)
```javascript
{
  "id": 1,
  "title": "Cài đặt Flutter SDK",
  "description": "Hướng dẫn cài đặt Flutter",
  "content_type": "video", // video, text, file
  "content_url": "https://example.com/lesson1.mp4",
  "content_text": "Nội dung bài học dạng text...",
  "duration": 1200, // giây
  "is_free": true,
  "can_preview": true,
  "order_index": 1,
  "section_id": 1,
  "course_id": 1,
  "created_at": "2025-06-29T00:00:00Z"
}
```

### Quiz (Bài kiểm tra)
```javascript
{
  "id": 1,
  "title": "Kiểm tra kiến thức Flutter cơ bản",
  "description": "Bài kiểm tra 10 câu hỏi",
  "lesson_id": 1,
  "created_at": "2025-06-29T00:00:00Z"
}
```

### Question (Câu hỏi)
```javascript
{
  "id": 1,
  "question_text": "Flutter được phát triển bởi công ty nào?",
  "options": ["Google", "Facebook", "Microsoft", "Apple"],
  "correct_option": 0, // index của đáp án đúng
  "explanation": "Flutter được Google phát triển",
  "order_index": 1,
  "quiz_id": 1,
  "created_at": "2025-06-29T00:00:00Z"
}
```

## 📚 Course API

### 📖 Lấy danh sách khóa học
```http
GET /courses
```

**Query Parameters:**
- `_page`: Trang (bắt đầu từ 1)
- `_limit`: Số lượng item mỗi trang
- `_start`: Vị trí bắt đầu (alternative pagination)
- `_end`: Vị trí kết thúc (alternative pagination)
- `_sort`: Trường sắp xếp (`title`, `created_at`, `price`)
- `_order`: Thứ tự (`ASC`, `DESC`)

**Response:**
```javascript
{
  "data": [
    {
      "id": 1,
      "title": "Học Flutter từ A-Z",
      // ... các trường khác
    }
  ],
  "total": 25
}
```

**Headers:**
- `X-Total-Count`: Tổng số courses

### 🔍 Lấy thông tin một khóa học
```http
GET /courses/{courseId}
```

**Response:**
```javascript
{
  "data": {
    "id": 1,
    "title": "Học Flutter từ A-Z",
    // ... các trường khác
  }
}
```

### ➕ Tạo khóa học mới
```http
POST /courses
```

**Body:**
```javascript
{
  "title": "Học React Native",
  "subtitle": "Phát triển app di động",
  "description": "Khóa học React Native từ cơ bản đến nâng cao",
  "price": 299000,
  "level": "Intermediate"
}
```

**Response:** `201 Created`
```javascript
{
  "data": {
    "id": 2,
    "title": "Học React Native",
    // ... các trường khác
  }
}
```

### ✏️ Cập nhật khóa học
```http
PUT /courses/{courseId}
```

**Body:**
```javascript
{
  "title": "Học React Native - Updated",
  "price": 199000,
  "is_published": true
}
```

**Response:** `200 OK`

### 🗑️ Xóa khóa học
```http
DELETE /courses/{courseId}
```

**Response:** `204 No Content`

## 📑 Section API

### 📖 Lấy danh sách sections
```http
GET /sections?course_id={courseId}
```

**Required Query Parameters:**
- `course_id`: ID của course

**Optional Query Parameters:**
- `_page`, `_limit`, `_start`, `_end`, `_sort`, `_order`

### 🔍 Lấy thông tin một section
```http
GET /sections/{sectionId}
```

### ➕ Tạo section mới
```http
POST /courses/{courseId}/sections
```

**Body:**
```javascript
{
  "title": "Dart Programming",
  "description": "Học ngôn ngữ Dart",
  "order_index": 2
}
```

### ✏️ Cập nhật section
```http
PUT /sections/{sectionId}
```

**Body:**
```javascript
{
  "title": "Dart Programming - Updated",
  "description": "Mô tả mới"
}
```

**⚠️ Lưu ý:** Không thể thay đổi `course_id`

### 🗑️ Xóa section
```http
DELETE /sections/{sectionId}
```

## 📖 Lesson API

### 📖 Lấy danh sách lessons
```http
GET /lessons?section_id={sectionId}
```

**Required Query Parameters:**
- `section_id`: ID của section

### 🔍 Lấy thông tin một lesson
```http
GET /lessons/{lessonId}
```

### ➕ Tạo lesson mới
```http
POST /sections/{sectionId}/lessons
```

**Body:**
```javascript
{
  "title": "Biến và hằng số trong Dart",
  "description": "Học cách khai báo biến",
  "content_type": "video",
  "content_url": "https://example.com/dart-variables.mp4",
  "duration": 900,
  "is_free": true,
  "order_index": 1
}
```

**Content Types:**
- `video`: Video lesson
- `text`: Text-based lesson
- `file`: File download lesson

### ✏️ Cập nhật lesson
```http
PUT /lessons/{lessonId}
```

**⚠️ Lưu ý:** Không thể thay đổi `section_id`

### 🗑️ Xóa lesson
```http
DELETE /lessons/{lessonId}
```

## 🧩 Quiz API

### 📖 Lấy danh sách quizzes
```http
GET /quizzes?lesson_id={lessonId}
```

**Required Query Parameters:**
- `lesson_id`: ID của lesson

### 🔍 Lấy thông tin một quiz
```http
GET /quizzes/{quizId}
```

### ➕ Tạo quiz mới
```http
POST /lessons/{lessonId}/quizzes
```

**Body:**
```javascript
{
  "title": "Kiểm tra Dart cơ bản",
  "description": "5 câu hỏi về biến và hàm"
}
```

### ✏️ Cập nhật quiz
```http
PUT /quizzes/{quizId}
```

**⚠️ Lưu ý:** Không thể thay đổi `lesson_id`

### 🗑️ Xóa quiz
```http
DELETE /quizzes/{quizId}
```

## ❓ Question API

### 📖 Lấy danh sách questions
```http
GET /questions?quiz_id={quizId}
```

**Required Query Parameters:**
- `quiz_id`: ID của quiz

### 🔍 Lấy thông tin một question
```http
GET /questions/{questionId}
```

### ➕ Tạo question mới
```http
POST /quizzes/{quizId}/questions
```

**Body:**
```javascript
{
  "question_text": "Từ khóa nào dùng để khai báo biến trong Dart?",
  "options": ["var", "let", "dim", "define"],
  "correct_option": 0,
  "explanation": "Dart sử dụng từ khóa 'var' để khai báo biến",
  "order_index": 1
}
```

### ✏️ Cập nhật question
```http
PUT /questions/{questionId}
```

**⚠️ Lưu ý:** Không thể thay đổi `quiz_id`

### 🗑️ Xóa question
```http
DELETE /questions/{questionId}
```

## 🛡️ Bảo Mật

### 🔒 Quyền sở hữu
- Giảng viên chỉ có thể quản lý courses của chính mình
- Mọi thao tác đều kiểm tra quyền sở hữu theo chuỗi phân cấp
- Không thể sửa đổi content của giảng viên khác

### 🔐 Tính toàn vẹn dữ liệu
- Không thể thay đổi parent IDs khi update
- Không thể tạo child element mà không có parent hợp lệ
- Cascade delete: Xóa parent sẽ xóa tất cả children

### 🚨 Validation
- Tất cả các trường required đều được validate
- Kiểm tra định dạng dữ liệu đầu vào
- Xử lý lỗi và trả về message phù hợp

## ⚠️ Error Codes

| Status Code | Meaning | Example |
|-------------|---------|---------|
| `200` | Success | Request thành công |
| `201` | Created | Tạo resource thành công |
| `204` | No Content | Xóa thành công |
| `400` | Bad Request | Thiếu dữ liệu bắt buộc |
| `401` | Unauthorized | Token không hợp lệ |
| `403` | Forbidden | Không có quyền truy cập |
| `404` | Not Found | Resource không tồn tại |
| `500` | Internal Server Error | Lỗi server |

### Error Response Format:
```javascript
{
  "error": "Mô tả lỗi cụ thể"
}
```

## 💡 Examples

### Tạo một khóa học hoàn chỉnh

#### 1️⃣ Tạo Course
```javascript
POST /courses
{
  "title": "Học React Hooks",
  "description": "Khóa học về React Hooks",
  "price": 199000,
  "level": "Intermediate"
}
// Response: courseId = 5
```

#### 2️⃣ Tạo Section
```javascript
POST /courses/5/sections
{
  "title": "Giới thiệu Hooks",
  "description": "Tìm hiểu về React Hooks",
  "order_index": 1
}
// Response: sectionId = 10
```

#### 3️⃣ Tạo Lesson
```javascript
POST /sections/10/lessons
{
  "title": "useState Hook",
  "content_type": "video",
  "content_url": "https://example.com/usestate.mp4",
  "duration": 1800,
  "order_index": 1
}
// Response: lessonId = 25
```

#### 4️⃣ Tạo Quiz
```javascript
POST /lessons/25/quizzes
{
  "title": "Kiểm tra useState",
  "description": "3 câu hỏi về useState Hook"
}
// Response: quizId = 15
```

#### 5️⃣ Tạo Questions
```javascript
POST /quizzes/15/questions
{
  "question_text": "useState trả về gì?",
  "options": ["Array", "Object", "String", "Number"],
  "correct_option": 0,
  "explanation": "useState trả về array gồm [state, setState]"
}
```

### React-Admin Compatibility

API này tương thích 100% với React-Admin:

```javascript
// React-Admin DataProvider usage
const dataProvider = simpleRestProvider('/api/instructor');

// Pagination
GET /courses?_page=1&_limit=10

// Sorting
GET /courses?_sort=title&_order=ASC

// Filtering
GET /sections?course_id=5&_start=0&_end=20
```

## 🧪 Testing

### Chạy Security Tests
```bash
cd tests/instructor
node test_update_security.js
```

### Chạy React-Admin Compatibility Tests
```bash
cd tests/react-admin
node test_react_admin_compatibility.js
```

## 📞 Support

Nếu có vấn đề hoặc cần hỗ trợ, vui lòng tạo issue hoặc liên hệ team phát triển.

---

**📅 Cập nhật lần cuối:** 29/06/2025  
**🔖 Phiên bản:** 1.0.0  
**✅ Security Status:** Đã được audit và test bảo mật
