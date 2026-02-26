'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { DollarSign, MoreVertical, Plus, Trash2, Edit, Search, RefreshCw, CirclePlus } from 'lucide-react';
import { cashAdvanceService, type CashAdvance, type CreateCashAdvanceRequest, type UpdateCashAdvanceRequest } from './services/cash-advance-service';
import { useToast } from "@/hooks/use-toast";
import { Loader } from '@/components/ui/loader';
import { EmptyStates } from '@/components/ui/empty-state';
import { PaginationInfos } from '@/components/ui/pagination-info';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import { CashAdvanceFormModal } from './components/cash-advance-form-modal';
import { userService } from '@/services';

interface PaginationResponse {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
  has_more_pages: boolean;
}

const getEmployeeName = (cashAdvance: CashAdvance): string => {
  if (cashAdvance.user_info) {
    const { first_name, last_name } = cashAdvance.user_info;
    if (first_name || last_name) {
      return [first_name, last_name].filter(Boolean).join(' ');
    }
  }
  return cashAdvance.user_info?.user?.email || 'Unknown';
};

const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case 'active':
      return 'bg-yellow-100 text-yellow-800';
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'active':
      return 'Active';
    case 'paid':
      return 'Paid';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
};

export default function CashAdvancePage() {
  const [cashAdvances, setCashAdvances] = useState<CashAdvance[]>([]);
  const [userInfos, setUserInfos] = useState<Array<{ id: number; user_id: number; first_name?: string; last_name?: string; user?: { id: number; email: string } }>>([]);
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

  const [cashAdvanceCache, setCashAdvanceCache] = useState<Map<string, { cashAdvances: CashAdvance[], pagination: PaginationResponse }>>(new Map());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [modalState, setModalState] = useState<{
    type: 'add' | 'edit' | 'delete' | null;
    isOpen: boolean;
    cashAdvance?: CashAdvance | null;
  }>({ type: null, isOpen: false, cashAdvance: null });
  
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
    setCashAdvanceCache(new Map());
  };

  const fetchCashAdvances = async (page: number = currentPage, perPage: number = itemsPerPage, search: string = searchTerm, forceRefresh: boolean = false) => {
    const cacheKey = getCacheKey(page, perPage, search);
    
    if (!forceRefresh && cashAdvanceCache.has(cacheKey)) {
      const cachedData = cashAdvanceCache.get(cacheKey)!;
      setCashAdvances(cachedData.cashAdvances);
      setPagination(cachedData.pagination);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const allCashAdvances = await cashAdvanceService.getAll();
      
      const filtered = search.trim()
        ? allCashAdvances.filter(ca => {
            const searchLower = search.toLowerCase();
            return (
              ca.code.toLowerCase().includes(searchLower) ||
              getEmployeeName(ca).toLowerCase().includes(searchLower) ||
              ca.user_info?.user?.email?.toLowerCase().includes(searchLower) ||
              ca.description?.toLowerCase().includes(searchLower) ||
              ca.status.toLowerCase().includes(searchLower)
            );
          })
        : allCashAdvances;

      const total = filtered.length;
      const from = (page - 1) * perPage + 1;
      const to = Math.min(page * perPage, total);
      const paginatedCashAdvances = filtered.slice((page - 1) * perPage, page * perPage);
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

      setCashAdvances(paginatedCashAdvances);
      setPagination(paginationData);
      
      setCashAdvanceCache(prev => new Map(prev).set(cacheKey, {
        cashAdvances: paginatedCashAdvances,
        pagination: paginationData
      }));
    } catch (error) {
      console.error('Failed to fetch cash advances:', error);
      setCashAdvances([]);
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
      const usersResponse = await userService.getAll(1, 10000, '');
      
      const infos = (usersResponse.users || []).flatMap(u => {
        if (u.user_info && (u.user_info as any).id) {
          return [{
            id: (u.user_info as any).id,
            user_id: u.id,
            first_name: u.user_info.first_name,
            last_name: u.user_info.last_name,
            user: { id: u.id, email: u.email }
          }];
        }
        return [];
      });
      setUserInfos(infos);
    } catch (error) {
      console.error('Failed to fetch supporting data:', error);
    }
  };

  useEffect(() => {
    fetchSupportingData();
    fetchCashAdvances(currentPage, itemsPerPage, searchTerm);
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
    setCashAdvances([]);
    setTimeout(() => {
      fetchCashAdvances(currentPage, itemsPerPage, searchTerm, true);
    }, 100);
  };

  const forceRefresh = async () => {
    setLoading(true);
    setCashAdvances([]);
    setCashAdvanceCache(new Map());
    
    try {
      await fetchCashAdvances(currentPage, itemsPerPage, searchTerm, true);
    } catch (error) {
      console.error('Force refresh failed:', error);
      setCashAdvances([]);
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

  const openModal = (type: 'add' | 'edit' | 'delete', cashAdvance?: CashAdvance) => {
    setErrors({});

    if (type === 'add') {
      resetForm();
      setModalState({ type: 'add', isOpen: true, cashAdvance: null });
    } else if (type === 'delete' && cashAdvance) {
      setModalState({ type: 'delete', isOpen: true, cashAdvance });
    } else if (type === 'edit' && cashAdvance) {
      setModalState({ type: 'edit', isOpen: true, cashAdvance });
    }
  };

  const closeModal = () => {
    setModalState({ type: null, isOpen: false, cashAdvance: null });
  };

  const handleCreate = async (data: CreateCashAdvanceRequest | UpdateCashAdvanceRequest) => {
    setFormLoading(true);
    setErrors({});

    try {
      await cashAdvanceService.create(data as CreateCashAdvanceRequest);
      closeModal();
      resetForm();
      forceRefresh();
      showToast("success", "Cash Advance Created", "The cash advance has been successfully created.");
    } catch (err: any) {
      console.error('Failed to create cash advance:', err);
      handleApiError(err, "Failed to create cash advance");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (data: CreateCashAdvanceRequest | UpdateCashAdvanceRequest) => {
    if (!modalState.cashAdvance) return;

    setFormLoading(true);
    setErrors({});

    try {
      await cashAdvanceService.update(modalState.cashAdvance.id, data as UpdateCashAdvanceRequest);
      closeModal();
      resetForm();
      forceRefresh();
      showToast("success", "Cash Advance Updated", "The cash advance details were successfully updated.");
    } catch (err: any) {
      handleApiError(err, "Failed to update cash advance");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!modalState.cashAdvance) return;
    
    setFormLoading(true);
    setErrors({});

    try {
      await cashAdvanceService.delete(modalState.cashAdvance.id);
      closeModal();
      forceRefresh();
      showToast("success", "Cash Advance Deleted", "The cash advance was successfully deleted.");
    } catch (err: any) {
      console.error('Delete error:', err);
      
      if (err.response?.status === 404) {
        setErrors({ general: "Cash advance not found. It may have already been deleted." });
        showToast("warning", "Cash Advance Not Found", "This cash advance may have already been deleted.");
        forceRefresh();
      } else {
        handleApiError(err, "Failed to delete cash advance");
      }
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div>
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cash advances..."
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
                <CirclePlus className="h-4 w-4" />
                Add Cash Advance
              </Button>
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader size="md" />
            </div>
          ) : cashAdvances.length === 0 ? (
            <EmptyStates.Generic
              icon={DollarSign}
              title="No cash advances found"
              description="There are no cash advances in the system yet. Create your first cash advance to get started."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Code</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Outstanding Balance</TableHead>
                    <TableHead>Date Issued</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashAdvances.map(cashAdvance => (
                    <TableRow key={cashAdvance.id} className="hover:bg-transparent">
                      <TableCell className="font-mono">{cashAdvance.code}</TableCell>
                      <TableCell>{getEmployeeName(cashAdvance)}</TableCell>
                      <TableCell>₱{cashAdvance.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell>₱{cashAdvance.outstanding_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell>{new Date(cashAdvance.date_issued).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${getStatusBadgeClass(cashAdvance.status)}`}>
                          {getStatusLabel(cashAdvance.status)}
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
                            <DropdownMenuItem onClick={() => openModal('edit', cashAdvance)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openModal('delete', cashAdvance)}
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
        <CashAdvanceFormModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          mode="create"
          userInfos={userInfos}
          onSubmit={handleCreate}
          loading={formLoading}
          errors={errors}
          onClearError={clearError}
        />
      )}

      {modalState.type === 'edit' && modalState.cashAdvance && (
        <CashAdvanceFormModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          mode="edit"
          userInfos={userInfos}
          initialData={modalState.cashAdvance}
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
          title="Delete Cash Advance"
          itemName={modalState.cashAdvance?.code || 'this cash advance'}
          errors={errors}
        />
      )}
    </div>
  );
}
