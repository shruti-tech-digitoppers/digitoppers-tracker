import { apiClient } from './client';
import { IProject, ProjectStatus } from '../../types/project';

export interface IProjectsListResponse {
  success: boolean;
  projects: IProject[];
}

export interface IProjectDetailResponse {
  success: boolean;
  project: IProject;
}

export interface ICreateProjectPayload {
  projectCode: string;
  title: string;
  description?: string;
  client?: string;
  projectManager?: string;
  status?: ProjectStatus;
}

export interface IUpdateProjectPayload {
  title?: string;
  description?: string;
  client?: string;
  status?: ProjectStatus;
  projectManager?: string;
  archived?: boolean;
}

function normalizeProject(p: any): IProject {
  return {
    _id: p._id || p.id || p.projectId || '',
    projectCode: p.projectCode || p.id || p.projectId || 'PRJ',
    title: p.title || p.projectName || 'Untitled Project',
    description: p.description || p.purpose || '',
    client: p.client || (p.clientSchools && p.clientSchools[0]?.schoolName) || p.address || 'N/A',
    status: p.status || (p.isActive ? 'ACTIVE' : 'ARCHIVED'),
    projectManager: p.projectManager,
    createdBy: p.createdBy || p.projectManager || '',
    archived: p.isActive === false,
    createdAt: p.createdAt || new Date().toISOString(),
    updatedAt: p.updatedAt || new Date().toISOString(),
  };
}

export const projectsApi = {
  getProjects: async (): Promise<IProjectsListResponse> => {
    const response = await apiClient.get<any>('/projects');
    const rawList = response.data?.data || response.data?.projects || (Array.isArray(response.data) ? response.data : []);
    const projects = rawList.map(normalizeProject);
    return {
      success: true,
      projects,
    };
  },

  getProjectById: async (id: string): Promise<IProjectDetailResponse> => {
    const response = await apiClient.get<any>(`/projects/${id}`);
    const raw = response.data?.data || response.data?.project || response.data;
    return {
      success: true,
      project: normalizeProject(raw),
    };
  },

  createProject: async (payload: ICreateProjectPayload): Promise<IProjectDetailResponse> => {
    // Check if user is admin/pm and post to admin/projects if available or projects
    const body = {
      projectName: payload.title,
      projectId: payload.projectCode,
      ...payload,
    };
    const response = await apiClient.post<any>('/admin/projects', body).catch(() => apiClient.post<any>('/projects', body));
    const raw = response.data?.data || response.data?.project || response.data;
    return {
      success: true,
      project: normalizeProject(raw),
    };
  },

  updateProject: async (id: string, payload: IUpdateProjectPayload): Promise<IProjectDetailResponse> => {
    const response = await apiClient.patch<any>(`/projects/${id}`, payload).catch(() => apiClient.put<any>(`/projects/${id}`, payload));
    const raw = response.data?.data || response.data?.project || response.data;
    return {
      success: true,
      project: normalizeProject(raw),
    };
  },

  deleteProject: async (id: string): Promise<{ success: boolean }> => {
    const response = await apiClient.patch<any>(`/projects/${id}`, { isActive: false }).catch(() => apiClient.delete<any>(`/projects/${id}`));
    return { success: true };
  },
};