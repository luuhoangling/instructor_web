import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CourseManagement from './CourseManagement';

const Dashboard = () => {
  const navigate = useNavigate();

  // Redirect to courses page for now since dashboard will be the course management
  // You can later replace this with actual dashboard content
  useEffect(() => {
    // For now, dashboard shows course management directly
    // navigate('/courses', { replace: true });
  }, [navigate]);

  // Show course management as main dashboard for now
  return <CourseManagement />;
};

export default Dashboard;
