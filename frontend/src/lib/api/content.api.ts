import { apiClient } from './client';
import { IGrade } from '../../types/grade';

export interface IGradeStream {
  _id?: string;
  id: string;
  name: string;
  icon?: string;
  index?: number;
  source?: string;
}

export interface IL0Category {
  _id?: string;
  id: string;
  name: string;
  language?: any;
  icon?: string;
  section: string;
  layout: string;
  blg?: string[];
  isActive: boolean;
  source?: string;
}

export const contentApi = {
  getGrades: async (params?: Record<string, any>): Promise<IGrade[]> => {
    const res = await apiClient.get<{ success: boolean; data: IGrade[] }>('/grades', { params });
    return res.data?.data || [];
  },

  getGradeById: async (id: string): Promise<IGrade | null> => {
    const res = await apiClient.get<{ success: boolean; data: IGrade }>(`/grades/${id}`);
    return res.data?.data || null;
  },

  getGradeStreams: async (): Promise<IGradeStream[]> => {
    const res = await apiClient.get<{ success: boolean; data: IGradeStream[] }>('/grades/streams');
    return res.data?.data || [];
  },

  getL0Categories: async (params?: Record<string, any>): Promise<IL0Category[]> => {
    const res = await apiClient.get<{ success: boolean; data: IL0Category[] }>('/l0-categories', { params });
    return res.data?.data || [];
  },

  getL0CategoryById: async (id: string): Promise<IL0Category | null> => {
    const res = await apiClient.get<{ success: boolean; data: IL0Category }>(`/l0-categories/${id}`);
    return res.data?.data || null;
  },
};

