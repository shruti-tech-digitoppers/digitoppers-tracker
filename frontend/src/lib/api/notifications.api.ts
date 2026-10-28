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

let activeNotificationsPromise: Promise<INotificationsListResponse> | null = null;
let cachedNotificationsResponse: INotificationsListResponse | null = null;
let lastNotifFetchTime = 0;
const NOTIF_CACHE_TTL = 10000; // 10 seconds

export const notificationsApi = {
  getNotifications: async (params?: { days?: number; category?: string; subCategory?: string }): Promise<INotificationsListResponse> => {
    const isDefaultQuery = !params || Object.keys(params).length === 0;
    const now = Date.now();

    if (isDefaultQuery && cachedNotificationsResponse && (now - lastNotifFetchTime < NOTIF_CACHE_TTL)) {
      return cachedNotificationsResponse;
    }

    if (isDefaultQuery && activeNotificationsPromise) {
      return activeNotificationsPromise;
    }

    const fetchPromise = (async () => {
      try {
        const response = await apiClient.get<any>('/notifications', { params });
        const rawList = response.data?.data || response.data?.notifications || (Array.isArray(response.data) ? response.data : []);
        const result = {
          success: true,
          notifications: rawList,
          data: rawList,
          count: rawList.length,
          unreadCount: rawList.filter((n: any) => !n.isRead).length
        };
        if (isDefaultQuery) {
          cachedNotificationsResponse = result;
          lastNotifFetchTime = Date.now();
        }
        return result;
      } finally {
        if (isDefaultQuery) {
          activeNotificationsPromise = null;
        }
      }
    })();

    if (isDefaultQuery) {
      activeNotificationsPromise = fetchPromise;
    }

    return fetchPromise;
  },

  markAsRead: async (id: string, isRead = true): Promise<{ success: boolean; notification?: INotificationItem }> => {
    cachedNotificationsResponse = null;
    lastNotifFetchTime = 0;
    const response = await apiClient.patch<{ success: boolean; notification?: INotificationItem }>(`/notifications/${id}/read`, { isRead });
    return response.data;
  },

  markAllAsRead: async (isRead = true): Promise<{ success: boolean }> => {
    cachedNotificationsResponse = null;
    lastNotifFetchTime = 0;
    const response = await apiClient.patch<{ success: boolean }>('/notifications/read-all', { isRead });
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