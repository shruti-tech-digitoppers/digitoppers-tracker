import { apiClient } from './client';

export interface SolutionItem {
  _id: string;
  key: string;
  label: string;
  name?: string;
  desc?: string;
  description?: string;
  icon?: string;
  index?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const solutionsApi = {
  // Get all active solutions
  getSolutions: async (params?: { includeInactive?: boolean }): Promise<SolutionItem[]> => {
    const response = await apiClient.get('/solutions', { params });
    return response.data?.data || [];
  },

  // Get solution by ID
  getSolutionById: async (id: string): Promise<SolutionItem> => {
    const response = await apiClient.get(`/solutions/${id}`);
    return response.data?.data;
  },

  // Create new solution
  createSolution: async (data: Partial<SolutionItem>): Promise<SolutionItem> => {
    const response = await apiClient.post('/solutions', data);
    return response.data?.data;
  },

  // Update solution
  updateSolution: async (id: string, data: Partial<SolutionItem>): Promise<SolutionItem> => {
    const response = await apiClient.put(`/solutions/${id}`, data);
    return response.data?.data;
  },

  // Delete solution
  deleteSolution: async (id: string): Promise<void> => {
    await apiClient.delete(`/solutions/${id}`);
  },
};
