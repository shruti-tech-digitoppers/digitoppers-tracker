import { apiClient } from './client';

export interface INotificationItem {
  _id: string;
  recipient: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  readAt?: string;
  relatedProject?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface INotificationsListResponse {
  success: boolean;
  notifications: INotificationItem[];
  data?: INotificationItem[];
  count?: number;
  unreadCount?: number;
}

export const notificationsApi = {
  getNotifications: async (): Promise<INotificationsListResponse> => {
    const response = await apiClient.get<any>('/notifications');
    const rawList = response.data?.data || response.data?.notifications || (Array.isArray(response.data) ? response.data : []);
    return {
      success: true,
      notifications: rawList,
      data: rawList,
      count: rawList.length,
      unreadCount: rawList.filter((n: any) => !n.isRead).length
    };
  },

  markAsRead: async (id: string): Promise<{ success: boolean; notification: INotificationItem }> => {
    const response = await apiClient.patch<{ success: boolean; notification: INotificationItem }>(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<{ success: boolean }> => {
    const response = await apiClient.patch<{ success: boolean }>('/notifications/read-all');
    return response.data;
  },
};