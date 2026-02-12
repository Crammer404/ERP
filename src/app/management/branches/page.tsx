'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Store, MoreVertical, Plus, Trash2, Edit, Users, Search, Loader2 } from 'lucide-react';
import { RefreshButton } from '@/components/ui/refresh-button';
import { branchService, Branch } from '@/services';
import { addressService } from '@/services/address/addressService';
import { useToast } from '@/hooks/use-toast';
import { PermissionGuard } from '@/components/guards';
import { useModulePermissions } from '@/contexts/PermissionContext';
import { FullPageAccessDenied } from '@/components/error/error-page';
import { Loader } from '@/components/ui/loader';
import { EmptyStates } from '@/components/ui/empty-state';
import { PaginationInfos } from '@/components/ui/pagination-info';
import { BranchFormModal } from './components/BranchFormModal';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import { tenantContextService } from '@/services/tenant/tenantContextService';
import { BranchEmployeesModal } from './components/branch-employees';
import { UserAvatarStack, UserData } from '@/components/ui/user-avatar-stack';

export default function BranchPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  
  const { canRead, canCreate, canUpdate, canDelete } = useModulePermissions('branches');

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

  const [branchCache, setBranchCache] = useState<Map<string, Branch[]>>(new Map());
  // Store employees for each branch
  const [branchEmployees, setBranchEmployees] = useState<Map<number, UserData[]>>(new Map());
  const [loadingEmployees, setLoadingEmployees] = useState<Set<number>>(new Set());

  const getCacheKey = (page: number, perPage: number, search: string) => {
    return `${page}-${perPage}-${search}`;
  };

  const [modalState, setModalState] = useState<{
    type: 'add' | 'edit' | 'delete' | null;
    isOpen: boolean;
    branch?: Branch | null;
    formData?: any;
  }>({ type: null, isOpen: false, branch: null, formData: null });

  const [viewEmployeesModalOpen, setViewEmployeesModalOpen] = useState(false);
  const [activeBranchId, setActiveBranchId] = useState<number | null>(null);
  const [activeBranchName, setActiveBranchName] = useState<string>('');
  const [activeTenantId, setActiveTenantId] = useState<number | null>(null);

  const [formLoading, setFormLoading] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact_no: '',
    address: addressService.getDefaultAddress()
  });

  const totalPages = pagination.last_page;

  // Fetch employees for a specific branch
  const fetchBranchEmployees = async (branchId: number, forceRefresh: boolean = false) => {
    // Skip if already loading (unless forcing refresh)
    if (loadingEmployees.has(branchId) && !forceRefresh) {
      console.log(`⏭️ Skipping fetch for branch ${branchId} - already loading`);
      return;
    }
    
    // Skip if already fetched (unless forcing refresh)
    if (branchEmployees.has(branchId) && !forceRefresh) {
      console.log(`⏭️ Skipping fetch for branch ${branchId} - already cached`);
      return;
    }

    console.log(`🔄 Fetching employees for branch ${branchId}${forceRefresh ? ' (force refresh)' : ''}`);
    setLoadingEmployees(prev => new Set(prev).add(branchId));
    try {
      const response = await branchService.getEmployees(branchId);
      console.log(`✅ Received employees for branch ${branchId}:`, response);
      if (response && response.users && Array.isArray(response.users)) {
        const employees: UserData[] = response.users.map((emp: any) => ({
          id: emp.user_id,
          name: emp.name || emp.email || 'Unknown',
          email: emp.email
        }));
        console.log(`📊 Mapped ${employees.length} employees for branch ${branchId}`);
        setBranchEmployees(prev => new Map(prev).set(branchId, employees));
      } else {
        console.log(`⚠️ No employees found for branch ${branchId}`);
        setBranchEmployees(prev => new Map(prev).set(branchId, []));
      }
    } catch (error) {
      console.error(`❌ Failed to fetch employees for branch ${branchId}:`, error);
      setBranchEmployees(prev => new Map(prev).set(branchId, []));
    } finally {
      setLoadingEmployees(prev => {
        const newSet = new Set(prev);
        newSet.delete(branchId);
        return newSet;
      });
    }
  };

  const fetchBranches = async (page: number = currentPage, perPage: number = itemsPerPage, search: string = searchTerm, forceRefresh: boolean = false) => {
    const cacheKey = getCacheKey(page, perPage, search);
    
    if (!forceRefresh && branchCache.has(cacheKey)) {
      const cachedData = branchCache.get(cacheKey)!;
      setBranches(cachedData);
      // Fetch employees for all branches in the cached data
      cachedData.forEach(branch => {
        if (!branchEmployees.has(branch.id)) {
          fetchBranchEmployees(branch.id);
        }
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await branchService.getAll(page, perPage, search);
      setBranches(response.branches);
      setPagination(response.pagination);
      
      setBranchCache(prev => new Map(prev).set(cacheKey, response.branches));
      
      // Fetch employees for all branches
      response.branches.forEach(branch => {
        if (!branchEmployees.has(branch.id)) {
          fetchBranchEmployees(branch.id);
        }
      });
    } catch (error) {
      console.error('Failed to fetch branches:', error);
      setBranches([]);
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
    fetchBranches(currentPage, itemsPerPage, searchTerm);
  }, [currentPage, itemsPerPage, searchTerm]);

  // Listen for tenant context changes and refresh branches
  useEffect(() => {
    const handleTenantChange = () => {
      // Clear cache when tenant changes
      setBranchCache(new Map());
      setBranchEmployees(new Map()); // Clear employees cache
      setLoadingEmployees(new Set()); // Clear loading states
      // Reset to first page and force refresh branches for the new tenant
      setCurrentPage(1);
      // Always force refresh to get branches for the new tenant
      fetchBranches(1, itemsPerPage, searchTerm, true);
    };

    // Listen for custom tenant change event from header
    window.addEventListener('tenantChanged', handleTenantChange);

    return () => {
      window.removeEventListener('tenantChanged', handleTenantChange);
    };
  }, [itemsPerPage, searchTerm]); // Note: fetchBranches is stable, so we don't need it in deps

  const openViewEmployeesModal = async (branch: Branch) => {
    console.log('🔵 Opening View Employees Modal for branch:', branch);
    
    // Set the selected branch for display purposes
    setSelectedBranch(branch);
    
    // Use the clicked branch ID (not the active branch from dropdown)
    const branchId = branch.id;
    
    // Always fetch full branch details to ensure we have tenant_id and latest name
    // BranchResource from list might not include tenant_id directly, and name might be outdated
    let tenantId: number | undefined;
    let branchName: string = branch.name; // Fallback to branch parameter name
    try {
      console.log('🔵 Fetching full branch details for branchId:', branchId);
      const fullBranch = await branchService.getById(branchId);
      tenantId = fullBranch.tenant_id;
      branchName = fullBranch.name; // Use the fetched branch name (most up-to-date)
      console.log('✅ Fetched branch details:', {
        branchId: fullBranch.id,
        branchName: fullBranch.name,
        tenantId: fullBranch.tenant_id
      });
    } catch (error) {
      console.error('❌ Failed to fetch branch details:', error);
      toast({
        title: "Error",
        description: "Failed to load branch information.",
        variant: "destructive"
      });
      return;
    }
    
    if (!tenantId) {
      console.error('❌ Could not determine tenant_id for branch:', branch);
      toast({
        title: "Error",
        description: "Could not determine tenant for this branch.",
        variant: "destructive"
      });
      return;
    }
    
    console.log('🔵 Setting modal state:', {
      branchId,
      branchName,
      tenantId
    });
    
    setActiveBranchId(branchId);
    setActiveBranchName(branchName);
    setActiveTenantId(tenantId);
    setViewEmployeesModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      contact_no: '',
      address: addressService.getDefaultAddress()
    });
    setErrors({});
  };

  const validateForm = (data = formData) => {
    const newErrors: Record<string, string> = {};

    if (!data.name.trim()) newErrors.name = "Branch name is required";
    if (!data.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(data.email)) newErrors.email = "Invalid email format";
    if (!data.contact_no.trim()) newErrors.contact_no = "Contact number is required";

    const addressErrors = addressService.validateAddress(data.address);
    // Prefix address errors with 'address.' to match form field names
    Object.keys(addressErrors).forEach(key => {
      newErrors[`address.${key}`] = addressErrors[key];
    });

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
      await branchService.create(data);
      closeModal();
      resetForm();
      forceRefresh();
      toast({ 
        title: "Branch Created", 
        description: "The branch has been successfully created.", 
        variant: "success" 
      });
    } catch (err: any) {
      handleApiError(err, "Failed to create branch");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (data: any) => {
    if (!modalState.branch) return;

    setFormLoading(true);
    setErrors({});

    const validationErrors = validateForm(data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setFormLoading(false);
      return;
    }

    try {
      const updatedBranch = await branchService.update(modalState.branch.id, data);
      
      // If employees modal is open for this branch, update the branch name
      if (viewEmployeesModalOpen && activeBranchId === modalState.branch.id) {
        setActiveBranchName(updatedBranch.name);
      }
      
      // Update branch context in localStorage if this is the currently selected branch
      const currentBranchContext = tenantContextService.getStoredBranchContext();
      if (currentBranchContext && currentBranchContext.id === modalState.branch.id) {
        tenantContextService.storeBranchContext({
          id: updatedBranch.id,
          name: updatedBranch.name,
          email: updatedBranch.email,
          contact_no: updatedBranch.contact_no,
        });
        // Dispatch event to notify other components about branch update
        window.dispatchEvent(new CustomEvent('branchChanged', {
          detail: { branchId: updatedBranch.id, branch: updatedBranch }
        }));
      }
      
      // Update the branch in the local branches array immediately
      setBranches(prevBranches => 
        prevBranches.map(branch => 
          branch.id === modalState.branch!.id ? updatedBranch : branch
        )
      );
      
      closeModal();
      resetForm();
      forceRefresh();
      toast({ 
        title: "Branch Updated", 
        description: "The branch details were successfully updated.", 
        variant: "success" 
      });
    } catch (err: any) {
      handleApiError(err, "Failed to update branch");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!modalState.branch) return;
    
    setFormLoading(true);
    setErrors({});

    try {
      await branchService.delete(modalState.branch.id);
      closeModal();
      forceRefresh();
      toast({ 
        title: "Branch Deleted", 
        description: "The branch was successfully deleted.", 
        variant: "success" 
      });
    } catch (err: any) {
      console.error('Delete error:', err);
      
      if (err.response?.status === 404) {
        setErrors({ general: "Branch not found. It may have already been deleted." });
        toast({ 
          title: "Branch Not Found", 
          description: "This branch may have already been deleted.", 
          variant: "destructive" 
        });
        forceRefresh();
      } else if (err.response?.status === 500 && err.response?.data?.error?.includes("No query results")) {
        setErrors({ general: "Branch not found in database." });
        toast({ 
          title: "Branch Not Found", 
          description: "This branch no longer exists.", 
          variant: "destructive" 
        });
        forceRefresh();
      } else {
        handleApiError(err, "Failed to delete branch");
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
    setBranches([]);
    setBranchCache(new Map());
    
    try {
      const response = await branchService.getAll(currentPage, itemsPerPage, searchTerm);
      setBranches(response.branches);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to force refresh branches:', error);
      setBranches([]);
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

  const openModal = async (type: 'add' | 'edit' | 'delete', branch?: Branch) => {
    setErrors({});

    if (type === 'add') {
      resetForm();
      setModalState({ type: 'add', isOpen: true, branch: null, formData: null });
    } else if (type === 'delete' && branch) {
      setModalState({ type: 'delete', isOpen: true, branch, formData: null });
    } else if (type === 'edit' && branch) {
      setFormLoading(true);
      try {
        const fullBranch = await branchService.getById(branch.id);
        
        const branchFormData = {
          name: fullBranch.name || '',
          email: fullBranch.email || '',
          contact_no: fullBranch.contact_no || '',
          address: addressService.createAddressFormData(fullBranch.address)
        };
        
        setFormData(branchFormData);
        setModalState({ type: 'edit', isOpen: true, branch, formData: branchFormData });
      } catch (error) {
        console.error('Failed to fetch branch details:', error);
        setErrors({ general: 'Failed to load branch details' });
      } finally {
        setFormLoading(false);
      }
    }
  };

  const closeModal = () => {
    setModalState({ type: null, isOpen: false, branch: null, formData: null });
  };

  const handleApiError = (err: any, defaultMessage: string = "An error occurred") => {
    if (err.response?.data?.errors) {
      const apiErrors: Record<string, string> = {};
      for (const key in err.response.data.errors) {
        const errorMessage = err.response.data.errors[key][0];
        
        if (key === 'name') {
          apiErrors.name = "Branch name already exists";
        } else if (key === 'email') {
          apiErrors.email = "Email already exists";
        } else if (key === 'contact_no') {
          apiErrors.contact_no = "Contact number already exists";
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
            apiErrors.name = "Branch name already exists";
          } else if (key === 'email') {
            apiErrors.email = "Email already exists";
          } else if (key === 'contact_no') {
            apiErrors.contact_no = "Contact number already exists";
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
        setErrors({ name: "Branch name already exists" });
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
    return <FullPageAccessDenied moduleName="branches" />;
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Store className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-2xl font-bold font-heading">Company Branches</h1>
            <p className="text-sm text-muted-foreground">Manage and oversee company branches.</p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            {/* Search Bar - Full width on mobile, flex-1 on desktop */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search branches..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            
            {/* Buttons - Full width on mobile, auto width on desktop */}
            <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
              <RefreshButton
                onClick={forceRefresh}
                loading={loading}
                variant="green"
                className="flex-1 sm:flex-none"
              />

              <PermissionGuard module="branches" action="create">
                <Button onClick={() => openModal('add')} className="flex items-center gap-2 flex-1 sm:flex-none" >
                  <Plus className="h-4 w-4" />
                  Add Branch
                </Button>
              </PermissionGuard>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader />
            </div>
          ) : branches.length === 0 ? (
            <EmptyStates.Branches />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Employees</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((branch) => {
                    const employees = branchEmployees.get(branch.id) || [];
                    const isLoading = loadingEmployees.has(branch.id);
                    
                    return (
                      <TableRow key={branch.id}>
                        <TableCell className="font-medium">{branch.name}</TableCell>
                        <TableCell>
                          <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                            {branch.branch_code || "—"}
                          </span>
                        </TableCell>
                        <TableCell>{branch.email || "—"}</TableCell>
                        <TableCell>{branch.contact_no || "—"}</TableCell>
                        <TableCell>
                          {branch.address ? (
                            <div className="text-sm leading-tight">
                              <div>{branch.address.street}</div>
                              <div>{branch.address.city}, {branch.address.province}</div>
                              <div>{branch.address.region} {branch.address.postal_code}</div>
                              <div>{branch.address.country}</div>
                            </div>
                          ) : "N/A"}
                        </TableCell>
                        <TableCell>
                          {isLoading ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Loading...</span>
                            </div>
                          ) : (
                            <UserAvatarStack 
                              users={employees}
                              maxVisible={4}
                              size="sm"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="center">
                            <PermissionGuard module="branches" action="update">
                              <DropdownMenuItem onClick={() => openModal('edit', branch)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            </PermissionGuard>
                            <PermissionGuard module="branches" action="read">
                              <DropdownMenuItem onClick={() => openViewEmployeesModal(branch)}>
                                <Users className="h-4 w-4 mr-2" />
                                View Employees
                              </DropdownMenuItem>
                            </PermissionGuard>
                            <PermissionGuard module="branches" action="delete">
                              <DropdownMenuItem
                                onClick={() => openModal('delete', branch)}
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
                    );
                  })}
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

      {/* Modal Add Branch */}
      {modalState.type === 'add' && (
        <PermissionGuard module="branches" action="create">
          <BranchFormModal
            isOpen={modalState.isOpen}
            onClose={closeModal}
            mode="create"
            onSubmit={handleCreate}
            loading={formLoading}
            errors={errors}
            onClearError={clearError}
          />
        </PermissionGuard>
      )}

      {/* Modal Edit Branch */}
      {modalState.type === 'edit' && (
        <PermissionGuard module="branches" action="update">
          <BranchFormModal
            isOpen={modalState.isOpen}
            onClose={closeModal}
            mode="edit"
            initialData={modalState.formData}
            onSubmit={handleUpdate}
            loading={formLoading}
            errors={errors}
            onClearError={clearError}
          />
        </PermissionGuard>
      )}

      {/* Modal Delete Branch */}
      {modalState.type === 'delete' && (
        <PermissionGuard module="branches" action="delete">
          <DeleteConfirmModal
            isOpen={modalState.isOpen}
            onClose={closeModal}
            onConfirm={handleDelete}
            loading={formLoading}
            title="Delete Branch"
            itemName={modalState.branch?.name}
            errors={errors}
          />
        </PermissionGuard>
      )}

      <PermissionGuard module="branches" action="read">
        {activeBranchId !== null && activeTenantId !== null && (
          <BranchEmployeesModal
            isOpen={viewEmployeesModalOpen}
            onClose={() => {
              setViewEmployeesModalOpen(false);
              setActiveBranchId(null);
              setActiveTenantId(null);
              setActiveBranchName('');
            }}
            branchId={activeBranchId}
            branchName={activeBranchName}
            tenantId={activeTenantId}
            onEmployeeTransferred={async (sourceBranchId, destinationBranchId) => {
              // Refresh employees for both source and destination branches
              console.log('🔄 Refreshing employees for branches:', { sourceBranchId, destinationBranchId });
              
              // Clear cache for both branches first
              setBranchEmployees(prev => {
                const newMap = new Map(prev);
                newMap.delete(sourceBranchId); // Remove to force refresh
                newMap.delete(destinationBranchId); // Remove to force refresh
                return newMap;
              });
              
              // Add a small delay to ensure backend has processed the transfer
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Refresh source branch (employee was removed) - force refresh
              await fetchBranchEmployees(sourceBranchId, true);
              
              // Refresh destination branch (employee was added) - force refresh
              await fetchBranchEmployees(destinationBranchId, true);
              
              console.log('✅ Employees refreshed for both branches');
            }}
          />
        )}
      </PermissionGuard>
    </div>
  );
}