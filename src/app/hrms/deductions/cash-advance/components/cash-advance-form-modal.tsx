import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { CashAdvance, CreateCashAdvanceRequest, UpdateCashAdvanceRequest } from '../services/cash-advance-service';
import { tenantContextService } from '@/services/tenant/tenantContextService';
import { managementService, Employee } from '@/services/management/managementService';
import { branchService } from '@/app/management/branches/services/branch-service';

interface CashAdvanceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  userInfos: Array<{ id: number; user_id: number; first_name?: string; last_name?: string; user?: { id: number; email: string } }>;
  initialData?: CashAdvance;
  onSubmit: (data: CreateCashAdvanceRequest | UpdateCashAdvanceRequest) => Promise<void> | void;
  loading: boolean;
  errors: Record<string, string>;
  onClearError: (field: string) => void;
}

const getEmployeeDisplayName = (employee: Employee): string => {
  if (employee.user_info) {
    const { first_name, last_name, middle_name } = employee.user_info;
    const fullName = [first_name, middle_name, last_name].filter(Boolean).join(' ');
    return fullName || employee.name || employee.email;
  }
  return employee.name || employee.email;
};

export function CashAdvanceFormModal({
  isOpen,
  onClose,
  mode,
  userInfos,
  initialData,
  onSubmit,
  loading,
  errors,
  onClearError,
}: CashAdvanceFormModalProps) {
  const [formData, setFormData] = useState<CreateCashAdvanceRequest>({
    branch_id: 0,
    user_id: 0,
    amount: 0,
    outstanding_balance: 0,
    date_issued: new Date().toISOString().split('T')[0],
    status: 'active',
    description: null,
  });
  const [amountInputValue, setAmountInputValue] = useState<string>('');
  const [balanceInputValue, setBalanceInputValue] = useState<string>('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [currentBranchName, setCurrentBranchName] = useState<string>('Loading...');
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      getCurrentBranch();
      setLocalErrors({});
      
      if (mode === 'edit' && initialData) {
        setFormData({
          branch_id: initialData.branch_id,
          user_id: initialData.user_id,
          amount: initialData.amount,
          outstanding_balance: initialData.outstanding_balance,
          date_issued: initialData.date_issued,
          status: initialData.status,
          description: initialData.description,
        });
        setAmountInputValue(initialData.amount.toString());
        setBalanceInputValue(initialData.outstanding_balance.toString());
      } else {
        const branchContext = tenantContextService.getStoredBranchContext();
        if (branchContext) {
          setFormData({
            branch_id: branchContext.id,
            user_id: 0,
            amount: 0,
            outstanding_balance: 0,
            date_issued: new Date().toISOString().split('T')[0],
            status: 'active',
            description: null,
          });
        } else {
          setFormData({
            branch_id: 0,
            user_id: 0,
            amount: 0,
            outstanding_balance: 0,
            date_issued: new Date().toISOString().split('T')[0],
            status: 'active',
            description: null,
          });
        }
        setAmountInputValue('');
        setBalanceInputValue('');
      }
    }
  }, [mode, initialData, isOpen]);

  useEffect(() => {
    if (isOpen && formData.branch_id) {
      fetchEmployees();
    }
  }, [isOpen, formData.branch_id, mode, initialData?.branch_id]);

  const getCurrentBranch = () => {
    try {
      const branchContext = tenantContextService.getStoredBranchContext();
      if (branchContext) {
        setCurrentBranchName(branchContext.name || 'Unknown Branch');
      } else {
        setCurrentBranchName('No branch selected');
      }
    } catch (error) {
      console.error('Error getting branch context:', error);
      setCurrentBranchName('Unknown');
    }
  };

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      let employeeList: Employee[] = [];
      
      let targetBranchId: number | null = null;
      
      if (mode === 'edit' && initialData?.branch_id) {
        targetBranchId = initialData.branch_id;
      } else if (mode === 'create' && formData.branch_id) {
        targetBranchId = formData.branch_id;
      } else {
        const branchContext = tenantContextService.getStoredBranchContext();
        targetBranchId = branchContext?.id || null;
      }
      
      if (targetBranchId) {
        const response = await branchService.getEmployees(targetBranchId);
        if (response?.users && Array.isArray(response.users)) {
          employeeList = response.users.map((branchUser: any) => {
            const user = branchUser.user || {};
            const userInfo = user.user_info || branchUser.user_info || {};
            return {
              id: user.id || branchUser.user_id || branchUser.id,
              email: user.email || branchUser.email || '',
              name: user.name || branchUser.name || null,
              user_info: userInfo.id ? {
                id: userInfo.id,
                user_id: user.id || branchUser.user_id,
                first_name: userInfo.first_name,
                last_name: userInfo.last_name,
                middle_name: userInfo.middle_name,
              } : undefined,
              role: user.role ? { 
                id: user.role.id || user.role_id, 
                name: user.role.name || user.role 
              } : undefined,
            };
          });
        }
      } else {
        employeeList = await managementService.fetchBranchEmployees();
      }
      
      setEmployees(employeeList);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.branch_id || formData.branch_id === 0) {
      newErrors.branch_id = 'Branch is required';
    }

    if (!formData.user_id || formData.user_id === 0) {
      newErrors.user_id = 'Employee is required';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if ((formData.outstanding_balance ?? 0) < 0) {
      newErrors.outstanding_balance = 'Outstanding balance cannot be negative';
    }

    if ((formData.outstanding_balance ?? 0) > (formData.amount ?? 0)) {
      newErrors.outstanding_balance = 'Outstanding balance cannot exceed the advance amount';
    }

    if (!formData.date_issued) {
      newErrors.date_issued = 'Date issued is required';
    }

    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  const handleChange = (field: keyof CreateCashAdvanceRequest, value: any) => {
    onClearError(field);
    setLocalErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: keyof CreateCashAdvanceRequest) => {
    const newErrors: Record<string, string> = {};

    if (field === 'amount' && (!formData.amount || formData.amount <= 0)) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (field === 'outstanding_balance') {
      if ((formData.outstanding_balance ?? 0) < 0) {
        newErrors.outstanding_balance = 'Outstanding balance cannot be negative';
      }
      if ((formData.outstanding_balance ?? 0) > (formData.amount ?? 0)) {
        newErrors.outstanding_balance = 'Outstanding balance cannot exceed the advance amount';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setLocalErrors(prev => ({ ...prev, ...newErrors }));
    }
  };

  const allErrors = { ...localErrors, ...errors };

  const handleEmployeeChange = (value: string) => {
    const userId = parseInt(value);
    handleChange('user_id', userId);
  };

  const employeeOptions = employees
    .map((employee) => ({
      value: employee.id.toString(),
      label: getEmployeeDisplayName(employee),
    }))
    .filter((opt): opt is { value: string; label: string } => opt !== null);

  const selectedEmployee = employeeOptions.find(opt => opt.value === formData.user_id?.toString());

  const isCreateMode = mode === 'create';
  const modalTitle = isCreateMode ? 'Create Cash Advance' : 'Edit Cash Advance';
  const modalDescription = isCreateMode 
    ? 'Add a new cash advance for an employee.'
    : 'Update the cash advance details below.';
  const submitButtonText = isCreateMode 
    ? (loading ? 'Creating...' : 'Create')
    : (loading ? 'Updating...' : 'Update');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{modalTitle}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {modalDescription}
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-[60vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4 my-2 mx-2">
            <div className="space-y-2">
              <Label>
                Branch <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                value={currentBranchName}
                readOnly
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                This cash advance will be created for the currently selected branch
              </p>
              {allErrors.branch_id && <p className="text-red-500 text-xs">{allErrors.branch_id}</p>}
            </div>

            <div className="space-y-2">
              <Label>
                Employee <span className="text-red-500">*</span>
              </Label>
              {loadingEmployees ? (
                <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                  Loading employees...
                </div>
              ) : employees.length === 0 ? (
                <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                  No employees found in this branch
                </div>
              ) : (
                <Select
                  value={formData.user_id?.toString() || ''}
                  onValueChange={handleEmployeeChange}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employeeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {allErrors.user_id && <p className="text-red-500 text-xs">{allErrors.user_id}</p>}
            </div>

            <div className="space-y-2">
              <Label>
                Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={amountInputValue}
                onChange={(e) => {
                  const value = e.target.value;
                  setAmountInputValue(value);
                  const numValue = parseFloat(value);
                  if (value === '' || isNaN(numValue)) {
                    handleChange('amount', 0);
                    if (mode === 'create') {
                      handleChange('outstanding_balance', 0);
                      setBalanceInputValue('');
                    }
                  } else {
                    handleChange('amount', numValue);
                    if (mode === 'create') {
                      handleChange('outstanding_balance', numValue);
                      setBalanceInputValue(numValue.toString());
                    }
                  }
                }}
                onBlur={() => {
                  const numValue = parseFloat(amountInputValue);
                  if (amountInputValue === '' || isNaN(numValue)) {
                    setAmountInputValue('');
                    handleChange('amount', 0);
                  } else {
                    setAmountInputValue(numValue.toString());
                    handleChange('amount', numValue);
                  }
                  handleBlur('amount');
                }}
                placeholder="0.00"
                disabled={loading}
              />
              {allErrors.amount && <p className="text-red-500 text-xs">{allErrors.amount}</p>}
            </div>

            <div className="space-y-2">
              <Label>
                Outstanding Balance <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max={formData.amount}
                value={balanceInputValue}
                onChange={(e) => {
                  const value = e.target.value;
                  setBalanceInputValue(value);
                  const numValue = parseFloat(value);
                  if (value === '' || isNaN(numValue)) {
                    handleChange('outstanding_balance', 0);
                  } else {
                    handleChange('outstanding_balance', numValue);
                  }
                }}
                onBlur={() => {
                  const numValue = parseFloat(balanceInputValue);
                  if (balanceInputValue === '' || isNaN(numValue)) {
                    setBalanceInputValue('');
                    handleChange('outstanding_balance', 0);
                  } else {
                    const clampedValue = Math.min(numValue, formData.amount);
                    setBalanceInputValue(clampedValue.toString());
                    handleChange('outstanding_balance', clampedValue);
                  }
                  handleBlur('outstanding_balance');
                }}
                placeholder="0.00"
                disabled={loading}
              />
              {allErrors.outstanding_balance && <p className="text-red-500 text-xs">{allErrors.outstanding_balance}</p>}
            </div>

            <div className="space-y-2">
              <Label>
                Date Issued <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date_issued && "text-muted-foreground"
                    )}
                    disabled={loading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date_issued
                      ? format(new Date(formData.date_issued), "PPP")
                      : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date_issued ? new Date(formData.date_issued) : undefined}
                    onSelect={(date) => {
                      handleChange('date_issued', date ? format(date, "yyyy-MM-dd") : "");
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {allErrors.date_issued && <p className="text-red-500 text-xs">{allErrors.date_issued}</p>}
            </div>

            <div className="space-y-2">
              <Label>
                Status <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange('status', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              {allErrors.status && <p className="text-red-500 text-xs">{allErrors.status}</p>}
            </div>

            <div className="space-y-2">
              <Label>
                Description <span className="text-muted-foreground text-xs">(Optional)</span>
              </Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value || null)}
                placeholder="Enter description..."
                disabled={loading}
                rows={3}
              />
              {allErrors.description && <p className="text-red-500 text-xs">{allErrors.description}</p>}
            </div>

            {allErrors.general && <p className="text-red-500 text-xs">{allErrors.general}</p>}
          </form>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={loading}
            onClick={handleSubmit}
            className="min-w-[100px]"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
