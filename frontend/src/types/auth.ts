export type GlobalRole = 'ADMIN' | 'EMPLOYEE';
export type ProjectDesignation = 'PROJECT_MANAGER' | 'CONTRIBUTOR' | 'VIEWER';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: GlobalRole;
  globalRole?: GlobalRole;
  employeeCode?: string;
  designation?: string;
  phone?: string;
  reportingManager?: string;
  isActive: boolean;
  canRequestNewProject?: boolean;
  permissions?: {
    canRequestNewProject?: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ILoginCredentials {
  email: string;
  password: string;
}

export interface IAuthResponse {
  success: boolean;
  token: string;
  user: IUser;
}

export interface IMeResponse {
  success: boolean;
  user: IUser;
}


export interface IEmployeeProjectSummary {
  _id: string;
  projectId?: string;
  projectName?: string;
  title?: string;
  status: string;
  organization?: string;
}

export interface IEmployeeProjectRole {
  project: IEmployeeProjectSummary;
  designation: ProjectDesignation;
  isDefault: boolean;
}

export interface IEmployeeProjectsResponse {
  success: boolean;
  data: {
    employee: {
      _id: string;
      name: string;
      email: string;
      employeeCode: string;
      globalRole: GlobalRole;
    };
    projectRoles: IEmployeeProjectRole[];
  };
}

export interface ICreateEmployeePayload {
  name: string;
  email: string;
  password: string;
  employeeCode: string;
  globalRole: GlobalRole;
  isActive?: boolean;
  canRequestNewProject?: boolean;
  permissions?: {
    canRequestNewProject?: boolean;
  };
  projectRoles?: Array<{ projectId: string; designation: ProjectDesignation }>;
}


export interface IUpdateEmployeePayload {
  name?: string;
  email?: string;
  password?: string;
  employeeCode?: string;
  globalRole?: GlobalRole;
  isActive?: boolean;
  canRequestNewProject?: boolean;
  permissions?: {
    canRequestNewProject?: boolean;
  };
}
