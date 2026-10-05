import { apiClient } from './client';
import { SolutionItem } from './solutions.api';

export interface HardwareItem {
  _id: string;
  key: string;
  label: string;
  name?: string;
  desc?: string;
  description?: string;
  icon?: string;
  unit?: string;
  solutions: SolutionItem[] | string[];
  index?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const hardwareApi = {
  // Get all active hardware with optional solution filtering
  getHardware: async (params?: {
    solutionId?: string;
    solutionIds?: string;
    solutionKey?: string;
    solutionKeys?: string;
    includeInactive?: boolean;
  }): Promise<HardwareItem[]> => {
    const response = await apiClient.get('/hardware', { params });
    return response.data?.data || [];
  },

  // Get hardware item by ID
  getHardwareById: async (id: string): Promise<HardwareItem> => {
    const response = await apiClient.get(`/hardware/${id}`);
    return response.data?.data;
  },

  // Create new hardware item
  createHardware: async (data: Partial<HardwareItem>): Promise<HardwareItem> => {
    const response = await apiClient.post('/hardware', data);
    return response.data?.data;
  },

  // Update hardware item
  updateHardware: async (id: string, data: Partial<HardwareItem>): Promise<HardwareItem> => {
    const response = await apiClient.put(`/hardware/${id}`, data);
    return response.data?.data;
  },

  // Delete hardware item
  deleteHardware: async (id: string): Promise<void> => {
    await apiClient.delete(`/hardware/${id}`);
  },
};
