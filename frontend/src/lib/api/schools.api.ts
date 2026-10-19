import { apiClient } from './client';
import { ISchool, ISchoolProgressSummary, ISchoolInstallation, ISchoolTraining } from '../../types/school';

export interface ISchoolFilterParams {
  projectId?: string;
  installationStatus?: string;
  trainingStatus?: string;
  assignedEngineerId?: string;
  assignedTrainerId?: string;
  district?: string;
  search?: string;
}

export const schoolsApi = {
  // Get all schools for a project with optional filters
  getSchools: async (params?: ISchoolFilterParams): Promise<ISchool[]> => {
    const res = await apiClient.get<{ success: boolean; data: ISchool[] }>('/schools', { params });
    return res.data.data;
  },

  // Get single school by ID
  getSchoolById: async (schoolId: string): Promise<ISchool> => {
    const res = await apiClient.get<{ success: boolean; data: ISchool }>(`/schools/${schoolId}`);
    return res.data.data;
  },

  // Create single school
  createSchool: async (payload: Partial<ISchool>): Promise<ISchool> => {
    const res = await apiClient.post<{ success: boolean; data: ISchool }>('/schools', payload);
    return res.data.data;
  },

  // Bulk create schools (e.g. from Excel)
  bulkCreateSchools: async (projectId: string, schools: Partial<ISchool>[]): Promise<ISchool[]> => {
    const res = await apiClient.post<{ success: boolean; data: ISchool[] }>('/schools/bulk', {
      projectId,
      schools,
    });
    return res.data.data;
  },

  // Update school basic info / hardware
  updateSchool: async (schoolId: string, payload: Partial<ISchool>): Promise<ISchool> => {
    const res = await apiClient.put<{ success: boolean; data: ISchool }>(`/schools/${schoolId}`, payload);
    return res.data.data;
  },

  // Update per-school installation status
  updateInstallation: async (schoolId: string, payload: Partial<ISchoolInstallation>): Promise<ISchoolInstallation> => {
    const res = await apiClient.patch<{ success: boolean; data: ISchoolInstallation }>(
      `/schools/${schoolId}/installation`,
      payload
    );
    return res.data.data;
  },

  // Update per-school training status
  updateTraining: async (schoolId: string, payload: Partial<ISchoolTraining>): Promise<ISchoolTraining> => {
    const res = await apiClient.patch<{ success: boolean; data: ISchoolTraining }>(
      `/schools/${schoolId}/training`,
      payload
    );
    return res.data.data;
  },

  // Get progress statistics for a project
  getProjectSchoolSummary: async (projectId: string): Promise<ISchoolProgressSummary> => {
    const res = await apiClient.get<{ success: boolean; data: ISchoolProgressSummary }>(
      `/projects/${projectId}/schools/summary`
    );
    return res.data.data;
  },
};
