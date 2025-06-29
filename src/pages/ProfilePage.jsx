import React from 'react';
import UserProfileForm from '../components/Forms/UserProfileForm';
import { getCurrentUser } from '../services/authService';

const ProfilePage = () => {
  const user = getCurrentUser();
  if (!user) return <div>Vui lòng đăng nhập.</div>;
  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <UserProfileForm userId={user.id} />
    </div>
  );
};

export default ProfilePage;
