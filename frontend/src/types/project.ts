import { IUser } from './auth';

export type ProjectStatus = 'PENDING_REVIEW' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';

export interface IProject {
  _id: string;
  orgId?: string;
  projectId: string;
  projectName: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  numberOfSchools?: number;
  numberOfLicenses?: number;
  isActive?: boolean;
  settings?: {
    purpose?: string;
  };
  organization?: string;
  title?: string;
  description?: string;
  status: ProjectStatus;
  projectManager?: string | IUser;
  requestedBy?: string | IUser;
  assignedReviewer?: string | IUser;
  reviewStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNotes?: string;
  reviewedAt?: string;
  createdBy?: string | IUser;
  archived?: boolean;
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