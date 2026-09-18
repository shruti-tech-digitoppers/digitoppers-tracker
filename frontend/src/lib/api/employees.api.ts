import { apiClient } from './client';
import { 
  IUser, 
  ICreateEmployeePayload, 
  IUpdateEmployeePayload, 
  IEmployeeProjectsResponse, 
  ProjectDesignation 
} from '../../types/auth';

export interface IEmployeeListResponse {
  success: boolean;
  employees: IUser[];
  count?: number;
}

export interface ISingleEmployeeResponse {
  success: boolean;
  data: IUser;
  message?: string;
}

export const employeesApi = {
  getEmployees: async (params?: { isActive?: boolean; globalRole?: string }): Promise<IEmployeeListResponse> => {
    try {
      const response = await apiClient.get<any>('/employees', { params }).catch(() => apiClient.get<any>('/users'));
      const rawList = response.data?.data || response.data?.employees || response.data?.users || (Array.isArray(response.data) ? response.data : []);
      const employees: IUser[] = rawList.map((e: any) => ({
        _id: e._id || e.id || '',
        name: e.name || '',
        email: e.email || '',
        role: e.globalRole || e.role || 'EMPLOYEE',
        globalRole: e.globalRole || e.role || 'EMPLOYEE',
        employeeCode: e.employeeCode || '',
        isActive: e.isActive !== undefined ? e.isActive : true,
        canRequestNewProject: Boolean(e.canRequestNewProject || e.permissions?.canRequestNewProject),
        permissions: {
          canRequestNewProject: Boolean(e.canRequestNewProject || e.permissions?.canRequestNewProject),
        },
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      }));
      return {
        success: true,
        employees,
        count: employees.length,
      };
    } catch {
      return { success: true, employees: [], count: 0 };
    }
  },

  getEmployeeById: async (id: string): Promise<ISingleEmployeeResponse> => {
    const response = await apiClient.get<{ success: boolean; data: IUser }>(`/employees/${id}`);
    return response.data;
  },

  createEmployee: async (payload: ICreateEmployeePayload): Promise<ISingleEmployeeResponse> => {
    const response = await apiClient.post<{ success: boolean; data: IUser; message: string }>('/employees', payload);
    return response.data;
  },

  updateEmployee: async (id: string, payload: IUpdateEmployeePayload): Promise<ISingleEmployeeResponse> => {
    const response = await apiClient.patch<{ success: boolean; data: IUser; message: string }>(`/employees/${id}`, payload);
    return response.data;
  },

  updateStatus: async (id: string, isActive: boolean): Promise<ISingleEmployeeResponse> => {
    const response = await apiClient.patch<{ success: boolean; data: IUser; message: string }>(`/employees/${id}/status`, { isActive });
    return response.data;
  },

  deleteEmployee: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/employees/${id}`);
    return response.data;
  },

  getEmployeeProjectRoles: async (employeeId: string): Promise<IEmployeeProjectsResponse> => {
    const response = await apiClient.get<IEmployeeProjectsResponse>(`/employees/${employeeId}/projects`);
    return response.data;
  },

  updateEmployeeProjectRole: async (
    employeeId: string, 
    projectId: string, 
    designation: ProjectDesignation
  ): Promise<{ success: boolean; message: string; data: any }> => {
    const response = await apiClient.put<{ success: boolean; message: string; data: any }>(
      `/employees/${employeeId}/projects/${projectId}`, 
      { designation }
    );
    return response.data;
  },
};
