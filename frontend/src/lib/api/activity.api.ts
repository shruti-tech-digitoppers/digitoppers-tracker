import { apiClient } from './client';
import { IUser } from '../../types/auth';

export interface IActivityItem {
  _id: string;
  project: string;
  actor?: string | IUser;
  action: string;
  resource?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface IActivityListResponse {
  success: boolean;
  activities: IActivityItem[];
}

export const activityApi = {
  getProjectActivity: async (projectId: string): Promise<IActivityListResponse> => {
    const response = await apiClient.get<any>(`/projects/${projectId}/activity`);
    return {
      success: true,
      activities: response.data?.data || response.data?.activities || [],
    };
  },

  getAllActivities: async (): Promise<IActivityListResponse> => {
    const response = await apiClient.get<any>('/activities');
    return {
      success: true,
      activities: response.data?.data || response.data?.activities || [],
    };
  },
};