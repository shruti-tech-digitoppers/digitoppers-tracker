'use client';

import React, { createContext, useContext } from 'react';
import { Permissions } from '../hooks/usePermissions';

interface PermissionContextValue {
  permissions: Permissions;
  isReadOnly: boolean;
}

const defaultPermissions: Permissions = {
  canEdit: false,
  canManageEmployees: false,
  canEditTimeline: false,
  canApproveRequests: false,
  canRequestProject: false,
  role: null,
};

const PermissionContext = createContext<PermissionContextValue>({
  permissions: defaultPermissions,
  isReadOnly: true,
});

export const PermissionProvider = ({
  children,
  permissions,
}: {
  children: React.ReactNode;
  permissions: Permissions;
}) => {
  const isReadOnly = !permissions.canEdit;
  return (
    <PermissionContext.Provider value={{ permissions, isReadOnly }}>
      {children}
    </PermissionContext.Provider>
  );
};

/** Use this anywhere to get the current user's permissions */
export const usePermissionContext = () => useContext(PermissionContext);
