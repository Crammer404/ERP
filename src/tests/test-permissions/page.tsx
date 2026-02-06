'use client';

import React from 'react';
import { useModulePermissions } from '@/contexts/PermissionContext';
import { PermissionGuard, PermissionButton } from '@/components/guards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Eye, Plus, Edit, Trash2 } from 'lucide-react';

export default function TestPermissionsPage() {
  const rolesPermissions = useModulePermissions('roles');
  const tenantsPermissions = useModulePermissions('tenants');
  const branchesPermissions = useModulePermissions('branches');
  const usersPermissions = useModulePermissions('users');

  const modules = [
    { name: 'Roles', permissions: rolesPermissions, module: 'roles' as const },
    { name: 'Tenants', permissions: tenantsPermissions, module: 'tenants' as const },
    { name: 'Branches', permissions: branchesPermissions, module: 'branches' as const },
    { name: 'Users', permissions: usersPermissions, module: 'users' as const },
  ];

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Shield className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-2xl font-bold font-headline">Permission System Test</h1>
          <p className="text-muted-foreground">Test the permission system implementation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {modules.map(({ name, permissions, module }) => (
          <Card key={module}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Permission Status */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Read</span>
                  <Badge variant={permissions.canRead ? 'default' : 'secondary'}>
                    {permissions.canRead ? 'Allowed' : 'Denied'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Create</span>
                  <Badge variant={permissions.canCreate ? 'default' : 'secondary'}>
                    {permissions.canCreate ? 'Allowed' : 'Denied'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Update</span>
                  <Badge variant={permissions.canUpdate ? 'default' : 'secondary'}>
                    {permissions.canUpdate ? 'Allowed' : 'Denied'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Delete</span>
                  <Badge variant={permissions.canDelete ? 'default' : 'secondary'}>
                    {permissions.canDelete ? 'Allowed' : 'Denied'}
                  </Badge>
                </div>
              </div>

              {/* Permission Guards Test */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Permission Guards:</h4>
                
                <PermissionGuard module={module} action="read">
                  <Button size="sm" variant="outline" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    View {name}
                  </Button>
                </PermissionGuard>

                <PermissionButton module={module} action="create" size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create {name}
                </PermissionButton>

                <PermissionButton module={module} action="update" size="sm" variant="outline" className="w-full">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit {name}
                </PermissionButton>

                <PermissionButton module={module} action="delete" size="sm" variant="destructive" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete {name}
                </PermissionButton>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Test Access Denied */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Access Denied Test</CardTitle>
        </CardHeader>
        <CardContent>
          <PermissionGuard 
            module="roles" 
            action="read" 
            fallback={
              <div className="text-center py-8">
                <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
                <p className="text-muted-foreground">You don't have permission to view this content.</p>
              </div>
            }
          >
            <div className="text-center py-8">
              <Shield className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Granted</h3>
              <p className="text-muted-foreground">You have permission to view this content.</p>
            </div>
          </PermissionGuard>
        </CardContent>
      </Card>
    </div>
  );
}
