import { apiClient } from './client';
import { IAuthResponse, ILoginCredentials, IMeResponse, IUser } from '../../types/auth';

function formatUser(rawEmp: any, fallbackEmail = ''): IUser {
  if (!rawEmp) {
    return {
      _id: '',
      name: '',
      email: fallbackEmail,
      role: 'EMPLOYEE',
      isActive: true,
    };
  }

  const role = (rawEmp.globalRole || rawEmp.role || 'EMPLOYEE') as any;
  const canRequest = Boolean(rawEmp.canRequestNewProject || rawEmp.permissions?.canRequestNewProject);

  return {
    _id: rawEmp._id || rawEmp.id || '',
    name: rawEmp.name || '',
    email: rawEmp.email || fallbackEmail,
    role,
    globalRole: role,
    employeeCode: rawEmp.employeeCode || '',
    designation: rawEmp.designation || '',
    phone: rawEmp.phone || '',
    reportingManager: rawEmp.reportingManager || '',
    isActive: rawEmp.isActive !== undefined ? rawEmp.isActive : true,
    canRequestNewProject: canRequest,
    permissions: {
      canRequestNewProject: canRequest,
    },
    createdAt: rawEmp.createdAt,
    updatedAt: rawEmp.updatedAt,
  };
}

let activeGetMePromise: Promise<IMeResponse> | null = null;
let cachedMeResponse: IMeResponse | null = null;
let lastGetMeTime = 0;
const ME_CACHE_TTL = 30000; // 30 seconds

export const authApi = {
  login: async (credentials: ILoginCredentials): Promise<IAuthResponse> => {
    cachedMeResponse = null;
    lastGetMeTime = 0;
    const response = await apiClient.post<any>('/auth/login', credentials);
    const data = response.data?.data || response.data;
    const token = data?.token || response.data?.token || '';
    const rawEmp = data?.employee || data?.user || response.data?.user || response.data?.employee;
    const user = formatUser(rawEmp, credentials.email);

    return {
      success: true,
      token,
      user,
    };
  },

  logout: async (): Promise<{ success: boolean }> => {
    cachedMeResponse = null;
    lastGetMeTime = 0;
    const response = await apiClient.post<{ success: boolean }>('/auth/logout').catch(() => ({ data: { success: true } }));
    return response.data;
  },

  getMe: async (): Promise<IMeResponse> => {
    const now = Date.now();
    if (cachedMeResponse && (now - lastGetMeTime < ME_CACHE_TTL)) {
      return cachedMeResponse;
    }

    if (activeGetMePromise) {
      return activeGetMePromise;
    }

    activeGetMePromise = (async () => {
      try {
        const response = await apiClient.get<any>('/auth/me');
        const rawEmp = response.data?.data || response.data?.employee || response.data?.user || response.data;
        const user = formatUser(rawEmp);
        const result = {
          success: true,
          user,
        };
        cachedMeResponse = result;
        lastGetMeTime = Date.now();
        return result;
      } finally {
        activeGetMePromise = null;
      }
    })();

    return activeGetMePromise;
  },
};