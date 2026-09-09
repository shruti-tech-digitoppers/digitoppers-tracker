import { IUser } from './auth';

export type ProjectStatus = 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';

export interface IProject {
  _id: string;
  projectCode: string;
  title: string;
  description?: string;
  client?: string;
  status: ProjectStatus;
  projectManager: string | IUser;
  createdBy?: string | IUser;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IProjectMember {
  _id: string;
  project: string;
  employee: string | IUser;
  designation: 'PROJECT_MANAGER' | 'CONTRIBUTOR' | 'VIEWER';
  assignedBy: string;
  createdAt: string;
  updatedAt: string;
}