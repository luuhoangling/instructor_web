/**
 * Formatting utilities for display data
 */

// Format currency (USD)
export const formatCurrency = (amount, showUnit = true) => {
  if (amount === null || amount === undefined) return '0';
  const formatted = new Intl.NumberFormat('en-US').format(amount);
  return showUnit ? `${formatted} USD` : formatted;
};

// Format file size
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Format duration (seconds to human readable)
export const formatDuration = (seconds, format = 'full') => {
  if (!seconds || seconds <= 0) return '0 giây';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (format === 'short') {
    if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
  
  const parts = [];
  if (hours > 0) parts.push(`${hours} giờ`);
  if (minutes > 0) parts.push(`${minutes} phút`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs} giây`);
  
  return parts.join(' ');
};

// Format date (Vietnamese)
export const formatDate = (date, format = 'full') => {
  if (!date) return '';
  
  const d = new Date(date);
  
  if (format === 'relative') {
    return formatRelativeTime(d);
  }
  
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  if (format === 'full') {
    options.weekday = 'long';
    options.hour = '2-digit';
    options.minute = '2-digit';
  } else if (format === 'short') {
    options.month = 'short';
  } else if (format === 'time') {
    return d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  return d.toLocaleDateString('vi-VN', options);
};

// Format relative time (2 giờ trước, 3 ngày trước, ...)
export const formatRelativeTime = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Vài giây trước';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ngày trước`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} tuần trước`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} tháng trước`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} năm trước`;
};

// Format percentage
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '0%';
  return `${(value * 100).toFixed(decimals)}%`;
};

// Format course level to Vietnamese
export const formatCourseLevel = (level) => {
  const levelMap = {
    'Beginner': 'Người mới bắt đầu',
    'Intermediate': 'Trung cấp',
    'Advanced': 'Nâng cao'
  };
  
  return levelMap[level] || level;
};

// Format content type to Vietnamese
export const formatContentType = (type) => {
  const typeMap = {
    'video': 'Video',
    'text': 'Bài viết',
    'quiz': 'Bài kiểm tra',
    'assignment': 'Bài tập',
    'file': 'Tài liệu'
  };
  
  return typeMap[type] || type;
};

// Truncate text with ellipsis
export const truncateText = (text, maxLength = 100, suffix = '...') => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

// Format progress (0-1 to percentage with progress bar text)
export const formatProgress = (progress, showPercentage = true) => {
  const percentage = Math.round(progress * 100);
  
  if (showPercentage) {
    return `${percentage}%`;
  }
  
  if (percentage === 0) return 'Chưa bắt đầu';
  if (percentage < 50) return 'Đang học';
  if (percentage < 100) return 'Sắp hoàn thành';
  return 'Hoàn thành';
};

// Format student count
export const formatStudentCount = (count) => {
  if (count === 0) return 'Chưa có học viên';
  if (count === 1) return '1 học viên';
  if (count < 1000) return `${count} học viên`;
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K học viên`;
  return `${(count / 1000000).toFixed(1)}M học viên`;
};

// Format rating (1-5 stars)
export const formatRating = (rating, showText = true) => {
  const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  
  if (showText) {
    return `${stars} (${rating.toFixed(1)})`;
  }
  
  return stars;
};

// Format course duration from total seconds
export const formatCourseDuration = (totalSeconds) => {
  if (!totalSeconds || totalSeconds === 0) return 'Chưa có thời lượng';
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  if (hours === 0) {
    return `${minutes} phút`;
  }
  
  if (minutes === 0) {
    return `${hours} giờ`;
  }
  
  return `${hours} giờ ${minutes} phút`;
};

// Clean and format phone number for display
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as Vietnamese phone number
  if (cleaned.startsWith('84')) {
    // International format
    return `+${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5, 8)} ${cleaned.substring(8)}`;
  } else if (cleaned.startsWith('0')) {
    // Domestic format
    return `${cleaned.substring(0, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`;
  }
  
  return phone; // Return original if doesn't match pattern
};
