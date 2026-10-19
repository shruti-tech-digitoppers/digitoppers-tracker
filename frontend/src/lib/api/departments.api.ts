import { apiClient } from './client';

export interface IDepartment {
  _id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

export const departmentsApi = {
  getAllDepartments: async (): Promise<IDepartment[]> => {
    const res = await apiClient.get<{ success: boolean; data: IDepartment[] }>('/departments');
    return res.data.data;
  },

  getDepartmentById: async (id: string): Promise<IDepartment> => {
    const res = await apiClient.get<{ success: boolean; data: IDepartment }>(`/departments/${id}`);
    return res.data.data;
  },
};
