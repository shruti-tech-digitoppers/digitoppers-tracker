import { apiClient } from './client';
import { HardwareItem } from './hardware.api';

export interface IHardwareSpec {
  _id: string;
  name: string;
  code: string;
  hardwareId: string | HardwareItem | any;
  hardwareKey?: string;
  description?: string;
  attributes?: Record<string, any>;
  index?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const specsApi = {
  // Get all active hardware specs with optional filtering by hardwareId or hardwareKey
  getSpecs: async (params?: {
    hardwareId?: string;
    hardwareKey?: string;
    search?: string;
    includeInactive?: boolean;
  }): Promise<IHardwareSpec[]> => {
    const response = await apiClient.get('/hardware-specs', { params });
    return response.data?.data || [];
  },

  // Get hardware spec item by ID
  getSpecById: async (id: string): Promise<IHardwareSpec> => {
    const response = await apiClient.get(`/hardware-specs/${id}`);
    return response.data?.data;
  },

  // Create new hardware spec
  createSpec: async (data: Partial<IHardwareSpec>): Promise<IHardwareSpec> => {
    const response = await apiClient.post('/hardware-specs', data);
    return response.data?.data;
  },

  // Update hardware spec
  updateSpec: async (id: string, data: Partial<IHardwareSpec>): Promise<IHardwareSpec> => {
    const response = await apiClient.patch(`/hardware-specs/${id}`, data);
    return response.data?.data;
  },

  // Delete hardware spec
  deleteSpec: async (id: string): Promise<void> => {
    await apiClient.delete(`/hardware-specs/${id}`);
  },
};
