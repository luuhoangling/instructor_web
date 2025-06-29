# 🎓 Course Management System

Hệ thống quản lý khóa học cho giảng viên, được xây dựng với React, Ant Design và Zustand.

## ✨ Tính năng

### 🏗️ Kiến trúc & Công nghệ

- **Frontend Framework**: React 19 với Vite
- **UI Library**: Ant Design 5 với theme tùy chỉnh
- **State Management**: Zustand với middleware (immer, subscribeWithSelector)
- **Routing**: React Router DOM 7
- **Styling**: Styled Components + CSS-in-JS
- **HTTP Client**: Axios với interceptors
- **Authentication**: JWT Token-based
- **Build Tool**: Vite với code splitting

### 🔐 Authentication & Security

- **Login System**: JWT token authentication
- **Role-based Access**: Chỉ giảng viên được phép truy cập
- **Protected Routes**: Tất cả routes được bảo vệ
- **Auto Logout**: Tự động đăng xuất khi token hết hạn
- **Token Management**: Lưu trữ và tự động thêm vào API headers

### 🎯 Chức năng chính

#### 📊 Dashboard
- Thống kê tổng quan (khóa học, học viên, doanh thu)
- Quick actions (tạo khóa học, quản lý)
- Danh sách khóa học gần đây với phân trang

#### 🌳 Tree View với Virtual Scrolling
- Hiển thị cấu trúc phân cấp: Course → Section → Lesson → Quiz → Question
- **Lazy Loading**: Tải dữ liệu con khi cần
- **Virtual Scrolling**: Hiệu suất cao với dữ liệu lớn
- **Drag & Drop**: Sắp xếp lại cấu trúc (đang phát triển)
- Context menu với CRUD operations
- Icons phân biệt từng loại node

#### 📝 Form Management
- Dynamic forms dựa trên node type
- Validation toàn diện (Vietnamese phone, email, URL)
- Auto-save và manual save
- File upload với preview
- Multi-step wizard cho tạo khóa học

#### 🔄 State Management với Undo/Redo
- Lưu trữ history states
- Undo/Redo operations (Ctrl+Z, Ctrl+Y)
- Optimistic updates
- Error rollback

#### 🚨 Error Handling & UX
- Global error boundary
- API error handling với retry logic
- Loading states cho từng operation
- Toast notifications
- Offline handling (đang phát triển)

## 🚀 Cài đặt và Chạy

### Yêu cầu hệ thống
- Node.js 18+ 
- npm hoặc yarn
- Backend API chạy trên `http://localhost:3000`

### Cài đặt dependencies
```bash
npm install
```

### Development
```bash
npm run dev
# Ứng dụng sẽ chạy trên http://localhost:3001
```

### Build production
```bash
npm run build
npm run preview
```

### Testing
```bash
# Chạy tests
npm run test

# Test với UI
npm run test:ui

# Test coverage
npm run test:coverage

# Run once
npm run test:run
```

### Linting
```bash
npm run lint
```

## 🏗️ Cấu trúc dự án

```
src/
├── components/           # Reusable components
│   ├── Layout/          # Layout components (Header, Sidebar, etc.)
│   ├── TreeView/        # Tree view với virtual scrolling
│   ├── Forms/           # Dynamic forms
│   ├── ErrorBoundary.jsx
│   └── NotificationManager.jsx
├── pages/               # Page components
│   ├── Dashboard.jsx
│   ├── CreateCourse.jsx
│   └── EditCourse.jsx
├── services/            # API services
│   └── api.js          # Axios configuration và API calls
├── store/               # Zustand stores
│   └── courseStore.js  # Main application state
├── utils/               # Utility functions
│   ├── validation.js   # Form validation helpers
│   └── formatters.js   # Data formatting functions
├── styles/              # Global styles
├── mocks/               # MSW mock handlers
│   ├── handlers.js     # API mock responses
│   └── setup.js        # Test setup
├── __tests__/           # Test files
└── App.jsx             # Main application component
```

## 🔌 API Integration

### Base Configuration
```javascript
// services/api.js
const BASE_URL = 'http://localhost:3000/api/instructor';
```

