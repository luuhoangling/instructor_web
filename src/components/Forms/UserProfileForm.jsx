import React, { useEffect, useState } from 'react';
import { getUserInfo, updateUserInfo } from '../../services/api';
import uploadFile from '../../services/upload';

const UserProfileForm = ({ userId }) => {
  const [form, setForm] = useState({
    username: '', // Tên hiển thị
    username_acc: '', // Tên tài khoản đăng nhập
    bio: '',
    sex: '',
    avatar_url: '',
    oldPassword: '',
    password: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      try {
        const data = await getUserInfo(userId);
        setForm(f => ({
          ...f,
          ...data,
          password: '',
          oldPassword: '',
          username: data.username || '',
          username_acc: data.username_acc || '',
        }));
      } catch (e) {
        setError('Không thể tải thông tin người dùng.');
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [userId]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleAvatarChange = e => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const updateData = {};
      if (form.username) updateData.username = form.username;
      // Không gửi username_acc khi cập nhật, chỉ dùng để hiển thị
      if (form.bio) updateData.bio = form.bio;
      if (form.sex) updateData.sex = form.sex;
      if (avatarFile) {
        const formData = new FormData();
        if (form.username) formData.append('username', form.username);
        // Không gửi username_acc khi cập nhật, chỉ dùng để hiển thị
        if (form.bio) formData.append('bio', form.bio);
        if (form.sex) formData.append('sex', form.sex);
        formData.append('avatar_url', avatarFile);
        if (form.password && form.oldPassword) {
          formData.append('oldPassword', form.oldPassword);
          formData.append('password', form.password);
        }
        console.debug('PUT user (FormData):', userId, Array.from(formData.entries()));
        await updateUserInfo(userId, formData, true);
      } else {
        if (form.avatar_url) updateData.avatar_url = form.avatar_url;
        if (form.password && form.oldPassword) {
          updateData.oldPassword = form.oldPassword;
          updateData.password = form.password;
        }
        console.debug('PUT user (JSON):', userId, updateData);
        await updateUserInfo(userId, updateData);
      }
      setSuccess('Cập nhật thành công!');
    } catch (e) {
      setError('Cập nhật thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{
      maxWidth: 420,
      margin: '32px auto',
      background: '#f5f7fa',
      padding: 32,
      borderRadius: 12,
      boxShadow: '0 2px 12px #0001',
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Thông tin cá nhân</h2>
      {error && (
        <div style={{
          color: '#fff',
          background: '#ff4d4f',
          borderRadius: 6,
          padding: '10px 16px',
          marginBottom: 12,
          fontWeight: 500,
          boxShadow: '0 2px 8px #ff4d4f22',
          textAlign: 'center',
        }}>{error}</div>
      )}
      {success && (
        <div style={{
          color: '#fff',
          background: '#52c41a',
          borderRadius: 6,
          padding: '10px 16px',
          marginBottom: 12,
          fontWeight: 500,
          boxShadow: '0 2px 8px #52c41a22',
          textAlign: 'center',
        }}>{success}</div>
      )}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 500 }}>Tên tài khoản:</label>
        <input name="username_acc" value={form.username_acc} disabled style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', background: '#f0f0f0' }} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 500 }}>Tên:</label>
        <input name="username" value={form.username} onChange={handleChange} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 500 }}>Bio:</label>
        <textarea name="bio" value={form.bio} onChange={handleChange} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', minHeight: 60 }} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 500 }}>Giới tính:</label>
        <select name="sex" value={form.sex} onChange={handleChange} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc' }}>
          <option value="">Chọn</option>
          <option value="male">Nam</option>
          <option value="female">Nữ</option>
          <option value="other">Khác</option>
        </select>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 500 }}>Ảnh đại diện:</label><br />
        <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ marginTop: 4 }} />
        {form.avatar_url && (
          <div style={{ marginTop: 8 }}>
            <img src={form.avatar_url} alt="avatar" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee' }} />
          </div>
        )}
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 500 }}>Mật khẩu cũ:</label>
        <input type="password" name="oldPassword" value={form.oldPassword} onChange={handleChange} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc' }} placeholder="Chỉ nhập khi muốn đổi mật khẩu" autoComplete="current-password" />
      </div>
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontWeight: 500 }}>Mật khẩu mới:</label>
        <input type="password" name="password" value={form.password} onChange={handleChange} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc' }} placeholder="Chỉ nhập khi muốn đổi mật khẩu" autoComplete="new-password" />
      </div>
      <button type="submit" disabled={loading} style={{ width: '100%', padding: 10, borderRadius: 6, background: '#1890ff', color: '#fff', fontWeight: 600, fontSize: 16, border: 'none', cursor: 'pointer' }}>
        {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
      </button>
    </form>
  );
};

export default UserProfileForm;
