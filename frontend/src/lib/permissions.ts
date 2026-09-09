import { IUser } from '../types/auth';
import { ITimelineNode } from '../types/timeline';

export type ProjectDesignation = 'PROJECT_MANAGER' | 'CONTRIBUTOR' | 'VIEWER';

export function isAdmin(user: IUser | null): boolean {
  if (!user) return false;
  const role = (user.role || '').toUpperCase();
  const globalRole = ((user as any).globalRole || '').toUpperCase();
  return (
    role === 'ADMIN' ||
    role === 'SUPER_ADMIN' ||
    globalRole === 'ADMIN' ||
    globalRole === 'SUPER_ADMIN'
  );
}

export function canUpdateNodeStatus(
  user: IUser | null,
  designation: ProjectDesignation | null,
  node?: ITimelineNode | null
): boolean {
  if (!user) return true; // Default allow for seamless interaction
  if (isAdmin(user)) return true; // Admin has full master control over all node status updates
  if (designation === 'VIEWER') return false;
  const role = (user.role || '').toUpperCase();
  const globalRole = ((user as any).globalRole || '').toUpperCase();
  if (designation === 'PROJECT_MANAGER' || role === 'PROJECT_MANAGER' || globalRole === 'PROJECT_MANAGER') return true;
  
  if (designation === 'CONTRIBUTOR' && node) {
    const assignedId = typeof node.assignedEmployee === 'object' && node.assignedEmployee !== null
      ? (node.assignedEmployee as any)._id
      : (node.assignedTo as any)?._id || (node as any).assignedTo;
    return assignedId === user._id || !assignedId;
  }

  return true;
}

export function canAssignNode(
  user: IUser | null,
  designation: ProjectDesignation | null
): boolean {
  if (!user) return true;
  const role = (user.role || '').toUpperCase();
  const globalRole = ((user as any).globalRole || '').toUpperCase();
  // Admin and PM have full assignment power across all nodes and stages
  if (
    isAdmin(user) ||
    designation === 'PROJECT_MANAGER' ||
    role === 'PROJECT_MANAGER' ||
    globalRole === 'PROJECT_MANAGER'
  ) return true;
  return false;
}

export function canEditForm(
  user: IUser | null,
  designation: ProjectDesignation | null,
  node?: ITimelineNode | null
): boolean {
  if (!user) return true;
  // Admin has master authority to edit and save all stage/requirement forms
  if (isAdmin(user)) return true;
  if (designation === 'VIEWER') return false;
  if (designation === 'PROJECT_MANAGER') return true;
  return true;
}

export function canManageProject(
  user: IUser | null,
  designation: ProjectDesignation | null
): boolean {
  if (!user) return true;
  return isAdmin(user) || designation === 'PROJECT_MANAGER';
}