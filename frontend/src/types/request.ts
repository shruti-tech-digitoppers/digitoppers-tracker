import { IUser } from './auth';

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface IProjectRequest {
  _id: string;
  requestId: string;
  title: string;
  projectName?: string;
  email?: string;
  country?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
  organization?: string;
  description?: string;
  expectedProjectValue?: number;
  requestedBy: IUser | string;
  requestedTo: IUser | string;
  projectManager: IUser | string;
  status: RequestStatus;
  reviewNotes?: string;
  reviewedBy?: IUser | string;
  reviewedAt?: string;
  confirmedProjectId?: any;
  projectId?: string;
  dashboardProjectId?: string;
  isManualDashboardCreated?: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateProjectRequestPayload {
  requestId?: string;
  title?: string;
  projectName?: string;
  email?: string;
  country?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
  organization?: string;
  description?: string;
  expectedProjectValue?: number;
  requestedTo: string;
  projectManager: string;
}

export interface IApproveRequestPayload {
  projectId?: string;
  dashboardProjectId?: string;
  reviewNotes?: string;
}