### Supported Endpoints
- `GET /courses` - Lấy danh sách khóa học
- `POST /courses` - Tạo khóa học mới
- `PUT /courses/:id` - Cập nhật khóa học
- `DELETE /courses/:id` - Xóa khóa học
- Tương tự cho sections, lessons, quizzes, questions

### Error Handling
```javascript
// Automatic retry cho network errors
// Global error notifications
// Rollback optimistic updates on failure
```

## 🎨 Tree View Implementation

### Lazy Loading
```javascript
// Load children khi user expand node lần đầu
const loadNodeChildren = async (node) => {
  const { type, data } = node;
  
  switch (type) {
    case 'course':
      const sections = await getSections(data.id);
      break;
    case 'section':
      const [lessons, quizzes] = await Promise.all([
        getLessons(data.course_id, data.id),
        getQuizzes(data.course_id, data.id)
      ]);
      break;
  }
};
```

### Virtual Scrolling
```javascript
// Ant Design Tree với built-in virtual scrolling
<Tree
  height={window.innerHeight - 300}
  virtual
  treeData={treeData}
/>
```

### Drag & Drop (Planning)
```javascript
// Support reordering trong cùng parent
// Cross-parent moves với validation
// Real-time API updates
```

## 🧪 Testing Strategy

### Unit Tests
- Component rendering
- User interactions
- State management logic
- Utility functions

### Integration Tests
- API service calls
- Store updates
- Form submissions
- Navigation flows

### Mock Service Worker (MSW)
```javascript
// Mock API responses for consistent testing
export const handlers = [
  http.get('/api/instructor/courses', ({ request }) => {
    return HttpResponse.json({ data: mockCourses });
  })
];
```

## 🎯 Performance Optimizations

### Code Splitting
```javascript
// Vite configuration
rollupOptions: {
  output: {
    manualChunks: {
      vendor: ['react', 'react-dom'],
      antd: ['antd', '@ant-design/icons'],
      utils: ['axios', 'zustand']
    }
  }
}
```

### State Management
- Zustand selectors để tránh unnecessary re-renders
- Immer integration cho immutable updates
- Subscription-based updates

### Tree Performance
- Virtual scrolling cho large datasets
- Lazy loading cho tree nodes
- Memoized node components

## 🔧 Configuration

### Environment Variables
```env
VITE_API_BASE_URL=http://localhost:3000/api/instructor
VITE_APP_TITLE=Course Management
VITE_UPLOAD_MAX_SIZE=5242880  # 5MB
```

### Vite Aliases
```javascript
resolve: {
  alias: {
    '@': '/src',
    '@components': '/src/components',
    '@pages': '/src/pages',
    '@services': '/src/services'
  }
}
```

## 🚧 Roadmap

### Phase 1 ✅
- [x] Basic CRUD operations
- [x] Tree view with lazy loading
- [x] Form management
- [x] State management với Zustand

### Phase 2 🚧
- [ ] Drag & drop reordering
- [ ] Advanced search và filtering
- [ ] Bulk operations
- [ ] Export/Import functionality

### Phase 3 📋
- [ ] Real-time collaboration
- [ ] Advanced analytics
- [ ] Mobile responsive
- [ ] PWA support

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push branch: `git push origin feature/amazing-feature`
5. Tạo Pull Request

### Development Guidelines
- Sử dụng TypeScript cho type safety (đang migration)
- Viết tests cho new features
- Follow Ant Design design principles
- Optimize for performance và accessibility

## 📝 License

MIT License - xem [LICENSE](LICENSE) file.

## 🐛 Bug Reports & Feature Requests

Tạo issue trên GitHub repository với:
- Mô tả chi tiết bug/feature
- Steps to reproduce (nếu là bug)
- Expected vs actual behavior
- Screenshots/videos nếu có

## 📞 Support

- 📧 Email: your-email@example.com
- 💬 Discord: Your Server
- 📖 Docs: [Documentation](docs/)

---

**📅 Cập nhật lần cuối:** 29/06/2025  
**🔖 Phiên bản:** 1.0.0  
**✅ Status:** Production Ready+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
