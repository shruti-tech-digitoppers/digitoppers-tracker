import { apiClient } from './client';
import { IAuthResponse, ILoginCredentials, IMeResponse, IUser } from '../../types/auth';

export const authApi = {
  login: async (credentials: ILoginCredentials): Promise<IAuthResponse> => {
    const response = await apiClient.post<any>('/auth/login', credentials);
    const data = response.data?.data || response.data;
    const token = data?.token || response.data?.token || '';
    const rawEmp = data?.employee || data?.user || response.data?.user || response.data?.employee;
    const user: IUser = rawEmp ? {
      _id: rawEmp._id || rawEmp.id || '',
      name: rawEmp.name || '',
      email: rawEmp.email || '',
      role: (rawEmp.globalRole || rawEmp.role || 'EMPLOYEE') as any,
      globalRole: (rawEmp.globalRole || rawEmp.role || 'EMPLOYEE') as any,
      employeeCode: rawEmp.employeeCode || '',
      isActive: rawEmp.isActive !== undefined ? rawEmp.isActive : true,
      createdAt: rawEmp.createdAt,
      updatedAt: rawEmp.updatedAt,
    } : {
      _id: '',
      name: '',
      email: credentials.email,
      role: 'EMPLOYEE',
      isActive: true,
    };

    return {
      success: true,
      token,
      user,
    };
  },

  logout: async (): Promise<{ success: boolean }> => {
    const response = await apiClient.post<{ success: boolean }>('/auth/logout').catch(() => ({ data: { success: true } }));
    return response.data;
  },

  getMe: async (): Promise<IMeResponse> => {
    const response = await apiClient.get<any>('/auth/me');
    const rawEmp = response.data?.data || response.data?.employee || response.data?.user || response.data;
    const user: IUser = rawEmp ? {
      _id: rawEmp._id || rawEmp.id || '',
      name: rawEmp.name || '',
      email: rawEmp.email || '',
      role: (rawEmp.globalRole || rawEmp.role || 'EMPLOYEE') as any,
      globalRole: (rawEmp.globalRole || rawEmp.role || 'EMPLOYEE') as any,
      employeeCode: rawEmp.employeeCode || '',
      isActive: rawEmp.isActive !== undefined ? rawEmp.isActive : true,
      createdAt: rawEmp.createdAt,
      updatedAt: rawEmp.updatedAt,
    } : {
      _id: '',
      name: '',
      email: '',
      role: 'EMPLOYEE',
      isActive: true,
    };
    return {
      success: true,
      user,
    };
  },
};