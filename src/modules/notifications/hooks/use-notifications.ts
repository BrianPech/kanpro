"use client";

import * as React from "react";
import { notificationService, type Notification } from "../services/notification-service";

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Fetch initial notifications
  const loadNotifications = React.useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await notificationService.getNotifications(userId);
      setNotifications(data);
    } catch (error) {
      console.error("Error loading notifications in hook:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  React.useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Setup real-time Supabase subscriber
  React.useEffect(() => {
    if (!userId) return;

    const unsubscribe = notificationService.subscribeToNotifications(
      userId,
      (newNotification) => {
        // Prepend new notification to the active list avoiding duplicates
        setNotifications((prev) => {
          if (prev.some((n) => n.id === newNotification.id)) return prev;
          return [newNotification, ...prev];
        });
      },
      (updatedNotification) => {
        // Update notification status (e.g. is_read) in real time
        setNotifications((prev) =>
          prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
        );
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Mark a specific notification as read with optimistic updates
  const markAsRead = async (notificationId: string) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      await notificationService.markAsRead(notificationId);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      // Reload on failure to sync
      loadNotifications();
    }
  };

  // Mark all notifications as read with optimistic updates
  const markAllAsRead = async () => {
    if (!userId) return;
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      await notificationService.markAllAsRead(userId);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      loadNotifications();
    }
  };

  // Count of unread notifications
  const unreadCount = React.useMemo(() => {
    return notifications.filter((n) => !n.is_read).length;
  }, [notifications]);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refresh: loadNotifications,
  };
}
