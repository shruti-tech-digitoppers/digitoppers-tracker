import { apiClient } from './client';
import {
  ISchoolRequirement,
  IProjectSchoolRequirementsBreakdown
} from '../../types/requirements';

export const requirementsApi = {
  // Get master requirement for a project with fully populated relations
  getProjectRequirements: async (projectId: string) => {
    const res = await apiClient.get<{ success: boolean; data: any }>(
      `/requirements/${projectId}`
    );
    return res.data.data;
  },

  // Save/update project requirements
  saveProjectRequirements: async (projectId: string, payload: Record<string, any>) => {
    const res = await apiClient.put<{ success: boolean; data: any; message?: string }>(
      `/requirements/${projectId}`,
      payload
    );
    return res.data.data;
  },

  // Check required solutions, hardware according to solutions, and content for all schools of a project
  getProjectSchoolRequirements: async (projectId: string): Promise<IProjectSchoolRequirementsBreakdown> => {
    const res = await apiClient.get<{ success: boolean; data: IProjectSchoolRequirementsBreakdown }>(
      `/requirements/${projectId}/schools`
    );
    return res.data.data;
  },

  // Update school branch requirements (schools -> solutions -> hardware & content)
  updateProjectSchoolRequirements: async (
    projectId: string,
    schools: ISchoolRequirement[]
  ): Promise<IProjectSchoolRequirementsBreakdown> => {
    const res = await apiClient.put<{ success: boolean; data: IProjectSchoolRequirementsBreakdown; message?: string }>(
      `/requirements/${projectId}/schools`,
      { schools }
    );
    return res.data.data;
  },

  // Check required solutions, hardware, content for a single school branch
  checkSchoolRequirements: async (projectId: string, schoolId: string): Promise<ISchoolRequirement> => {
    const res = await apiClient.get<{ success: boolean; data: ISchoolRequirement }>(
      `/requirements/${projectId}/schools/${schoolId}`
    );
    return res.data.data;
  }
};

