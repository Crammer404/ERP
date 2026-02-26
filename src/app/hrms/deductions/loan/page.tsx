'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { CreditCard, MoreVertical, CirclePlus, Trash2, Edit, Search, RefreshCw } from 'lucide-react';
import { loanService, type Loan, type CreateLoanRequest, type UpdateLoanRequest } from './services/loan-service';
import { useToast } from "@/hooks/use-toast";
import { Loader } from '@/components/ui/loader';
import { EmptyStates } from '@/components/ui/empty-state';
import { PaginationInfos } from '@/components/ui/pagination-info';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import { LoanFormModal } from './components/loan-form-modal';
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

const getEmployeeName = (loan: Loan): string => {
  if (loan.employee?.user_info) {
    const { first_name, last_name } = loan.employee.user_info;
    if (first_name || last_name) {
      return [first_name, last_name].filter(Boolean).join(' ');
    }
  }
  return loan.employee?.email || 'Unknown';
};

const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'approved':
      return 'bg-blue-100 text-blue-800';
    case 'ongoing':
      return 'bg-green-100 text-green-800';
    case 'completed':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'approved':
      return 'Approved';
    case 'ongoing':
      return 'Ongoing';
    case 'completed':
      return 'Completed';
    default:
      return status;
  }
};

export default function LoanPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
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

  const [loanCache, setLoanCache] = useState<Map<string, { loans: Loan[], pagination: PaginationResponse }>>(new Map());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [modalState, setModalState] = useState<{
    type: 'add' | 'edit' | 'delete' | null;
    isOpen: boolean;
    loan?: Loan | null;
  }>({ type: null, isOpen: false, loan: null });
  
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
    setLoanCache(new Map());
  };

  const fetchLoans = async (page: number = currentPage, perPage: number = itemsPerPage, search: string = searchTerm, forceRefresh: boolean = false) => {
    const cacheKey = getCacheKey(page, perPage, search);
    
    if (!forceRefresh && loanCache.has(cacheKey)) {
      const cachedData = loanCache.get(cacheKey)!;
      setLoans(cachedData.loans);
      setPagination(cachedData.pagination);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const allLoans = await loanService.getAll();
      
      const filtered = search.trim()
        ? allLoans.filter(loan => {
            const searchLower = search.toLowerCase();
            return (
              loan.code.toLowerCase().includes(searchLower) ||
              getEmployeeName(loan).toLowerCase().includes(searchLower) ||
              loan.employee?.email?.toLowerCase().includes(searchLower) ||
              loan.loan_type.toLowerCase().includes(searchLower) ||
              loan.remarks?.toLowerCase().includes(searchLower) ||
              loan.status.toLowerCase().includes(searchLower)
            );
          })
        : allLoans;

      const total = filtered.length;
      const from = (page - 1) * perPage + 1;
      const to = Math.min(page * perPage, total);
      const paginatedLoans = filtered.slice((page - 1) * perPage, page * perPage);
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

      setLoans(paginatedLoans);
      setPagination(paginationData);
      
      setLoanCache(prev => new Map(prev).set(cacheKey, {
        loans: paginatedLoans,
        pagination: paginationData
      }));
    } catch (error) {
      console.error('Failed to fetch loans:', error);
      setLoans([]);
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
    fetchLoans(currentPage, itemsPerPage, searchTerm);
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
    setLoans([]);
    setTimeout(() => {
      fetchLoans(currentPage, itemsPerPage, searchTerm, true);
    }, 100);
  };

  const forceRefresh = async () => {
    setLoading(true);
    setLoans([]);
    setLoanCache(new Map());
    
    try {
      await fetchLoans(currentPage, itemsPerPage, searchTerm, true);
    } catch (error) {
      console.error('Force refresh failed:', error);
      setLoans([]);
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

  const openModal = (type: 'add' | 'edit' | 'delete', loan?: Loan) => {
    setErrors({});

    if (type === 'add') {
      resetForm();
      setModalState({ type: 'add', isOpen: true, loan: null });
    } else if (type === 'delete' && loan) {
      setModalState({ type: 'delete', isOpen: true, loan });
    } else if (type === 'edit' && loan) {
      setModalState({ type: 'edit', isOpen: true, loan });
    }
  };

  const closeModal = () => {
    setModalState({ type: null, isOpen: false, loan: null });
  };

  const handleCreate = async (data: CreateLoanRequest | UpdateLoanRequest) => {
    setFormLoading(true);
    setErrors({});

    try {
      await loanService.create(data as CreateLoanRequest);
      closeModal();
      resetForm();
      forceRefresh();
      showToast("success", "Loan Created", "The loan has been successfully created.");
    } catch (err: any) {
      console.error('Failed to create loan:', err);
      handleApiError(err, "Failed to create loan");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (data: CreateLoanRequest | UpdateLoanRequest) => {
    if (!modalState.loan) return;

    setFormLoading(true);
    setErrors({});

    try {
      await loanService.update(modalState.loan.id, data as UpdateLoanRequest);
      closeModal();
      resetForm();
      forceRefresh();
      showToast("success", "Loan Updated", "The loan details were successfully updated.");
    } catch (err: any) {
      handleApiError(err, "Failed to update loan");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!modalState.loan) return;
    
    setFormLoading(true);
    setErrors({});

    try {
      await loanService.delete(modalState.loan.id);
      closeModal();
      forceRefresh();
      showToast("success", "Loan Deleted", "The loan was successfully deleted.");
    } catch (err: any) {
      console.error('Delete error:', err);
      
      if (err.response?.status === 404) {
        setErrors({ general: "Loan not found. It may have already been deleted." });
        showToast("warning", "Loan Not Found", "This loan may have already been deleted.");
        forceRefresh();
      } else {
        handleApiError(err, "Failed to delete loan");
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
                placeholder="Search loans..."
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
                Add Loan
              </Button>
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader size="md" />
            </div>
          ) : loans.length === 0 ? (
            <EmptyStates.Generic
              icon={CreditCard}
              title="No loans found"
              description="There are no loans in the system yet. Create your first loan to get started."
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Code</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Loan Type</TableHead>
                      <TableHead>Principal</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Remaining Balance</TableHead>
                      <TableHead>Deduction/Cutoff</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loans.map(loan => (
                      <TableRow key={loan.id} className="hover:bg-transparent">
                        <TableCell className="font-mono">{loan.code}</TableCell>
                        <TableCell>{getEmployeeName(loan)}</TableCell>
                        <TableCell>{loan.loan_type}</TableCell>
                        <TableCell>₱{loan.principal_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell>₱{loan.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell>₱{loan.remaining_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell>₱{loan.deduction_per_cutoff.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell>{new Date(loan.start_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${getStatusBadgeClass(loan.status)}`}>
                            {getStatusLabel(loan.status)}
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
                              <DropdownMenuItem onClick={() => openModal('edit', loan)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openModal('delete', loan)}
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
              </div>

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
        <LoanFormModal
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

      {modalState.type === 'edit' && modalState.loan && (
        <LoanFormModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          mode="edit"
          userInfos={userInfos}
          initialData={modalState.loan}
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
          title="Delete Loan"
          itemName={modalState.loan?.code || 'this loan'}
          errors={errors}
        />
      )}
    </div>
  );
}
