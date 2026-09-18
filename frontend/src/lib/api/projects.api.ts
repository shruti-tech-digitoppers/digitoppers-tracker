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

export interface IUpdateProjectPayload {
  projectId?: string;
  projectName?: string;
  title?: string;
  description?: string;
  organization?: string;
  client?: string;
  status?: ProjectStatus;
  projectManager?: string;
  assignedTo?: string;
  archived?: boolean;
}

function normalizeProject(p: any): IProject {
  const code = p.projectId || p.id || 'PRJ';
  const name = p.projectName || p.title || 'Untitled Project';

  return {
    _id: p._id || p.id || p.projectId || '',
    projectId: code,
    projectName: name,
    title: name,
    description: p.description || p.purpose || '',
    organization: p.organization || p.client || (p.clientSchools && p.clientSchools[0]?.schoolName) || p.address || 'Direct Organization',
    status: p.status || (p.isActive ? 'ACTIVE' : 'ARCHIVED'),
    projectManager: p.projectManager,
    requestedBy: p.requestedBy,
    assignedReviewer: p.assignedReviewer,
    reviewStatus: p.reviewStatus || 'PENDING',
    reviewNotes: p.reviewNotes,
    reviewedAt: p.reviewedAt,
    createdBy: p.createdBy || p.projectManager || '',
    archived: p.isActive === false || p.archived === true,
    createdAt: p.createdAt || new Date().toISOString(),
    updatedAt: p.updatedAt || new Date().toISOString(),
  };
}

export const projectsApi = {
  getProjects: async (params?: { status?: string }): Promise<IProjectsListResponse> => {
    const response = await apiClient.get<any>('/projects', { params });
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


  updateProject: async (id: string, payload: IUpdateProjectPayload): Promise<IProjectDetailResponse> => {
    const code = payload.projectId;
    const name = payload.projectName || payload.title;
    const body: any = { ...payload };
    if (code) {
      body.projectId = code.trim();
    }
    if (name) {
      body.projectName = name.trim();
      body.title = name.trim();
    }
    const response = await apiClient.patch<any>(`/projects/${id}`, body).catch(() => apiClient.put<any>(`/projects/${id}`, body));
    const raw = response.data?.data || response.data?.project || response.data;
    return {
      success: true,
      project: normalizeProject(raw),
    };
  },

  deleteProject: async (id: string): Promise<{ success: boolean }> => {
    const response = await apiClient.patch<any>(`/projects/${id}/archive`, { archived: true }).catch(() => apiClient.delete<any>(`/projects/${id}`));
    return { success: true };
  },
};