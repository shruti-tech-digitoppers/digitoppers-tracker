import { apiClient } from './client';
import { IProjectRequest, ICreateProjectRequestPayload, IApproveRequestPayload } from '../../types/request';

export const requestsApi = {
  getNextRequestId: async (): Promise<{ nextRequestId: string }> => {
    const res = await apiClient.get<any>('/requests/next-id');
    return res.data?.data || { nextRequestId: '' };
  },

  createRequest: async (payload: ICreateProjectRequestPayload): Promise<{ request: IProjectRequest }> => {
    const res = await apiClient.post<any>('/requests', payload);
    return res.data?.data || res.data;
  },

  getRequests: async (query?: { status?: string; search?: string }): Promise<{ requests: IProjectRequest[]; total: number }> => {
    const params = new URLSearchParams();
    if (query?.status && query.status !== 'ALL') params.append('status', query.status);
    if (query?.search) params.append('search', query.search);

    const res = await apiClient.get<any>(`/requests${params.toString() ? `?${params.toString()}` : ''}`);
    const data = res.data?.data || res.data;
    return {
      requests: data?.requests || (Array.isArray(data) ? data : []),
      total: data?.total || data?.requests?.length || 0,
    };
  },

  getRequestById: async (id: string): Promise<{ request: IProjectRequest }> => {
    const res = await apiClient.get<any>(`/requests/${id}`);
    return res.data?.data || res.data;
  },

  approveRequest: async (id: string, payload: IApproveRequestPayload): Promise<{ request: IProjectRequest; project: any }> => {
    const res = await apiClient.post<any>(`/requests/${id}/approve`, payload);
    return res.data?.data || res.data;
  },

  rejectRequest: async (id: string, payload: { reviewNotes?: string }): Promise<{ request: IProjectRequest }> => {
    const res = await apiClient.post<any>(`/requests/${id}/reject`, payload);
    return res.data?.data || res.data;
  },

  getDashboardProjects: async (): Promise<{ projects: any[] }> => {
    const res = await apiClient.get<any>('/requests/dashboard-projects');
    return {
      projects: res.data?.data?.projects || res.data?.projects || [],
    };
  },
};

