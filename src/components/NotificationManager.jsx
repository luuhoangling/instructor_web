import React, { useEffect } from 'react';
import { notification } from 'antd';
import useCourseStore, { useNotificationsSelector } from '../store/courseStore';

/**
 * NotificationManager component
 * Quản lý hiển thị notifications từ Zustand store
 */
const NotificationManager = () => {
  const notifications = useNotificationsSelector();
  const { removeNotification } = useCourseStore();

  useEffect(() => {
    // Process notifications từ store
    notifications.forEach(notif => {
      const { id, type, message, description, duration = 4.5 } = notif;
      
      // Hiển thị notification với Ant Design
      notification[type]({
        message,
        description,
        duration,
        onClose: () => {
          removeNotification(id);
        },
        key: id, // Prevent duplicate notifications
      });
      
      // Auto remove từ store sau khi hiển thị
      setTimeout(() => {
        removeNotification(id);
      }, 100);
    });
  }, [notifications, removeNotification]);

  // Component này không render gì cả, chỉ quản lý side effects
  return null;
};

export default NotificationManager;
