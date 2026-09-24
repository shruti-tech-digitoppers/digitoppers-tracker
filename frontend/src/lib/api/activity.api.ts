import { apiClient } from './client';
import { IUser } from '../../types/auth';

export interface IActivityProject {
  _id: string;
  projectId?: string;
  projectName?: string;
  organization?: string;
  status?: string;
}

export interface IActivityItem {
  _id: string;
  project?: string | IActivityProject;
  actor?: string | IUser;
  actorName?: string;
  actorEmail?: string;
  action: string;
  description?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface IActivityListResponse {
  success: boolean;
  activities: IActivityItem[];
  total?: number;
  page?: number;
  pages?: number;
}

export interface IActivityFilterParams {
  project?: string;
  actor?: string;
  action?: string;
  resourceType?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface IActivityStats {
  totalActivities: number;
  todayActivities: number;
  activeContributors: number;
  topActions: Array<{ action: string; count: number }>;
}

export const activityApi = {
  getProjectActivity: async (projectId: string, params?: IActivityFilterParams): Promise<IActivityListResponse> => {
    const response = await apiClient.get<any>(`/projects/${projectId}/activity`, { params });
    return {
      success: true,
      activities: response.data?.data || response.data?.activities || [],
      total: response.data?.total || (response.data?.activities || []).length,
      page: response.data?.page || 1,
      pages: response.data?.pages || 1
    };
  },

  getAllActivities: async (params?: IActivityFilterParams): Promise<IActivityListResponse> => {
    const response = await apiClient.get<any>('/activities', { params });
    return {
      success: true,
      activities: response.data?.data || response.data?.activities || [],
      total: response.data?.total || (response.data?.activities || []).length,
      page: response.data?.page || 1,
      pages: response.data?.pages || 1
    };
  },

  getActivityStats: async (): Promise<IActivityStats> => {
    const response = await apiClient.get<any>('/activities/stats');
    return response.data?.data || {
      totalActivities: 0,
      todayActivities: 0,
      activeContributors: 0,
      topActions: []
    };
  }
};