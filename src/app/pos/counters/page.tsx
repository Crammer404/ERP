'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, RefreshCw, CreditCard, CirclePlus, Eye, EyeOff } from 'lucide-react';
import { useCashRegisters } from './hooks/useCashRegisters';
import { CashRegisterTable } from './components/CashRegisterTable';
import { CashRegisterFormModal } from './components/CashRegisterFormModal';
import { OpenSessionModal } from './components/OpenSessionModal';
import { CloseSessionModal } from './components/CloseSessionModal';
import { CounterLedger } from './components/CounterLedger';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { FormError } from '@/components/ui/form-error';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/providers/auth-provider';
import { Loader } from '@/components/ui/loader';
import { EmptyStates } from '@/components/ui/empty-state';
import type { CashRegister } from './service/cashRegisterService';
import {
  createCashRegister,
  updateCashRegister,
  deleteCashRegister,
  activateCashRegister,
  openSession,
  closeSession,
} from './service/cashRegisterService';
import { tenantContextService } from '@/services/tenant/tenantContextService';

export default function CountersPage() {
  const { cashRegisters, loading, error, refetch } = useCashRegisters();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isOpenSessionModalOpen, setIsOpenSessionModalOpen] = useState(false);
  const [isCloseSessionModalOpen, setIsCloseSessionModalOpen] = useState(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [selectedCashRegister, setSelectedCashRegister] = useState<CashRegister | null>(null);
  const [actionTarget, setActionTarget] = useState<{ cashRegister: CashRegister; action: 'delete' | 'deactivate' | 'activate' } | null>(null);
  const [actionCode, setActionCode] = useState('');
  const [actionCodeError, setActionCodeError] = useState('');
  const [showActionCode, setShowActionCode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    assigned_user_id: null as number | null,
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const isManager = user?.role_name?.toLowerCase().includes('manager') || false;

  const filteredCashRegisters = useMemo(() => {
    if (!searchTerm.trim()) {
      return cashRegisters;
    }
    
    const searchLower = searchTerm.toLowerCase();
    const filtered = cashRegisters.filter(register => {
      const nameMatch = register.name.toLowerCase().includes(searchLower);
      const codeMatch = register.code?.toLowerCase().includes(searchLower);
      const userMatch = register.assignedUser?.email?.toLowerCase().includes(searchLower) ||
                       register.assignedUser?.userInfo?.first_name?.toLowerCase().includes(searchLower) ||
                       register.assignedUser?.userInfo?.last_name?.toLowerCase().includes(searchLower);
      
      return nameMatch || codeMatch || userMatch;
    });
    
    return filtered;
  }, [cashRegisters, searchTerm]);

  const totalPages = Math.ceil(filteredCashRegisters.length / itemsPerPage);
  
  const paginatedCashRegisters = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredCashRegisters.slice(start, end);
  }, [filteredCashRegisters, currentPage, itemsPerPage]);

  const paginationFrom = filteredCashRegisters.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const paginationTo = Math.min(currentPage * itemsPerPage, filteredCashRegisters.length);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  const forceRefresh = () => {
    refetch();
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleAdd = () => {
    setFormData({
      name: '',
      code: '',
      assigned_user_id: null,
      is_active: true,
    });
    setErrors({});
    setSelectedCashRegister(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (cashRegister: CashRegister) => {
    setFormData({
      name: cashRegister.name,
      code: cashRegister.code || '',
      assigned_user_id: cashRegister.assigned_user_id,
      is_active: cashRegister.is_active,
    });
    setErrors({});
    setSelectedCashRegister(cashRegister);
    setIsFormModalOpen(true);
  };

  const handleDelete = (cashRegister: CashRegister) => {
    const action = (cashRegister.sessions_count ?? 0) > 0 ? 'deactivate' : 'delete';
    setActionTarget({ cashRegister, action });
    setActionCode('');
    setActionCodeError('');
    setShowActionCode(false);
    setIsActionDialogOpen(true);
  };

  const handleActivate = (cashRegister: CashRegister) => {
    setActionTarget({ cashRegister, action: 'activate' });
    setActionCode('');
    setActionCodeError('');
    setShowActionCode(false);
    setIsActionDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!actionTarget) return;

    if (!actionCode.trim()) {
      setActionCodeError('Code is required.');
      return;
    }

    try {
      setIsLoading(true);
      setActionCodeError('');

      if (actionTarget.action === 'activate') {
        const response = await activateCashRegister(actionTarget.cashRegister.id, actionCode);
        toast({
          title: 'Activated',
          description: response?.message || 'Cash register activated successfully.',
        });
      } else {
        const response = await deleteCashRegister(actionTarget.cashRegister.id, actionCode);
        const action = response?.action;
      toast({
          title: action === 'deactivated' ? 'Deactivated' : 'Deleted',
          description: response?.message || 'Operation completed successfully.',
      });
      }
      
      setIsActionDialogOpen(false);
      setActionTarget(null);
      setActionCode('');
      refetch();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Operation failed.';
      setActionCodeError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSession = (cashRegister: CashRegister) => {
    setSelectedCashRegister(cashRegister);
    setIsOpenSessionModalOpen(true);
  };

  const handleCloseSession = (cashRegister: CashRegister) => {
    if (!cashRegister.open_session) return;
    setSelectedCashRegister(cashRegister);
    setIsCloseSessionModalOpen(true);
  };

  const handleViewLedger = (cashRegister: CashRegister) => {
    setSelectedCashRegister(cashRegister);
    setIsLedgerModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Cash register name is required.';
    }
    
    if (!formData.code.trim()) {
      newErrors.code = 'Code is required.';
    }
    
    if (!formData.assigned_user_id) {
      newErrors.assigned_user_id = 'Cashier is required.';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});

    try {
      setIsLoading(true);
      const branchContext = tenantContextService.getStoredBranchContext();

      if (selectedCashRegister) {
        await updateCashRegister(selectedCashRegister.id, {
          name: formData.name,
          code: formData.code,
          assigned_user_id: formData.assigned_user_id,
          is_active: formData.is_active,
        });
        
        toast({
          title: 'Success',
          description: 'Cash register updated successfully.',
        });
      } else {
        if (!branchContext?.id) {
          setErrors({ general: 'Branch context is required.' });
          return;
        }

        await createCashRegister({
          branch_id: branchContext.id,
          name: formData.name,
          code: formData.code,
          assigned_user_id: formData.assigned_user_id,
          is_active: formData.is_active,
        });
        
        toast({
          title: 'Success',
          description: 'Cash register created successfully.',
        });
      }

      setIsFormModalOpen(false);
      
      setFormData({
        name: '',
        code: '',
        assigned_user_id: null,
        is_active: true,
      });
      
      await refetch();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to save cash register.';
      const errorData = error.response?.data?.errors || {};
      
      setErrors(errorData);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSessionSubmit = async (payload: {
    cash_register_id: number;
    opening_balance: number;
    override_code?: string;
    override_reason?: string;
  }) => {
    try {
      setIsLoading(true);
      await openSession(payload);
      toast({
        title: 'Success',
        description: 'Session opened successfully.',
      });
      setIsOpenSessionModalOpen(false);
      refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to open session.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSessionSubmit = async (payload: {
    counted_closing_balance: number;
    notes?: string;
  }) => {
    if (!selectedCashRegister?.open_session) return;

    try {
      setIsLoading(true);
      await closeSession(selectedCashRegister.open_session.id, payload);
      toast({
        title: 'Success',
        description: 'Session closed successfully.',
      });
      setIsCloseSessionModalOpen(false);
      refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to close session.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <CreditCard className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-headline">Cash Registers</h1>
          <p className="text-sm text-muted-foreground">
            Manage cash registers and sessions
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cash registers..."
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

              {isManager && (
                <Button 
                  onClick={handleAdd} 
                  className="flex items-center gap-2 flex-1 sm:flex-none"
                >
                  <CirclePlus className="h-4 w-4" />
                  Add Counter
                </Button>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
              <div className="font-semibold mb-1">Error loading cash registers</div>
              <div className="text-sm">{error}</div>
              <div className="text-xs mt-2 opacity-75">
                Check browser console for detailed error information.
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader />
            </div>
          ) : filteredCashRegisters.length === 0 ? (
            <EmptyStates.Generic
              title="No cash registers found"
              description={
                searchTerm 
                  ? "No cash registers match your search criteria."
                  : "There are no cash registers in the system yet. Create your first cash register to get started."
              }
            />
          ) : (
            <CashRegisterTable
              cashRegisters={paginatedCashRegisters}
              onEdit={isManager ? handleEdit : undefined}
              onDelete={isManager ? handleDelete : undefined}
              onActivate={isManager ? handleActivate : undefined}
              onOpenSession={handleOpenSession}
              onCloseSession={handleCloseSession}
              onViewLedger={handleViewLedger}
              isManager={isManager}
              pagination={{
                from: paginationFrom,
                to: paginationTo,
                total: filteredCashRegisters.length,
                itemsPerPage,
                onItemsPerPageChange: handleItemsPerPageChange,
                currentPage,
                totalPages,
                onPageChange: handlePageChange,
              }}
            />
          )}
        </CardContent>
      </Card>

      <CashRegisterFormModal
        isOpen={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        isEdit={!!selectedCashRegister}
        formData={formData}
        onInputChange={handleInputChange}
        errors={errors}
        isLoading={isLoading}
        onSubmit={handleSubmit}
        currentCashRegisterId={selectedCashRegister?.id || null}
        existingCashRegisters={cashRegisters.map(cr => ({
          id: cr.id,
          assigned_user_id: cr.assigned_user_id,
        }))}
      />

      {selectedCashRegister && (
        <>
          <OpenSessionModal
            isOpen={isOpenSessionModalOpen}
            onOpenChange={setIsOpenSessionModalOpen}
            cashRegister={selectedCashRegister}
            onSubmit={handleOpenSessionSubmit}
            isLoading={isLoading}
            isManager={isManager}
          />

          <CloseSessionModal
            isOpen={isCloseSessionModalOpen}
            onOpenChange={setIsCloseSessionModalOpen}
            cashRegister={selectedCashRegister}
            session={selectedCashRegister.open_session || null}
            onSubmit={handleCloseSessionSubmit}
            isLoading={isLoading}
          />

          <CounterLedger
            isOpen={isLedgerModalOpen}
            onOpenChange={setIsLedgerModalOpen}
            cashRegister={selectedCashRegister}
          />
        </>
      )}

      <Dialog 
        open={isActionDialogOpen} 
        onOpenChange={(open) => {
          setIsActionDialogOpen(open);
          if (!open) {
            setActionTarget(null);
            setActionCode('');
            setActionCodeError('');
            setShowActionCode(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionTarget?.action === 'activate' 
                ? 'Activate Cash Register' 
                : actionTarget?.action === 'deactivate' 
                  ? 'Deactivate Cash Register' 
                  : 'Delete Cash Register'}
            </DialogTitle>
            <DialogDescription>
              {actionTarget?.action === 'activate'
                ? `Are you sure you want to activate "${actionTarget?.cashRegister.name}"?`
                : actionTarget?.action === 'deactivate'
                  ? `Are you sure you want to deactivate "${actionTarget?.cashRegister.name}"? This register has transaction history and will be marked as inactive.`
                  : `Are you sure you want to delete "${actionTarget?.cashRegister.name}"? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            <Label htmlFor="action-code">Enter Code to Confirm *</Label>
            <div className="relative">
              <Input
                id="action-code"
                type={showActionCode ? 'text' : 'password'}
                value={actionCode}
                onChange={(e) => {
                  setActionCode(e.target.value);
                  if (actionCodeError) setActionCodeError('');
                }}
                placeholder="Enter cash register code"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowActionCode(!showActionCode)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showActionCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <FormError message={actionCodeError} />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsActionDialogOpen(false);
                setActionTarget(null);
                setActionCode('');
                setActionCodeError('');
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant={actionTarget?.action === 'activate' ? 'default' : 'destructive'}
              onClick={confirmAction}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : actionTarget?.action === 'activate' 
                ? 'Activate' 
                : actionTarget?.action === 'deactivate' 
                  ? 'Deactivate' 
                  : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
