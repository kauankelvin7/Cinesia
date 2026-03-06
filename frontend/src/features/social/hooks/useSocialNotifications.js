/**
 * @file useSocialNotifications.js
 * @description Hook para notificações do sistema social.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext-firebase';
import { notificationService } from '../services/notificationService';

export function useSocialNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubNotifs = notificationService.subscribeNotifications(user.uid, setNotifications);
    const unsubCount = notificationService.subscribeUnreadCount(user.uid, setUnreadCount);

    return () => {
      unsubNotifs();
      unsubCount();
    };
  }, [user?.uid]);

  const markAsRead = useCallback(
    (notificationId) => notificationService.markAsRead(notificationId),
    [],
  );

  const markAllAsRead = useCallback(() => {
    if (!user?.uid) return;
    return notificationService.markAllAsRead(user.uid);
  }, [user?.uid]);

  const removeNotification = useCallback(
    (notificationId) => notificationService.remove(notificationId),
    [],
  );

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
  };
}
