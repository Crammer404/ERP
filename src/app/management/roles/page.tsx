'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PersonStanding, MoreVertical, Plus, Trash2, Edit, Search, RefreshCw, Shield } from 'lucide-react';
import { roleService, Role, CreateRoleRequest, UpdateRoleRequest, moduleSubmenuService, ModuleSubmenuWithPermissions } from '@/services';
import { PermissionGuard, PermissionButton } from '@/components/guards';
import { useModulePermissions } from '@/contexts/PermissionContext';
import { Loader } from '@/components/ui/loader';
import { EmptyStates } from '@/components/ui/empty-state';
import { useToast } from '@/hooks/use-toast';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import { FullPageAccessDenied } from '@/components/error/error-page';
import { PaginationInfos } from '@/components/ui/pagination-info';

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('role-list');
  const [searchTerm, setSearchTerm] = useState('');

  // Get permissions for roles module
  const { canRead, canCreate, canUpdate, canDelete } = useModulePermissions('roles');
  
  // Toast for notifications
  const { toast } = useToast();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Filtered roles based on search
  const filteredRoles = roles.filter(role => 
    role.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage: string) => {
    const perPage = parseInt(newItemsPerPage);
    setItemsPerPage(perPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Selected role for edit/delete operations
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // Loading state
  const [formLoading, setFormLoading] = useState(false);
  
  // Form validation errors
  const [formErrors, setFormErrors] = useState({
    name: '',
    description: ''
  });
  
  // Confirmation dialog states
  const [permissionsConfirmOpen, setPermissionsConfirmOpen] = useState(false);

  // Permissions tab state
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [moduleSubmenus, setModuleSubmenus] = useState<ModuleSubmenuWithPermissions[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);

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

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Reset form data
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

  // Check if form is valid
  const isFormValid = () => {
    return formData.name.trim() !== '' && formData.description.trim() !== '';
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Open edit modal with role data
  const openEditModal = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name || '',
      description: role.description || ''
    });
    setEditModalOpen(true);
  };

  // Open delete modal
  const openDeleteModal = (role: Role) => {
    setSelectedRole(role);
    setDeleteModalOpen(true);
  };

  // Handle create role
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setFormErrors({ name: '', description: '' });
    
    // Validate required fields
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
    
    // Check for duplicate role name
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
        permissions: [], // Empty permissions array for now
      };
      await roleService.create(payload);
      
      // Success toast
      toast({
        title: "Success",
        description: "Role created successfully!",
        variant: "success",
      });
      
      setAddModalOpen(false);
      resetForm();
      fetchRoles();
    } catch (err: any) {
      // Error toast
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

    // Clear previous errors
    setFormErrors({ name: '', description: '' });
    
    // Validate required fields
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
    
    // Check for duplicate role name (excluding current role)
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
        permissions: [], // Empty permissions array for now
      };
      await roleService.update(selectedRole.id, payload);
      
      // Success toast
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
      // Error toast
      toast({
        title: "Error",
        description: err.response?.data?.message || 'Failed to update role.',
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete role
  const handleDelete = async () => {
    if (!selectedRole) return;

    setFormLoading(true);

    try {
      await roleService.delete(selectedRole.id);
      
      // Success toast
      toast({
        title: "Success",
        description: "Role deleted successfully!",
        variant: "success",
      });
      
      setDeleteModalOpen(false);
      setSelectedRole(null);
      fetchRoles();
    } catch (err: any) {
      // Error toast
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
      // Error toast
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
            // If read is false, disable all other permissions
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
        // If read is false, disable all other permissions
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

  // Handle save all permissions
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
        .filter(submenu => submenu.id && submenu.id > 0) // Filter out invalid IDs
        .map(submenu => ({
          module_submenu_id: submenu.id,
          create: submenu.permissions?.create || false,
          read: submenu.permissions?.read || false,
          update: submenu.permissions?.update || false,
          delete: submenu.permissions?.delete || false,
        }));

      console.log('Sending permissions:', permissions);
      await moduleSubmenuService.updateRolePermissions(selectedRoleId, permissions);
      
      // Success toast
      toast({
        title: "Success",
        description: "Permissions saved successfully!",
        variant: "success",
      });
      
      window.location.reload();
    } catch (err: any) {
      // Error toast
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
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <PersonStanding className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-2xl font-bold font-headline">Roles</h1>
            <p className="text-sm text-muted-foreground">Manage and oversee employee roles and permissions.</p>
          </div>
        </div>
      </div>

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
                      <TableHead>Description</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                        {paginatedRoles.map((role, index) => (
                        <TableRow key={role.id || `role-${index}`}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell>{role.description}</TableCell>
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

      {/* Add Role Modal */}
      <Dialog open={addModalOpen} onOpenChange={(open) => {
        setAddModalOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Role</DialogTitle>
            <DialogDescription>
              Enter role details below. All fields are required.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g. Superman"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
              {formErrors.name && (
                <p className="text-sm text-red-500">{formErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                type="text"
                placeholder="e.g. A powerful role with special abilities"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
              {formErrors.description && (
                <p className="text-sm text-red-500">{formErrors.description}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setAddModalOpen(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <PermissionButton
                module="roles"
                action="create"
                type="submit"
                disabled={formLoading}
              >
                {formLoading ? 'Creating...' : 'Create Role'}
              </PermissionButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Role Modal */}
      <Dialog open={editModalOpen} onOpenChange={(open) => {
        setEditModalOpen(open);
        if (!open) {
          setSelectedRole(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update role details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Role Name</Label>
              <Input
                id="edit-name"
                type="text"
                placeholder="Superman"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
              {formErrors.name && (
                <p className="text-sm text-red-500">{formErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                type="text"
                placeholder="A powerful role with special abilities"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
              {formErrors.description && (
                <p className="text-sm text-red-500">{formErrors.description}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setEditModalOpen(false);
                setSelectedRole(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <PermissionButton
                module="roles"
                action="update"
                type="submit"
                disabled={formLoading || !isFormValid()}
              >
                {formLoading ? 'Updating...' : 'Update Role'}
              </PermissionButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}
