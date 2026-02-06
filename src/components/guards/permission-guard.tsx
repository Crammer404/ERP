'use client';

import React from 'react';
import { usePermissions, ManagementModule, PermissionAction } from '@/contexts/PermissionContext';
import { Loader } from '@/components/ui/loader';

interface PermissionGuardProps {
  module: ManagementModule;
  action: PermissionAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean; // If true, requires all actions to be true
  actions?: PermissionAction[]; // For multiple action checks
}

export function PermissionGuard({
  module,
  action,
  children,
  fallback = null,
  requireAll = false,
  actions = [],
}: PermissionGuardProps) {
  const { hasPermission, isLoading } = usePermissions();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader size="sm" />
      </div>
    );
  }

  // Check single permission
  if (actions.length === 0) {
    const hasAccess = hasPermission(module, action);
    return hasAccess ? <>{children}</> : <>{fallback}</>;
  }

  // Check multiple permissions
  const hasAllPermissions = actions.every(action => hasPermission(module, action));
  const hasAnyPermission = actions.some(action => hasPermission(module, action));

  const hasAccess = requireAll ? hasAllPermissions : hasAnyPermission;
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// Convenience components for common use cases
export function ReadGuard({ module, children, fallback }: Omit<PermissionGuardProps, 'action'>) {
  return (
    <PermissionGuard module={module} action="read" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function CreateGuard({ module, children, fallback }: Omit<PermissionGuardProps, 'action'>) {
  return (
    <PermissionGuard module={module} action="create" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function UpdateGuard({ module, children, fallback }: Omit<PermissionGuardProps, 'action'>) {
  return (
    <PermissionGuard module={module} action="update" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function DeleteGuard({ module, children, fallback }: Omit<PermissionGuardProps, 'action'>) {
  return (
    <PermissionGuard module={module} action="delete" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

// Component for conditional rendering based on permissions
interface PermissionButtonProps {
  module: ManagementModule;
  action: PermissionAction;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function PermissionButton({
  module,
  action,
  children,
  className,
  disabled,
  onClick,
  type = 'button',
  variant = 'default',
  size = 'default',
}: PermissionButtonProps) {
  const { hasPermission, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <div className="animate-pulse bg-muted rounded-md h-9 w-20"></div>
    );
  }

  const hasAccess = hasPermission(module, action);

  if (!hasAccess) {
    return null; // Don't render the button if no permission
  }

  // Import Button component dynamically to avoid circular dependencies
  const { Button } = require('@/components/ui/button');

  return (
    <Button
      className={className}
      disabled={disabled}
      onClick={onClick}
      type={type}
      variant={variant}
      size={size}
    >
      {children}
    </Button>
  );
}

// Component for showing permission-based content
interface PermissionContentProps {
  module: ManagementModule;
  action: PermissionAction;
  children: React.ReactNode;
  noPermissionMessage?: string;
  showMessage?: boolean;
}

export function PermissionContent({
  module,
  action,
  children,
  noPermissionMessage = 'You do not have permission to access this content.',
  showMessage = false,
}: PermissionContentProps) {
  const { hasPermission, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const hasAccess = hasPermission(module, action);

  if (!hasAccess) {
    if (showMessage) {
      return (
        <div className="flex items-center justify-center p-8 text-muted-foreground">
          <p>{noPermissionMessage}</p>
        </div>
      );
    }
    return null;
  }

  return <>{children}</>;
}
