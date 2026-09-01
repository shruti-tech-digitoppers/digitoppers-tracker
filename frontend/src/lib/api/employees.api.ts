import { apiClient } from './client';
import { IUser } from '../../types/auth';

export interface IEmployeeListResponse {
  success: boolean;
  employees: IUser[];
}

export const employeesApi = {
  getEmployees: async (): Promise<IEmployeeListResponse> => {
    try {
      const response = await apiClient.get<any>('/employees').catch(() => apiClient.get<any>('/users'));
      const rawList = response.data?.data || response.data?.employees || response.data?.users || (Array.isArray(response.data) ? response.data : []);
      const employees: IUser[] = rawList.map((e: any) => ({
        _id: e._id || e.id || '',
        name: e.name || '',
        email: e.email || '',
        role: e.globalRole || e.role || 'EMPLOYEE',
        globalRole: e.globalRole || e.role || 'EMPLOYEE',
        employeeCode: e.employeeCode || '',
        isActive: e.isActive !== undefined ? e.isActive : true,
      }));
      return {
        success: true,
        employees,
      };
    } catch {
      return { success: true, employees: [] };
    }
  },
};