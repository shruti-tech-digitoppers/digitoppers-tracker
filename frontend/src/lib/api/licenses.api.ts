import { apiClient } from './client';

export interface ILicenseRecord {
  _id?: string;
  licenseKey: string;
  status: 'active' | 'registered' | 'renewed' | 'expired' | string;
  isRegistered: boolean;
  registeredAt?: string | null;
  registeredTo?: string | null;
  schoolId?: string | any;
  projectId?: string | any;
  createdAt?: string;
  updatedAt?: string;
}

export interface ISchoolHardwareLicense {
  _id?: string;
  projectId: string | any;
  schoolId: string | any;
  schoolName?: string;
  hardwareId?: string | any;
  hardwareKey: string;
  hardwareName: string;
  specId?: string | any;
  specName?: string;
  specKey?: string;
  unitIndex: number;
  licenseId?: string | any;
  licenseKey: string;
  status: 'ALLOCATED' | 'ACTIVE' | 'REGISTERED' | 'REVOKED' | 'EXPIRED' | string;
  isRegistered?: boolean;
  registeredAt?: string | null;
  registeredTo?: string | null;
  allocatedAt?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const licensesApi = {
  // ── Raw Standalone License Pool (Undisturbed) ──
  getLicenses: async (params?: { projectId?: string; schoolId?: string; status?: string; isRegistered?: boolean }): Promise<ILicenseRecord[]> => {
    const res = await apiClient.get('/licenses', { params });
    return res.data?.data || [];
  },

  getLicenseByKeyOrId: async (keyOrId: string): Promise<ILicenseRecord | null> => {
    const res = await apiClient.get(`/licenses/${keyOrId}`);
    return res.data?.data || null;
  },

  createLicense: async (data: Partial<ILicenseRecord>): Promise<ILicenseRecord> => {
    const res = await apiClient.post('/licenses', data);
    return res.data?.data;
  },

  bulkCreateLicenses: async (licenses: Partial<ILicenseRecord>[]): Promise<any> => {
    const res = await apiClient.post('/licenses/bulk', { licenses });
    return res.data;
  },

  registerLicense: async (id: string, registeredTo?: string): Promise<ILicenseRecord> => {
    const res = await apiClient.patch(`/licenses/${id}/register`, { registeredTo });
    return res.data?.data;
  },

  // ── Junction Relation: School + Hardware + License Allocation ──
  getAllocations: async (params?: { projectId?: string; schoolId?: string; hardwareKey?: string; status?: string }): Promise<ISchoolHardwareLicense[]> => {
    const res = await apiClient.get('/licenses/allocations', { params });
    return res.data?.data || [];
  },

  upsertAllocation: async (data: Partial<ISchoolHardwareLicense>): Promise<ISchoolHardwareLicense> => {
    const res = await apiClient.post('/licenses/allocations', data);
    return res.data?.data;
  },

  updateAllocation: async (id: string, data: Partial<ISchoolHardwareLicense>): Promise<ISchoolHardwareLicense> => {
    const res = await apiClient.patch(`/licenses/allocations/${id}`, data);
    return res.data?.data;
  },

  deleteAllocation: async (id: string): Promise<void> => {
    await apiClient.delete(`/licenses/allocations/${id}`);
  },

  bulkUpsertAllocations: async (allocations: Partial<ISchoolHardwareLicense>[]): Promise<any> => {
    const res = await apiClient.post('/licenses/allocations/bulk', { allocations });
    return res.data;
  },

  syncProjectAllocations: async (projectId: string): Promise<ISchoolHardwareLicense[]> => {
    const res = await apiClient.post(`/licenses/allocations/sync-project/${projectId}`);
    return res.data?.data || [];
  },
};

