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
  remarks?: string;
  description?: string;
  expectedProjectValue?: number;
  requestedBy: IUser | string;
  requestedTo: IUser | string;
  projectManager: IUser | string;
  status: RequestStatus;
  reviewNotes?: string;
  reviewedBy?: IUser | string;
  projectId?: string | { _id: string; projectId?: string; [key: string]: any };
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
  remarks?: string;
  expectedProjectValue?: number;
  requestedTo: string;
  projectManager: string;
}

export interface IApproveRequestPayload {
  projectId?: string;
  dashboardProjectId?: string;
  reviewNotes?: string;
}
