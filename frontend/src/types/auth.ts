export type GlobalRole = 'ADMIN' | 'EMPLOYEE';
export type ProjectDesignation = 'PROJECT_MANAGER' | 'CONTRIBUTOR' | 'VIEWER';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: GlobalRole;
  globalRole?: GlobalRole;
  employeeCode?: string;
  isActive: boolean;
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