'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from '@/components/providers/auth-provider';

export type PermissionAction = 'read' | 'create' | 'update' | 'delete';

export type ManagementModule = 'roles' | 'users' | 'tenants' | 'branches' | 'user-info';
export interface Permission {
  module_submenu_id: number;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

export interface UserPermissions {
  [modulePath: string]: Permission;
}
interface PermissionContextType {
  hasPermission: (module: ManagementModule, action: PermissionAction) => boolean;
  canRead: (module: ManagementModule) => boolean;
  canCreate: (module: ManagementModule) => boolean;
  canUpdate: (module: ManagementModule) => boolean;
  canDelete: (module: ManagementModule) => boolean;
  userPermissions: UserPermissions;
  isLoading: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);


export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  const userPermissions = useMemo((): UserPermissions => {
    if (!user?.permissions) {
      return {};
    }

    const permissions: UserPermissions = {};
    Object.values(user.permissions).forEach((groupData) => {
      if (groupData.modules) {
        groupData.modules.forEach((module) => {
          if (module.module_path) {
            permissions[module.module_path] = {
              module_submenu_id: module.id,
              create: Boolean(module.permissions.create),
              read: Boolean(module.permissions.read),
              update: Boolean(module.permissions.update),
              delete: Boolean(module.permissions.delete),
            };
          }
        });
      }
    });

    console.log('Available permissions:', permissions);
    return permissions;
  }, [user?.permissions]);

  const hasPermission = (module: ManagementModule, action: PermissionAction): boolean => {
    if (loading || !user) {
      return false;
    }

    const permission = Object.entries(userPermissions).find(([path, _]) => 
      path.includes(`/${module}`)
    )?.[1];
    
    if (!permission) {
      console.warn(`Permission not found for module: ${module}`);
      return false;
    }

    if (action !== 'read' && !permission.read) {
      return false;
    }

    return permission[action] || false;
  };

  const canRead = (module: ManagementModule): boolean => hasPermission(module, 'read');
  const canCreate = (module: ManagementModule): boolean => hasPermission(module, 'create');
  const canUpdate = (module: ManagementModule): boolean => hasPermission(module, 'update');
  const canDelete = (module: ManagementModule): boolean => hasPermission(module, 'delete');

  const value: PermissionContextType = {
    hasPermission,
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    userPermissions,
    isLoading: loading,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions(): PermissionContextType {
  const context = useContext(PermissionContext);
  
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  
  return context;
}

export function useModulePermissions(module: ManagementModule) {
  const { hasPermission, canRead, canCreate, canUpdate, canDelete, isLoading } = usePermissions();

  return {
    canRead: canRead(module),
    canCreate: canCreate(module),
    canUpdate: canUpdate(module),
    canDelete: canDelete(module),
    hasPermission: (action: PermissionAction) => hasPermission(module, action),
    isLoading,
  };
}