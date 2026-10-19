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
  getNotifications: async (params?: { days?: number; category?: string; subCategory?: string }): Promise<INotificationsListResponse> => {
    const response = await apiClient.get<any>('/notifications', { params });
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

  sendNotification: async (payload: {
    recipients?: string[];
    assignedTo?: string;
    projectId?: string;
    title: string;
    message: string;
    type?: string;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; count: number; message: string }> => {
    const response = await apiClient.post<any>('/notifications', payload);
    return response.data;
  },

  testSlackNotification: async (): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>('/notifications/slack/test');
    return response.data;
  }
};