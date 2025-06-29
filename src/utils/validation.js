/**
 * Validation utilities for form inputs
 */

// Email validation
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// URL validation
export const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Vietnamese phone number validation
export const validatePhoneNumber = (phone) => {
  const re = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
  return re.test(phone);
};

// Price validation (VND)
export const validatePrice = (price) => {
  return price >= 0 && price <= 999999999; // Max 999M VND
};

// Password strength validation
export const validatePasswordStrength = (password) => {
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const score = [minLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  
  return {
    isValid: score >= 3,
    strength: score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong',
    score
  };
};

// Slug generation from Vietnamese text
export const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

// File size validation
export const validateFileSize = (file, maxSizeMB = 5) => {
  const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
  return file.size <= maxSize;
};

// Image file validation
export const validateImageFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return allowedTypes.includes(file.type);
};

// Video file validation
export const validateVideoFile = (file) => {
  const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi'];
  return allowedTypes.includes(file.type);
};

// Form validation rules generator
export const createValidationRules = (fieldType, options = {}) => {
  const { required = false, min, max, pattern, message } = options;
  
  const rules = [];
  
  if (required) {
    rules.push({
      required: true,
      message: message || `Vui lòng nhập ${fieldType}!`
    });
  }
  
  switch (fieldType) {
    case 'email':
      rules.push({
        type: 'email',
        message: 'Email không hợp lệ!'
      });
      break;
      
    case 'url':
      rules.push({
        type: 'url',
        message: 'URL không hợp lệ!'
      });
      break;
      
    case 'number':
      rules.push({
        type: 'number',
        message: 'Phải là số!'
      });
      if (min !== undefined) {
        rules.push({
          type: 'number',
          min,
          message: `Giá trị phải lớn hơn hoặc bằng ${min}!`
        });
      }
      if (max !== undefined) {
        rules.push({
          type: 'number',
          max,
          message: `Giá trị phải nhỏ hơn hoặc bằng ${max}!`
        });
      }
      break;
      
    case 'text':
      if (min !== undefined) {
        rules.push({
          min,
          message: `Phải có ít nhất ${min} ký tự!`
        });
      }
      if (max !== undefined) {
        rules.push({
          max,
          message: `Không được quá ${max} ký tự!`
        });
      }
      break;
      
    case 'password':
      rules.push({
        validator: (_, value) => {
          if (!value) return Promise.resolve();
          const { isValid } = validatePasswordStrength(value);
          return isValid 
            ? Promise.resolve() 
            : Promise.reject(new Error('Mật khẩu phải có ít nhất 8 ký tự và chứa chữ hoa, chữ thường, số!'));
        }
      });
      break;
      
    case 'phone':
      rules.push({
        validator: (_, value) => {
          if (!value) return Promise.resolve();
          return validatePhoneNumber(value) 
            ? Promise.resolve() 
            : Promise.reject(new Error('Số điện thoại không hợp lệ!'));
        }
      });
      break;
  }
  
  if (pattern) {
    rules.push({
      pattern,
      message: message || 'Định dạng không hợp lệ!'
    });
  }
  
  return rules;
};

// Debounce function for search/input
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function for scroll/resize events
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};
