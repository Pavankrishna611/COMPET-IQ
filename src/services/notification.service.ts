/**
 * Notification API Service
 */

import { apiClient } from '@/lib/api-client';
import { NotificationResponse, NotificationSummaryResponse } from '@/types/api';

class NotificationService {
  /**
   * Retrieve current user notifications and unread count.
   */
  async getNotifications(limit: number = 50): Promise<NotificationSummaryResponse> {
    return apiClient.get<NotificationSummaryResponse>(`/notifications?limit=${limit}`);
  }

  /**
   * Mark a specific notification as read.
   */
  async markAsRead(notificationId: string): Promise<NotificationResponse> {
    return apiClient.patch<NotificationResponse>(`/notifications/${notificationId}/read`);
  }

  /**
   * Mark all unread notifications as read.
   */
  async markAllAsRead(): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/notifications/mark-all-read');
  }
}

export const notificationService = new NotificationService();
export default notificationService;
