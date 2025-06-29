// Upload file (image/video) to server, return uploaded file URL
import axios from 'axios';
import { getToken } from './authService';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/instructor';

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const token = getToken();
  const response = await axios.post(
    `${BASE_URL}/uploads`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    }
  );
  // Đảm bảo response trả về có url
  return response.data.url || response.data.data?.url;
};

export default uploadFile;
