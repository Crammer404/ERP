'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreVertical, Plus, Trash2, Edit, Search, RefreshCw, Shield, Users } from 'lucide-react';
import { roleService, Role, CreateRoleRequest, UpdateRoleRequest, moduleSubmenuService, ModuleSubmenuWithPermissions, userService } from '@/services';
import { PermissionGuard, PermissionButton } from '@/components/guards';
import { useModulePermissions } from '@/contexts/PermissionContext';
import { Loader } from '@/components/ui/loader';
import { EmptyStates } from '@/components/ui/empty-state';
import { useToast } from '@/hooks/use-toast';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import { FullPageAccessDenied } from '@/components/error/error-page';
import { PaginationInfos } from '@/components/ui/pagination-info';
import { UserAvatarStack, UserData } from '@/components/ui/user-avatar-stack';
import { RoleFormModal } from './components/role-form-modal';
import { RoleUsersModal } from './components/role-users-modal';
import { tenantContextService } from '@/services/tenant/tenantContextService';

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('role-list');
  const [searchTerm, setSearchTerm] = useState('');

  // Get permissions for roles module
  const { canRead, canCreate, canUpdate, canDelete } = useModulePermissions('roles');
  
  // Toast for notifications
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const filteredRoles = roles.filter(role => 
    role.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleItemsPerPageChange = (newItemsPerPage: string) => {
    const perPage = parseInt(newItemsPerPage);
    setItemsPerPage(perPage);
    setCurrentPage(1);
  };

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [manageUsersModalOpen, setManageUsersModalOpen] = useState(false);

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleUsers, setRoleUsers] = useState<UserData[]>([]);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [loadingUsersModal, setLoadingUsersModal] = useState(false);
  const [selectedUserIdToAdd, setSelectedUserIdToAdd] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const [formLoading, setFormLoading] = useState(false);

  const [formErrors, setFormErrors] = useState({
    name: '',
    description: ''
  });

  const [permissionsConfirmOpen, setPermissionsConfirmOpen] = useState(false);

  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [moduleSubmenus, setModuleSubmenus] = useState<ModuleSubmenuWithPermissions[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);

  const getRoleUsers = (role: Role): UserData[] => {
    if (!role.users || !Array.isArray(role.users)) {
      return [];
    }
    const branchContext = tenantContextService.getStoredBranchContext();
    const branchId = branchContext?.id;
    const filteredUsers = branchId
      ? role.users.filter((user) =>
          !user.branches || user.branches.some((branch) => branch.id === branchId)
        )
      : role.users;
    return filteredUsers.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
    }));
  };

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const rolesData = await roleService.getAll();
      if (Array.isArray(rolesData)) {
        setRoles(rolesData);
      } else {
        console.error('Unexpected roles data:', rolesData);
        setRoles([]);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchRoles();
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
    });
    setFormErrors({
      name: '',
      description: ''
    });
  };

  const isFormValid = () => {
    return formData.name.trim() !== '' && formData.description.trim() !== '';
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const openEditModal = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name || '',
      description: role.description || ''
    });
    setEditModalOpen(true);
  };

  const openDeleteModal = (role: Role) => {
    setSelectedRole(role);
    setDeleteModalOpen(true);
  };

  const openManageUsersModal = async (role: Role) => {
    setSelectedRole(role);
    setRoleUsers(getRoleUsers(role));
    setManageUsersModalOpen(true);
    setLoadingUsersModal(true);
    try {
      const response = await userService.getAll(1, 1000, '');
      const users = response.users || [];
      const mapped: UserData[] = users.map((user: any) => {
        const name =
          user.name ||
          (user.user_info
            ? `${user.user_info.first_name || ''} ${user.user_info.last_name || ''}`.trim()
            : '') ||
          user.email;
        return {
          id: user.id,
          name,
          email: user.email,
        };
      });
      setAllUsers(mapped);
    } catch {
      setAllUsers([]);
    } finally {
      setLoadingUsersModal(false);
    }
  };

  const handleAssignUserToRole = async () => {
    if (!selectedRole || !selectedUserIdToAdd) return;
    const userId = parseInt(selectedUserIdToAdd);
    if (Number.isNaN(userId)) return;

    setFormLoading(true);
    try {
      await userService.update(userId, { role_id: selectedRole.id });
      const assignedUser = allUsers.find((user) => user.id === userId);
      setRoles((prev) =>
        prev.map((role) => {
          const existingUsers = role.users || [];
          const filteredUsers = existingUsers.filter((user) => user.id !== userId);
          if (role.id === selectedRole.id && assignedUser) {
            return {
              ...role,
              users: [
                ...filteredUsers,
                {
                  id: assignedUser.id,
                  name: assignedUser.name,
                  email: assignedUser.email,
                },
              ],
            };
          }
          return {
            ...role,
            users: filteredUsers,
          };
        }),
      );
      const updatedRoleUsers = roleUsers.filter((user) => user.id !== userId);
      if (assignedUser) {
        updatedRoleUsers.push(assignedUser);
      }
      setRoleUsers(updatedRoleUsers);
      setSelectedUserIdToAdd('');
      toast({
        title: 'Success',
        description: 'User assigned to role successfully.',
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to assign user to role.',
        variant: 'destructive',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleChangeUserRole = async (userId: number, newRoleId: number) => {
    if (!selectedRole || !newRoleId) return;
    setFormLoading(true);
    try {
      await userService.update(userId, { role_id: newRoleId });
      const movedUser = roleUsers.find((user) => user.id === userId);
      setRoles((prev) =>
        prev.map((role) => {
          const existingUsers = role.users || [];
          const filteredUsers = existingUsers.filter((user) => user.id !== userId);
          if (role.id === newRoleId && movedUser) {
            return {
              ...role,
              users: [
                ...filteredUsers,
                {
                  id: movedUser.id,
                  name: movedUser.name,
                  email: movedUser.email,
                },
              ],
            };
          }
          return {
            ...role,
            users: filteredUsers,
          };
        }),
      );
      if (newRoleId !== selectedRole.id) {
        setRoleUsers((prev) => prev.filter((user) => user.id !== userId));
      }
      toast({
        title: 'Success',
        description: 'User role updated successfully.',
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to update user role.',
        variant: 'destructive',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({ name: '', description: '' });
    const errors = { name: '', description: '' };
    let hasErrors = false;
    
    if (!formData.name.trim()) {
      errors.name = 'Role name is required';
      hasErrors = true;
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
      hasErrors = true;
    }

    if (formData.name.trim()) {
      const existingRole = roles.find(role => 
        role.name.toLowerCase() === formData.name.trim().toLowerCase()
      );
      if (existingRole) {
        errors.name = 'Role name already exists';
        hasErrors = true;
      }
    }
    
    if (hasErrors) {
      setFormErrors(errors);
      return;
    }
    
    setFormLoading(true);

    try {
      const payload: CreateRoleRequest = {
        name: formData.name,
        description: formData.description,
        permissions: [],
      };
      await roleService.create(payload);
      toast({
        title: "Success",
        description: "Role created successfully!",
        variant: "success",
      });
      
      setAddModalOpen(false);
      resetForm();
      fetchRoles();
    } catch (err: any) {

      toast({
        title: "Error",
        description: err.response?.data?.message || 'Failed to create role.',
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Handle update role
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setFormErrors({ name: '', description: '' });
    const errors = { name: '', description: '' };
    let hasErrors = false;
    
    if (!formData.name.trim()) {
      errors.name = 'Role name is required';
      hasErrors = true;
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
      hasErrors = true;
    }

    if (formData.name.trim()) {
      const existingRole = roles.find(role => 
        role.name.toLowerCase() === formData.name.trim().toLowerCase() && 
        role.id !== selectedRole.id
      );
      if (existingRole) {
        errors.name = 'Role name already exists';
        hasErrors = true;
      }
    }
    
    if (hasErrors) {
      setFormErrors(errors);
      return;
    }

    setFormLoading(true);

    try {
      const payload: UpdateRoleRequest = {
        name: formData.name,
        description: formData.description,
        permissions: [],
      };
      await roleService.update(selectedRole.id, payload);
      toast({
        title: "Success",
        description: "Role updated successfully!",
        variant: "success",
      });
      
      setEditModalOpen(false);
      setSelectedRole(null);
      resetForm();
      fetchRoles();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || 'Failed to update role.',
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRole) return;
    setFormLoading(true);
    try {
      await roleService.delete(selectedRole.id);
      toast({
        title: "Success",
        description: "Role deleted successfully!",
        variant: "success",
      });
      
      setDeleteModalOpen(false);
      setSelectedRole(null);
      fetchRoles();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || 'Failed to delete role.',
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Handle role selection for permissions
  const handleRoleSelection = async (roleId: string) => {
    if (!roleId) {
      setSelectedRoleId(null);
      setModuleSubmenus([]);
      return;
    }

    const id = parseInt(roleId);
    setSelectedRoleId(id);
    setPermissionsLoading(true);

    try {
      const submenus = await moduleSubmenuService.getModuleSubmenusWithPermissions(id);
      setModuleSubmenus(submenus);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || 'Failed to fetch permissions.',
        variant: "destructive",
      });
      setModuleSubmenus([]);
    } finally {
      setPermissionsLoading(false);
    }
  };

  // Handle permission update (local state only, no auto-save)
  const handlePermissionUpdate = (moduleSubmenuId: number, permissionType: 'create' | 'read' | 'update' | 'delete', value: boolean) => {
    setModuleSubmenus(prev => prev.map(submenu => {
      if (submenu.id === moduleSubmenuId) {
        return {
          ...submenu,
          permissions: {
            ...submenu.permissions,
            [permissionType]: value
          }
        };
      }
      return submenu;
    }));
  };

  // Handle Read permission update - controls other permissions
  const handlePermissionUpdateRead = (moduleSubmenuId: number, value: boolean) => {
    setModuleSubmenus(prev => prev.map(submenu => {
      if (submenu.id === moduleSubmenuId) {
        return {
          ...submenu,
          permissions: {
            ...submenu.permissions,
            read: value,
            create: value ? (submenu.permissions?.create || false) : false,
            update: value ? (submenu.permissions?.update || false) : false,
            delete: value ? (submenu.permissions?.delete || false) : false,
          }
        };
      }
      return submenu;
    }));
  };

  // Handle select all for a specific permission type (vertical - all modules)
  const handleSelectAll = (permissionType: 'create' | 'read' | 'update' | 'delete', value: boolean) => {
    setModuleSubmenus(prev => prev.map(submenu => ({
      ...submenu,
      permissions: {
        ...submenu.permissions,
        [permissionType]: value
      }
    })));
  };

  // Handle select all for Read permission - controls all other permissions
  const handleSelectAllRead = (value: boolean) => {
    setModuleSubmenus(prev => prev.map(submenu => ({
      ...submenu,
      permissions: {
        ...submenu.permissions,
        read: value,
        create: value ? (submenu.permissions?.create || false) : false,
        update: value ? (submenu.permissions?.update || false) : false,
        delete: value ? (submenu.permissions?.delete || false) : false,
      }
    })));
  };

  // Handle check all for a specific module (horizontal - all permissions for one module)
  const handleCheckAllForModule = (moduleSubmenuId: number, value: boolean) => {
    setModuleSubmenus(prev => prev.map(submenu => {
      if (submenu.id === moduleSubmenuId) {
        return {
          ...submenu,
          permissions: {
            ...submenu.permissions,
            read: value,
            create: value,
            update: value,
            delete: value
          }
        };
      }
      return submenu;
    }));
  };

  // Handle check all for everything (master checkbox)
  const handleCheckAllEverything = (value: boolean) => {
    setModuleSubmenus(prev => prev.map(submenu => ({
      ...submenu,
      permissions: {
        ...submenu.permissions,
        create: value,
        read: value,
        update: value,
        delete: value
      }
    })));
  };

  const handleSavePermissions = () => {
    if (!selectedRoleId) return;
    setPermissionsConfirmOpen(true);
  };

  const confirmSavePermissions = async () => {
    if (!selectedRoleId) return;

    setFormLoading(true);
    setPermissionsConfirmOpen(false);

    try {
      const permissions = moduleSubmenus
        .filter(submenu => submenu.id && submenu.id > 0)
        .map(submenu => ({
          module_submenu_id: submenu.id,
          create: submenu.permissions?.create || false,
          read: submenu.permissions?.read || false,
          update: submenu.permissions?.update || false,
          delete: submenu.permissions?.delete || false,
        }));

      console.log('Sending permissions:', permissions);
      await moduleSubmenuService.updateRolePermissions(selectedRoleId, permissions);
      toast({
        title: "Success",
        description: "Permissions saved successfully!",
        variant: "success",
      });
      
      window.location.reload();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || 'Failed to save permissions.',
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);
  const paginatedRoles = filteredRoles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // If user doesn't have read permission, show access denied
  if (!canRead) {
    return <FullPageAccessDenied moduleName="roles" />;
  }

  return (
    <div>
      <Card>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Action Bar*/}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-6 mb-6">
              {activeTab === 'role-list' ? (
                <>
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                     <Input
                       placeholder="Search roles, names..."
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       className="pl-10 w-full"
                     />
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                    <Button 
                      onClick={handleRefresh}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none"
                      disabled={loading}
                    >
                      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                     <PermissionButton
                       module="roles"
                       action="create"
                       onClick={() => setAddModalOpen(true)}
                       className="flex items-center gap-2 flex-1 sm:flex-none"
                     >
                       <Plus className="h-4 w-4" />
                       Add Role
                     </PermissionButton>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <Select onValueChange={handleRoleSelection} defaultValue="">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a role to manage permissions..." />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role, index) => (
                          <SelectItem key={role.id || `role-${index}`} value={role.id?.toString() || ""}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="role-list">Role List</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="role-list" className="mt-0">
                
                {loading ? (
              <div className="flex justify-center py-8">
                <Loader size="md" />
              </div>
              ) : filteredRoles.length === 0 ? (
                <EmptyStates.Roles/>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="w-1/3">Description</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                        {paginatedRoles.map((role, index) => (
                        <TableRow key={role.id || `role-${index}`}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate text-sm text-muted-foreground">
                            {role.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <UserAvatarStack
                            users={getRoleUsers(role)}
                            maxVisible={4}
                            size="sm"
                          />
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center">
                                 {canUpdate && (
                                   <DropdownMenuItem onClick={() => openEditModal(role)}>
                                     <Edit className="h-4 w-4 mr-2" />
                                     Edit
                                   </DropdownMenuItem>
                                 )}
                                 {canUpdate && (
                                   <DropdownMenuItem onClick={() => openManageUsersModal(role)}>
                                     <Users className="h-4 w-4 mr-2" />
                                     Manage Users
                                   </DropdownMenuItem>
                                 )}
                                 {canDelete && (
                                <DropdownMenuItem
                                     onClick={() => openDeleteModal(role)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                     <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                                 )}
                                 {!canUpdate && !canDelete && (
                                   <DropdownMenuItem disabled>
                                     <span className="text-muted-foreground">No actions available</span>
                                   </DropdownMenuItem>
                                 )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                    {/* Pagination controls */}
                <div className="flex justify-between items-center mt-6">
                  <PaginationInfos.Limited
                    from={(currentPage - 1) * itemsPerPage + 1}
                    to={Math.min(currentPage * itemsPerPage, filteredRoles.length)}
                    total={filteredRoles.length}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={handleItemsPerPageChange}
                  />

                  <div className="flex justify-end">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(prev => Math.max(prev - 1, 1));
                            }}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page =>
                            page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)
                          )
                          .map((page, idx, arr) => {
                            const prev = arr[idx - 1];
                            const showEllipsis = prev && page - prev > 1;
                            return (
                              <React.Fragment key={page}>
                                {showEllipsis && (
                                  <PaginationItem>
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                )}
                                <PaginationItem>
                                  <PaginationLink
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setCurrentPage(page);
                                    }}
                                    isActive={currentPage === page}
                                    className="cursor-pointer"
                                  >
                                    {page}
                                  </PaginationLink>
                                </PaginationItem>
                              </React.Fragment>
                            );
                          })}
                        
                        <PaginationItem>
                          <PaginationNext 
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(prev => Math.min(prev + 1, totalPages));
                            }}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </div>
                  </>
                )}
            </TabsContent>
            
            <TabsContent value="permissions" className="mt-0">
              <PermissionGuard module="roles" action="read">
                <div className="space-y-6">


                {permissionsLoading && (
                  <div className="flex justify-center py-8">
                    <Loader size="md" />
                  </div>
                )}

                {!permissionsLoading && selectedRoleId && moduleSubmenus.length > 0 && (
                  <div className="space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold ml-2">
                        Permissions for {roles.find(r => r.id === selectedRoleId)?.name}
                      </h3>
                </div>

                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                         <TableHeader>
                           <TableRow>
                             <TableHead className="w-1/4">Module Submenu</TableHead>
                             <TableHead className="text-center">Check All</TableHead>
                             <TableHead className="text-center">Read</TableHead>
                             <TableHead className="text-center">Create</TableHead>
                             <TableHead className="text-center">Update</TableHead>
                             <TableHead className="text-center">Delete</TableHead>
                           </TableRow>
                         </TableHeader>
                        <TableBody>
                          {/* Select All Row */}
                          <TableRow className="bg-muted/50">
                            <TableCell className="font-semibold">
                              <div className="flex flex-col">
                                <span>Select All</span>
                                <span className="text-xs text-muted-foreground">(Toggle all modules)</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                id="master-check-all"
                                checked={moduleSubmenus.every(submenu => 
                                  (submenu.permissions?.create || false) && 
                                  (submenu.permissions?.read || false) && 
                                  (submenu.permissions?.update || false) && 
                                  (submenu.permissions?.delete || false)
                                )}
                                ref={(el) => {
                                  if (el) {
                                    const someChecked = moduleSubmenus.some(submenu => 
                                      (submenu.permissions?.create || false) || 
                                      (submenu.permissions?.read || false) || 
                                      (submenu.permissions?.update || false) || 
                                      (submenu.permissions?.delete || false)
                                    );
                                    const allChecked = moduleSubmenus.every(submenu => 
                                      (submenu.permissions?.create || false) && 
                                      (submenu.permissions?.read || false) && 
                                      (submenu.permissions?.update || false) && 
                                      (submenu.permissions?.delete || false)
                                    );
                                    (el as any).indeterminate = someChecked && !allChecked;
                                  }
                                }}
                                onCheckedChange={(checked) => handleCheckAllEverything(checked === true)}
                              />
                            </TableCell>
                             <TableCell className="text-center">
                               <Checkbox
                                 checked={moduleSubmenus.every(submenu => submenu.permissions?.read || false)}
                                 ref={(el) => {
                                   if (el) {
                                     const someChecked = moduleSubmenus.some(submenu => submenu.permissions?.read || false);
                                     const allChecked = moduleSubmenus.every(submenu => submenu.permissions?.read || false);
                                     (el as any).indeterminate = someChecked && !allChecked;
                                   }
                                 }}
                                 onCheckedChange={(checked) => handleSelectAllRead(checked === true)}
                               />
                             </TableCell>
                             <TableCell className="text-center">
                               <Checkbox
                                 checked={moduleSubmenus.every(submenu => submenu.permissions?.create || false)}
                                 ref={(el) => {
                                   if (el) {
                                     const someChecked = moduleSubmenus.some(submenu => submenu.permissions?.create || false);
                                     const allChecked = moduleSubmenus.every(submenu => submenu.permissions?.create || false);
                                     (el as any).indeterminate = someChecked && !allChecked;
                                   }
                                 }}
                                 onCheckedChange={(checked) => handleSelectAll('create', checked === true)}
                               />
                             </TableCell>
                             <TableCell className="text-center">
                               <Checkbox
                                 checked={moduleSubmenus.every(submenu => submenu.permissions?.update || false)}
                                 ref={(el) => {
                                   if (el) {
                                     const someChecked = moduleSubmenus.some(submenu => submenu.permissions?.update || false);
                                     const allChecked = moduleSubmenus.every(submenu => submenu.permissions?.update || false);
                                     (el as any).indeterminate = someChecked && !allChecked;
                                   }
                                 }}
                                 onCheckedChange={(checked) => handleSelectAll('update', checked === true)}
                               />
                             </TableCell>
                             <TableCell className="text-center">
                               <Checkbox
                                 checked={moduleSubmenus.every(submenu => submenu.permissions?.delete || false)}
                                 ref={(el) => {
                                   if (el) {
                                     const someChecked = moduleSubmenus.some(submenu => submenu.permissions?.delete || false);
                                     const allChecked = moduleSubmenus.every(submenu => submenu.permissions?.delete || false);
                                     (el as any).indeterminate = someChecked && !allChecked;
                                   }
                                 }}
                                 onCheckedChange={(checked) => handleSelectAll('delete', checked === true)}
                               />
                             </TableCell>
                          </TableRow>
                          
                          {/* Separator */}
                          <TableRow>
                            <TableCell colSpan={6} className="p-0">
                              <div className="border-t border-border"></div>
                            </TableCell>
                          </TableRow>
                          
                          {moduleSubmenus.map((submenu, index) => (
                            <TableRow key={submenu.id || `submenu-${index}`}>
                              <TableCell className="font-medium">
                                <div>
                                  <div className="font-semibold">{submenu.menu_name}</div>
                                  <div className="text-sm text-muted-foreground">{submenu.module_path}</div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Checkbox
                                  id={`check-all-${submenu.id}`}
                                  checked={(submenu.permissions?.create || false) && (submenu.permissions?.read || false) && (submenu.permissions?.update || false) && (submenu.permissions?.delete || false)}
                                  ref={(el) => {
                                    if (el) {
                                      const someChecked = (submenu.permissions?.create || false) || (submenu.permissions?.read || false) || (submenu.permissions?.update || false) || (submenu.permissions?.delete || false);
                                      const allChecked = (submenu.permissions?.create || false) && (submenu.permissions?.read || false) && (submenu.permissions?.update || false) && (submenu.permissions?.delete || false);
                                      (el as any).indeterminate = someChecked && !allChecked;
                                    }
                                  }}
                                  onCheckedChange={(checked) => handleCheckAllForModule(submenu.id, checked === true)}
                                />
                              </TableCell>
                               <TableCell className="text-center">
                                 <Checkbox
                                   id={`read-${submenu.id}`}
                                   checked={submenu.permissions?.read || false}
                                   onCheckedChange={(checked) => handlePermissionUpdateRead(submenu.id, checked === true)}
                                 />
                               </TableCell>
                               <TableCell className="text-center">
                                 <Checkbox
                                   id={`create-${submenu.id}`}
                                   checked={submenu.permissions?.create || false}
                                   disabled={!(submenu.permissions?.read || false)}
                                   onCheckedChange={(checked) => handlePermissionUpdate(submenu.id, 'create', checked === true)}
                                 />
                               </TableCell>
                               <TableCell className="text-center">
                                 <Checkbox
                                   id={`update-${submenu.id}`}
                                   checked={submenu.permissions?.update || false}
                                   disabled={!(submenu.permissions?.read || false)}
                                   onCheckedChange={(checked) => handlePermissionUpdate(submenu.id, 'update', checked === true)}
                                 />
                               </TableCell>
                               <TableCell className="text-center">
                                 <Checkbox
                                   id={`delete-${submenu.id}`}
                                   checked={submenu.permissions?.delete || false}
                                   disabled={!(submenu.permissions?.read || false)}
                                   onCheckedChange={(checked) => handlePermissionUpdate(submenu.id, 'delete', checked === true)}
                                 />
                               </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {/* Save Button */}
                    <div className="flex justify-end mt-6">
                      <PermissionButton
                        module="roles"
                        action="update"
                        onClick={handleSavePermissions}
                        disabled={formLoading}
                        className="flex items-center gap-2"
                      >
                        {formLoading ? 'Saving...' : 'Save Permissions'}
                      </PermissionButton>
                    </div>
                  </div>
                )}

                {!permissionsLoading && selectedRoleId && moduleSubmenus.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <p>No module submenus found for this role.</p>
                  </div>
                )}

                {!permissionsLoading && !selectedRoleId && (
                  <EmptyStates.Generic
                    icon={Shield}
                    title="Select a role to manage permissions"
                    description="Choose a role from the list above to view and manage its permissions. This will show all module submenus with their available permissions."
                  />
                )}
                </div>
              </PermissionGuard>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <RoleFormModal
        isOpen={addModalOpen}
        mode="create"
        formData={formData}
        formErrors={formErrors}
        loading={formLoading}
        onClose={() => {
          setAddModalOpen(false);
          resetForm();
        }}
        onChange={(field, value) => handleInputChange(field, value)}
        onSubmit={handleCreate}
      />

      <RoleFormModal
        isOpen={editModalOpen}
        mode="edit"
        formData={formData}
        formErrors={formErrors}
        loading={formLoading}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedRole(null);
          resetForm();
        }}
        onChange={(field, value) => handleInputChange(field, value)}
        onSubmit={handleUpdate}
      />

      {/* Delete Role Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={(open) => {
        setDeleteModalOpen(open);
        if (!open) setSelectedRole(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedRole?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDeleteModalOpen(false);
              setSelectedRole(null);
            }}>
              Cancel
            </Button>
            <PermissionButton
              module="roles"
              action="delete"
              variant="destructive"
              onClick={handleDelete}
              disabled={formLoading}
            >
              {formLoading ? 'Deleting...' : 'Delete'}
            </PermissionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Permissions */}
      <ConfirmationDialog
        open={permissionsConfirmOpen}
        type="warning"
        title="Update Permissions"
        message="Are you sure you want to update the permissions for this role? This action cannot be undone."
        confirmText="Update"
        cancelText="Cancel"
        onConfirm={confirmSavePermissions}
        onCancel={() => setPermissionsConfirmOpen(false)}
      />
      <RoleUsersModal
        open={manageUsersModalOpen}
        selectedRole={selectedRole}
        loading={loadingUsersModal}
        roleUsers={roleUsers}
        allUsers={allUsers}
        roles={roles}
        selectedUserIdToAdd={selectedUserIdToAdd}
        formLoading={formLoading}
        onClose={() => {
          setManageUsersModalOpen(false);
          setSelectedRole(null);
          setRoleUsers([]);
          setAllUsers([]);
          setSelectedUserIdToAdd('');
        }}
        onChangeUserRole={handleChangeUserRole}
        onChangeSelectedUserId={setSelectedUserIdToAdd}
        onAssignUser={handleAssignUserToRole}
      />
    </div>
  );
}
