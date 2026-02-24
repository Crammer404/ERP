'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Briefcase, MoreVertical, Plus, Trash2, Edit, Search, RefreshCw, Loader2 } from 'lucide-react';
import { positionService, type PayrollPosition, type CreatePositionRequest, type UpdatePositionRequest } from './services/position-service';
import { useToast } from "@/hooks/use-toast";
import { Loader } from '@/components/ui/loader';
import { EmptyStates } from '@/components/ui/empty-state';
import { PaginationInfos } from '@/components/ui/pagination-info';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import { PositionFormModal } from './components/PositionFormModal';
import { managementService } from '@/services/management/managementService';
import { userService } from '@/services';
import { configService } from '../config/services/config-service';

interface PaginationResponse {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
  has_more_pages: boolean;
}

const getUserDisplayName = (user: PayrollPosition['user']): string => {
  if (!user) return 'N/A';
  if (user.user_info?.first_name || user.user_info?.last_name) {
    return [user.user_info.first_name, user.user_info.last_name].filter(Boolean).join(' ');
  }
  return user.email;
};

export default function PositionsPage() {
  const [positions, setPositions] = useState<PayrollPosition[]>([]);
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);
  const [users, setUsers] = useState<{ id: number; email: string; user_info?: { first_name?: string; last_name?: string } }[]>([]);
  const [allowances, setAllowances] = useState<{ id: number; label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationResponse>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: null,
    to: null,
    has_more_pages: false,
  });

  const [positionCache, setPositionCache] = useState<Map<string, { positions: PayrollPosition[], pagination: PaginationResponse }>>(new Map());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [modalState, setModalState] = useState<{
    type: 'add' | 'edit' | 'delete' | null;
    isOpen: boolean;
    position?: PayrollPosition | null;
  }>({ type: null, isOpen: false, position: null });
  
  const [formLoading, setFormLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { toast } = useToast();

  const showToast = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string
  ) => {
    toast({
      title,
      description: message,
      variant:
        type === "error" ? "destructive" : type === "success" ? "success" : "default",
    });
  };

  const handleApiError = (err: any, defaultMessage: string = "An error occurred") => {
    if (err.response?.data?.errors) {
      const apiErrors: Record<string, string> = {};
      for (const key in err.response.data.errors) {
        apiErrors[key] = err.response.data.errors[key][0];
      }
      setErrors(apiErrors);
    } else {
      const message = err.response?.data?.message || defaultMessage;
      setErrors({ general: message });
    }
  };

  const clearError = (field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const getCacheKey = (page: number, perPage: number, search: string) => {
    return `${page}-${perPage}-${search}`;
  };

  const clearCache = () => {
    setPositionCache(new Map());
  };

  const fetchPositions = async (page: number = currentPage, perPage: number = itemsPerPage, search: string = searchTerm, forceRefresh: boolean = false) => {
    const cacheKey = getCacheKey(page, perPage, search);
    
    if (!forceRefresh && positionCache.has(cacheKey)) {
      const cachedData = positionCache.get(cacheKey)!;
      setPositions(cachedData.positions);
      setPagination(cachedData.pagination);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const allPositions = await positionService.getAll();
      
      const filtered = search.trim()
        ? allPositions.filter(p => {
            const searchLower = search.toLowerCase();
            return (
              p.code.toLowerCase().includes(searchLower) ||
              p.name.toLowerCase().includes(searchLower) ||
              p.branch?.name.toLowerCase().includes(searchLower) ||
              getUserDisplayName(p.user).toLowerCase().includes(searchLower)
            );
          })
        : allPositions;

      const total = filtered.length;
      const from = (page - 1) * perPage + 1;
      const to = Math.min(page * perPage, total);
      const paginatedPositions = filtered.slice((page - 1) * perPage, page * perPage);
      const lastPage = Math.ceil(total / perPage);

      const paginationData: PaginationResponse = {
        current_page: page,
        last_page: lastPage,
        per_page: perPage,
        total,
        from: total > 0 ? from : null,
        to: total > 0 ? to : null,
        has_more_pages: page < lastPage,
      };

      setPositions(paginatedPositions);
      setPagination(paginationData);
      
      setPositionCache(prev => new Map(prev).set(cacheKey, {
        positions: paginatedPositions,
        pagination: paginationData
      }));
    } catch (error) {
      console.error('Failed to fetch positions:', error);
      setPositions([]);
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

  const fetchSupportingData = async () => {
    try {
      const [branchesData, usersResponse, configData] = await Promise.all([
        managementService.fetchUserBranches(),
        userService.getAll(1, 10000, ''),
        configService.getComputationData(),
      ]);
      setBranches(branchesData.map(b => ({ id: b.id, name: b.name })));
      setUsers(usersResponse.users || []);
      const earnings = configData.components.filter(c => c.group === 'earnings');
      setAllowances(earnings.map(c => ({ id: c.id!, label: c.label, value: String(c.value) })));
    } catch (error) {
      console.error('Failed to fetch supporting data:', error);
    }
  };

  useEffect(() => {
    fetchSupportingData();
    fetchPositions(currentPage, itemsPerPage, searchTerm);
  }, [currentPage, itemsPerPage, searchTerm]);

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

  const handleRefresh = () => {
    clearCache();
    setPositions([]);
    setTimeout(() => {
      fetchPositions(currentPage, itemsPerPage, searchTerm, true);
    }, 100);
  };

  const forceRefresh = async () => {
    setLoading(true);
    setPositions([]);
    setPositionCache(new Map());
    
    try {
      await fetchPositions(currentPage, itemsPerPage, searchTerm, true);
    } catch (error) {
      console.error('Force refresh failed:', error);
      setPositions([]);
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

  const resetForm = () => {
    setErrors({});
  };

  const openModal = (type: 'add' | 'edit' | 'delete', position?: PayrollPosition) => {
    setErrors({});

    if (type === 'add') {
      resetForm();
      setModalState({ type: 'add', isOpen: true, position: null });
    } else if (type === 'delete' && position) {
      setModalState({ type: 'delete', isOpen: true, position });
    } else if (type === 'edit' && position) {
      setModalState({ type: 'edit', isOpen: true, position });
    }
  };

  const closeModal = () => {
    setModalState({ type: null, isOpen: false, position: null });
  };

  const handleCreate = async (data: CreatePositionRequest | UpdatePositionRequest) => {
    setFormLoading(true);
    setErrors({});

    try {
      await positionService.create(data as CreatePositionRequest);
      closeModal();
      resetForm();
      forceRefresh();
      showToast("success", "Position Created", "The position has been successfully created.");
    } catch (err: any) {
      console.error('Failed to create position:', err);
      handleApiError(err, "Failed to create position");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (data: CreatePositionRequest | UpdatePositionRequest) => {
    if (!modalState.position) return;

    setFormLoading(true);
    setErrors({});

    try {
      await positionService.update(modalState.position.id, data as UpdatePositionRequest);
      closeModal();
      resetForm();
      forceRefresh();
      showToast("success", "Position Updated", "The position details were successfully updated.");
    } catch (err: any) {
      handleApiError(err, "Failed to update position");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!modalState.position) return;
    
    setFormLoading(true);
    setErrors({});

    try {
      await positionService.delete(modalState.position.id);
      closeModal();
      forceRefresh();
      showToast("success", "Position Deleted", "The position was successfully deleted.");
    } catch (err: any) {
      console.error('Delete error:', err);
      
      if (err.response?.status === 404) {
        setErrors({ general: "Position not found. It may have already been deleted." });
        showToast("warning", "Position Not Found", "This position may have already been deleted.");
        forceRefresh();
      } else {
        handleApiError(err, "Failed to delete position");
      }
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Briefcase className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-headline">Payroll Positions</h1>
          <p className="text-sm text-muted-foreground">View, add, edit, and manage employee positions and salaries.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search positions..."
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
              
              <Button onClick={() => openModal('add')} className="flex items-center gap-2 flex-1 sm:flex-none">
                <Plus className="h-4 w-4" />
                Add Position
              </Button>
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader size="md" />
            </div>
          ) : positions.length === 0 ? (
            <EmptyStates.Generic
              icon={Briefcase}
              title="No positions found"
              description="There are no positions in the system yet. Create your first position to get started."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Base Salary</TableHead>
                    <TableHead>Allowance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map(position => (
                    <TableRow key={position.id} className="hover:bg-transparent">
                      <TableCell className="font-mono">{position.code}</TableCell>
                      <TableCell>{position.name}</TableCell>
                      <TableCell>{position.branch?.name || '—'}</TableCell>
                      <TableCell>{getUserDisplayName(position.user)}</TableCell>
                      <TableCell>₱{position.base_salary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell>{position.allowance?.label || '—'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${position.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {position.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="center">
                            <DropdownMenuItem onClick={() => openModal('edit', position)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openModal('delete', position)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-between items-center mt-6">
                <PaginationInfos.Standard
                  from={pagination.from}
                  to={pagination.to}
                  total={pagination.total}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />

                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>

                    {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
                      .filter(page =>
                        page === 1 || page === pagination.last_page || (page >= currentPage - 1 && page <= currentPage + 1)
                      )
                      .map((page, idx, arr) => {
                        const prev = arr[idx - 1];
                        const showEllipsis = prev && page - prev > 1;
                        return (
                          <div key={page} className="flex items-center">
                            {showEllipsis && (
                              <PaginationItem>
                                <PaginationEllipsis />
                              </PaginationItem>
                            )}
                            <PaginationItem>
                              <PaginationLink
                                onClick={() => handlePageChange(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          </div>
                        );
                      })}

                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(Math.min(currentPage + 1, pagination.last_page))}
                        className={currentPage === pagination.last_page ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {modalState.type === 'add' && (
        <PositionFormModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          mode="create"
          branches={branches}
          users={users}
          allowances={allowances}
          onSubmit={handleCreate}
          loading={formLoading}
          errors={errors}
          onClearError={clearError}
        />
      )}

      {modalState.type === 'edit' && modalState.position && (
        <PositionFormModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          mode="edit"
          branches={branches}
          users={users}
          allowances={allowances}
          initialData={modalState.position}
          onSubmit={handleUpdate}
          loading={formLoading}
          errors={errors}
          onClearError={clearError}
        />
      )}

      {modalState.type === 'delete' && (
        <DeleteConfirmModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          onConfirm={handleDelete}
          loading={formLoading}
          title="Delete Position"
          itemName={modalState.position?.name || 'this position'}
          errors={errors}
        />
      )}
    </div>
  );
}
