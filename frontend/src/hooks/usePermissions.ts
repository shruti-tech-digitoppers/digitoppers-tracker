'use client';

import { useMemo } from 'react';
import { IUser } from '../types/auth';

export interface Permissions {
  /** True if user can create/edit/delete anything (projects, employees, timeline) */
  canEdit: boolean;
  /** True if user can manage employees (ADMIN only) */
  canManageEmployees: boolean;
  /** True if user can edit timeline stages */
  canEditTimeline: boolean;
  /** True if user can approve/reject requests */
  canApproveRequests: boolean;
  /** True if user can request new projects */
  canRequestProject: boolean;
  /** "ADMIN" | "EMPLOYEE" | null */
  role: string | null;
}

export function usePermissions(currentUser: IUser | null): Permissions {
  return useMemo(() => {
    const role =
      (currentUser?.globalRole as string) ||
      (currentUser as any)?.role ||
      null;

    const isAdmin = role === 'ADMIN';

    return {
      canEdit: isAdmin,
      canManageEmployees: isAdmin,
      canEditTimeline: isAdmin,
      canApproveRequests: isAdmin,
      canRequestProject:
        isAdmin ||
        !!currentUser?.canRequestNewProject ||
        !!currentUser?.permissions?.canRequestNewProject,
      role,
    };
  }, [currentUser]);
}
