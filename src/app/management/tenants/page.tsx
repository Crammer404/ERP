'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Building, MoreVertical, Plus, Trash2, Edit, Building2, Search, RefreshCw } from 'lucide-react';
import { tenantService, Tenant } from '@/services';
import { addressService } from '@/services/address/addressService';
import { useToast } from '@/hooks/use-toast';
import { PermissionGuard } from '@/components/guards';
import { useModulePermissions } from '@/contexts/PermissionContext';
import { FullPageAccessDenied } from '@/components/error/error-page';
import { Loader } from '@/components/ui/loader';
import { EmptyStates } from '@/components/ui/empty-state';
import { PaginationInfos } from '@/components/ui/pagination-info';
import { TenantFormModal } from './components/TenantFormModal';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  
  const { canRead, canCreate, canUpdate, canDelete } = useModulePermissions('tenants');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: null as number | null,
    to: null as number | null,
    has_more_pages: false,
  });

  const [tenantCache, setTenantCache] = useState<Map<string, Tenant[]>>(new Map());

  const getCacheKey = (page: number, perPage: number, search: string) => {
    return `${page}-${perPage}-${search}`;
  };

  const [modalState, setModalState] = useState<{
    type: 'add' | 'edit' | 'delete' | null;
    isOpen: boolean;
    tenant?: Tenant | null;
    formData?: any;
  }>({ type: null, isOpen: false, tenant: null, formData: null });

  const [viewBranchesModalOpen, setViewBranchesModalOpen] = useState(false);

  const [formLoading, setFormLoading] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: addressService.getDefaultAddress()
  });

  const totalPages = pagination.last_page;

  const fetchTenants = async (page: number = currentPage, perPage: number = itemsPerPage, search: string = searchTerm, forceRefresh: boolean = false) => {
    const cacheKey = getCacheKey(page, perPage, search);
    
    if (!forceRefresh && tenantCache.has(cacheKey)) {
      const cachedData = tenantCache.get(cacheKey)!;
      setTenants(cachedData);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await tenantService.getLazyLoaded(page, perPage, search);
      setTenants(response.tenants);
      setPagination(response.pagination);
      setTenantCache(prev => new Map(prev).set(cacheKey, response.tenants));
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
      setTenants([]);
      setPagination({
        current_page: 1,
        last_page: 1,
        per_page: perPage,
        total: 0,
        from: null,
        to: null,
        has_more_pages: false,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants(currentPage, itemsPerPage, searchTerm);
  }, [currentPage, itemsPerPage, searchTerm]);

  const openViewBranchesModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setViewBranchesModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: addressService.getDefaultAddress()
    });
    setErrors({});
  };

  const validateForm = (data = formData) => {
    const newErrors: Record<string, string> = {};

    if (!data.name.trim()) newErrors.name = "Tenant name is required";
    if (!data.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(data.email)) newErrors.email = "Invalid email format";
    if (!data.phone.trim()) newErrors.phone = "Phone number is required";

    const addressErrors = addressService.validateAddress(data.address);
    Object.assign(newErrors, addressErrors);

    return newErrors;
  };

  const handleCreate = async (data: any) => {
    setFormLoading(true);
    setErrors({});

    const validationErrors = validateForm(data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setFormLoading(false);
      return;
    }

    try {
      await tenantService.create(data);
      closeModal();
      resetForm();
      forceRefresh();
      toast({
        title: "Tenant Created",
        description: "The tenant has been successfully created.", 
        variant: "success" 
      });
    } catch (err: any) {
      handleApiError(err, "Failed to create tenant");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (data: any) => {
    if (!modalState.tenant) return;

    setFormLoading(true);
    setErrors({});

    const validationErrors = validateForm(data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setFormLoading(false);
      return;
    }

    try {
      await tenantService.update(modalState.tenant.id, data);
      closeModal();
      resetForm();
      forceRefresh();
      toast({
        title: "Tenant Updated",
        description: "The tenant details were successfully updated.", 
        variant: "success" 
      });
    } catch (err: any) {
      handleApiError(err, "Failed to update tenant");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!modalState.tenant) return;

    setFormLoading(true);
    setErrors({});

    try {
      await tenantService.delete(modalState.tenant.id);
      closeModal();
      forceRefresh();
      toast({
        title: "Tenant Deleted",
        description: "The tenant was successfully deleted.", 
        variant: "success" 
      });
    } catch (err: any) {
      console.error('Delete error:', err);
      
      if (err.response?.status === 404) {
        setErrors({ general: "Tenant not found. It may have already been deleted." });
        toast({ 
          title: "Tenant Not Found", 
          description: "This tenant may have already been deleted.", 
          variant: "destructive" 
        });
        forceRefresh();
      } else if (err.response?.status === 500 && err.response?.data?.error?.includes("No query results")) {
        setErrors({ general: "Tenant not found in database." });
        toast({ 
          title: "Tenant Not Found", 
          description: "This tenant no longer exists.", 
          variant: "destructive" 
        });
        forceRefresh();
      } else {
        handleApiError(err, "Failed to delete tenant");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: string) => {
    const perPage = parseInt(newItemsPerPage);
    setItemsPerPage(perPage);
    setCurrentPage(1);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const forceRefresh = async () => {
    setLoading(true);
    setTenants([]);
    setTenantCache(new Map());
    tenantService.clearCache();
    
    try {
      const response = await tenantService.getLazyLoaded(currentPage, itemsPerPage, searchTerm);
      setTenants(response.tenants);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to force refresh tenants:', error);
      setTenants([]);
      setPagination({
        current_page: 1,
        last_page: 1,
        per_page: itemsPerPage,
        total: 0,
        from: null,
        to: null,
        has_more_pages: false,
      });
    } finally {
      setLoading(false);
    }
  };


  const openModal = async (type: 'add' | 'edit' | 'delete', tenant?: Tenant) => {
    setErrors({});

    if (type === 'add') {
      resetForm();
      setModalState({ type: 'add', isOpen: true, tenant: null, formData: null });
    } else if (type === 'delete' && tenant) {
      setModalState({ type: 'delete', isOpen: true, tenant, formData: null });
    } else if (type === 'edit' && tenant) {
      setFormLoading(true);
      try {
        const fullTenant = await tenantService.getById(tenant.id);
        
        const tenantFormData = {
          name: fullTenant.name || '',
          email: fullTenant.email || '',
          phone: fullTenant.phone || '',
          address: addressService.createAddressFormData(fullTenant.address)
        };
        
        setFormData(tenantFormData);
        setModalState({ type: 'edit', isOpen: true, tenant, formData: tenantFormData });
      } catch (error) {
        console.error('Failed to fetch tenant details:', error);
        setErrors({ general: 'Failed to load tenant details' });
      } finally {
        setFormLoading(false);
      }
    }
  };

  const closeModal = () => {
    setModalState({ type: null, isOpen: false, tenant: null, formData: null });
  };

  const handleApiError = (err: any, defaultMessage: string = "An error occurred") => {
    if (err.response?.data?.errors) {
      const apiErrors: Record<string, string> = {};
      for (const key in err.response.data.errors) {
        const errorMessage = err.response.data.errors[key][0];
        
        if (key === 'name') {
          apiErrors.name = "Tenant name already exists";
        } else if (key === 'email') {
          apiErrors.email = "Email already exists";
        } else if (key === 'phone') {
          apiErrors.phone = "Phone number already exists";
        } else {
          apiErrors[key] = errorMessage;
        }
      }
      setErrors(apiErrors);
    } else {
      const errorMessage = err.message || err.toString();
      
      if (errorMessage.includes('{') && errorMessage.includes('}')) {
        try {
          const jsonMatch = errorMessage.match(/\{.*\}/);
          if (jsonMatch) {
            const errorData = JSON.parse(jsonMatch[0]);
            
            if (errorData.errors) {
        const apiErrors: Record<string, string> = {};
        for (const key in errorData.errors) {
                const message = errorData.errors[key][0];
          
          if (key === 'name') {
            apiErrors.name = "Tenant name already exists";
          } else if (key === 'email') {
            apiErrors.email = "Email already exists";
          } else if (key === 'phone') {
            apiErrors.phone = "Phone number already exists";
          } else {
                  apiErrors[key] = message;
                }
              }
              setErrors(apiErrors);
              return;
            }
          }
        } catch (parseErr) {
        }
      }
      
      if (errorMessage.includes('name has already been taken') || errorMessage.includes('name already exists')) {
        setErrors({ name: "Tenant name already exists" });
      } else {
        setErrors({ general: errorMessage });
      }
    }
  };

  const clearError = (field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  if (!canRead) {
    return <FullPageAccessDenied moduleName="tenants" />;
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Building className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-2xl font-bold font-heading">Company Tenants</h1>
            <p className="text-sm text-muted-foreground">Manage and oversee company tenants.</p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tenants..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
              <Button
                onClick={forceRefresh}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              <PermissionGuard module="tenants" action="create">
                <Button onClick={() => openModal('add')} className="flex items-center gap-2 flex-1 sm:flex-none" >
                    <Plus className="h-4 w-4" />
                    Add Tenant
                </Button>
              </PermissionGuard>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader />
            </div>
          ) : tenants.length === 0 ? (
            <EmptyStates.Tenants/>
          ) : (
            <>
              <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {tenants.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell className="font-medium">{tenant.name}</TableCell>
                        <TableCell>{tenant.email || "—"}</TableCell>
                        <TableCell>{tenant.phone || "—"}</TableCell>
                        <TableCell>
                          {tenant.address ? (
                            <div className="text-sm leading-tight">
                              <div>{tenant.address.street}</div>
                              <div>{tenant.address.city}, {tenant.address.province}</div>
                              <div>{tenant.address.region} {tenant.address.postal_code}</div>
                              <div>{tenant.address.country}</div>
                            </div>
                          ) : "N/A"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center">
                              <PermissionGuard module="tenants" action="update">
                              <DropdownMenuItem onClick={() => openModal('edit', tenant)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              </PermissionGuard>
                              <PermissionGuard module="tenants" action="read">
                              <DropdownMenuItem onClick={() => openViewBranchesModal(tenant)}>
                                  <Building2 className="h-4 w-4 mr-2" />
                                View Branches
                                </DropdownMenuItem>
                              </PermissionGuard>
                              <PermissionGuard module="tenants" action="delete">
                                <DropdownMenuItem
                                onClick={() => openModal('delete', tenant)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </PermissionGuard>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6">
                <PaginationInfos.Standard
                  from={pagination.from || 0}
                  to={pagination.to || 0}
                  total={pagination.total}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
                
                {totalPages > 1 && (
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                          >
                            {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal Add Tenant */}
      <PermissionGuard module="tenants" action="create">
          <TenantFormModal
            isOpen={modalState.type === 'add' && modalState.isOpen}
            onClose={closeModal}
            mode="create"
            onSubmit={handleCreate}
            loading={formLoading}
            errors={errors}
            onClearError={clearError}
          />
      </PermissionGuard>

      {/* Modal Edit Tenant */}
      <PermissionGuard module="tenants" action="update">
          <TenantFormModal
            isOpen={modalState.type === 'edit' && modalState.isOpen}
            onClose={closeModal}
            mode="edit"
            initialData={modalState.formData}
            onSubmit={handleUpdate}
            loading={formLoading}
            errors={errors}
            onClearError={clearError}
          />
      </PermissionGuard>

      {/* Modal Delete Tenant */}
      {modalState.type === 'delete' && (
      <PermissionGuard module="tenants" action="delete">
          <DeleteConfirmModal
            isOpen={modalState.isOpen}
            onClose={closeModal}
            onConfirm={handleDelete}
            loading={formLoading}
            title="Delete Tenant"
            itemName={modalState.tenant?.name}
            errors={errors}
          />
      </PermissionGuard>
      )}

      <PermissionGuard module="tenants" action="read">
        <Dialog open={viewBranchesModalOpen} onOpenChange={setViewBranchesModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tenant Branches</DialogTitle>
            <DialogDescription>
              Branches for "{selectedTenant?.name}" tenant.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">This feature will be implemented soon.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewBranchesModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>
      </PermissionGuard>
    </div>
  );
}
