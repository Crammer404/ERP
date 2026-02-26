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
import type { Loan, CreateLoanRequest, UpdateLoanRequest } from '../services/loan-service';
import { tenantContextService } from '@/services/tenant/tenantContextService';
import { managementService, Employee } from '@/services/management/managementService';
import { branchService } from '@/app/management/branches/services/branchService';

interface LoanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  userInfos: Array<{ id: number; user_id: number; first_name?: string; last_name?: string; user?: { id: number; email: string } }>;
  initialData?: Loan;
  onSubmit: (data: CreateLoanRequest | UpdateLoanRequest) => Promise<void> | void;
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

const calculateTotalAmount = (principal: number, interestRate: number | null | undefined): number => {
  if (!interestRate || interestRate === 0) {
    return principal;
  }
  return principal * (1 + interestRate / 100);
};

export function LoanFormModal({
  isOpen,
  onClose,
  mode,
  userInfos,
  initialData,
  onSubmit,
  loading,
  errors,
  onClearError,
}: LoanFormModalProps) {
  const [formData, setFormData] = useState<CreateLoanRequest>({
    branch_id: 0,
    user_id: 0,
    loan_type: '',
    principal_amount: 0,
    interest_rate: null,
    total_amount: 0,
    deduction_per_cutoff: 0,
    remaining_balance: 0,
    start_date: new Date().toISOString().split('T')[0],
    end_date: null,
    status: 'pending',
    remarks: null,
  });
  const [principalInputValue, setPrincipalInputValue] = useState<string>('');
  const [interestRateInputValue, setInterestRateInputValue] = useState<string>('');
  const [totalAmountInputValue, setTotalAmountInputValue] = useState<string>('');
  const [deductionInputValue, setDeductionInputValue] = useState<string>('');
  const [balanceInputValue, setBalanceInputValue] = useState<string>('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [currentBranchName, setCurrentBranchName] = useState<string>('Loading...');
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [autoCalculateTotal, setAutoCalculateTotal] = useState(true);

  useEffect(() => {
    if (isOpen) {
      getCurrentBranch();
      setLocalErrors({});
      
      if (mode === 'edit' && initialData) {
        setFormData({
          branch_id: initialData.branch_id,
          user_id: initialData.user_id,
          loan_type: initialData.loan_type,
          principal_amount: initialData.principal_amount,
          interest_rate: initialData.interest_rate,
          total_amount: initialData.total_amount,
          deduction_per_cutoff: initialData.deduction_per_cutoff,
          remaining_balance: initialData.remaining_balance,
          start_date: initialData.start_date,
          end_date: initialData.end_date,
          status: initialData.status,
          remarks: initialData.remarks,
        });
        setPrincipalInputValue(initialData.principal_amount.toString());
        setInterestRateInputValue(initialData.interest_rate?.toString() || '');
        setTotalAmountInputValue(initialData.total_amount.toString());
        setDeductionInputValue(initialData.deduction_per_cutoff.toString());
        setBalanceInputValue(initialData.remaining_balance.toString());
        setAutoCalculateTotal(false);
      } else {
        const branchContext = tenantContextService.getStoredBranchContext();
        if (branchContext) {
          setFormData({
            branch_id: branchContext.id,
            user_id: 0,
            loan_type: '',
            principal_amount: 0,
            interest_rate: null,
            total_amount: 0,
            deduction_per_cutoff: 0,
            remaining_balance: 0,
            start_date: new Date().toISOString().split('T')[0],
            end_date: null,
            status: 'pending',
            remarks: null,
          });
        } else {
          setFormData({
            branch_id: 0,
            user_id: 0,
            loan_type: '',
            principal_amount: 0,
            interest_rate: null,
            total_amount: 0,
            deduction_per_cutoff: 0,
            remaining_balance: 0,
            start_date: new Date().toISOString().split('T')[0],
            end_date: null,
            status: 'pending',
            remarks: null,
          });
        }
        setPrincipalInputValue('');
        setInterestRateInputValue('');
        setTotalAmountInputValue('');
        setDeductionInputValue('');
        setBalanceInputValue('');
        setAutoCalculateTotal(true);
      }
    }
  }, [mode, initialData, isOpen]);

  useEffect(() => {
    if (isOpen && formData.branch_id) {
      fetchEmployees();
    }
  }, [isOpen, formData.branch_id, mode, initialData?.branch_id]);

  useEffect(() => {
    if (autoCalculateTotal && formData.principal_amount > 0) {
      const calculatedTotal = calculateTotalAmount(formData.principal_amount, formData.interest_rate);
      handleChange('total_amount', calculatedTotal);
      setTotalAmountInputValue(calculatedTotal.toFixed(2));
      
      if (mode === 'create') {
        handleChange('remaining_balance', calculatedTotal);
        setBalanceInputValue(calculatedTotal.toFixed(2));
      }
    }
  }, [formData.principal_amount, formData.interest_rate, autoCalculateTotal, mode]);

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

    if (!formData.loan_type || formData.loan_type.trim() === '') {
      newErrors.loan_type = 'Loan type is required';
    }

    if (!formData.principal_amount || formData.principal_amount <= 0) {
      newErrors.principal_amount = 'Principal amount must be greater than 0';
    }

    if (!formData.total_amount || formData.total_amount <= 0) {
      newErrors.total_amount = 'Total amount must be greater than 0';
    }

    if ((formData.remaining_balance ?? 0) < 0) {
      newErrors.remaining_balance = 'Remaining balance cannot be negative';
    }

    if ((formData.remaining_balance ?? 0) > (formData.total_amount ?? 0)) {
      newErrors.remaining_balance = 'Remaining balance cannot exceed the total amount';
    }

    if (!formData.deduction_per_cutoff || formData.deduction_per_cutoff <= 0) {
      newErrors.deduction_per_cutoff = 'Deduction per cutoff must be greater than 0';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (formData.end_date && formData.start_date && new Date(formData.end_date) < new Date(formData.start_date)) {
      newErrors.end_date = 'End date must be after or equal to start date';
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

  const handleChange = (field: keyof CreateLoanRequest, value: any) => {
    onClearError(field);
    setLocalErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: keyof CreateLoanRequest) => {
    const newErrors: Record<string, string> = {};

    if (field === 'principal_amount' && (!formData.principal_amount || formData.principal_amount <= 0)) {
      newErrors.principal_amount = 'Principal amount must be greater than 0';
    }

    if (field === 'remaining_balance') {
      if ((formData.remaining_balance ?? 0) < 0) {
        newErrors.remaining_balance = 'Remaining balance cannot be negative';
      }
      if ((formData.remaining_balance ?? 0) > (formData.total_amount ?? 0)) {
        newErrors.remaining_balance = 'Remaining balance cannot exceed the total amount';
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

  const employeeOptions = employees.map((employee) => ({
    value: employee.id.toString(),
    label: getEmployeeDisplayName(employee),
  }));

  const selectedEmployee = employeeOptions.find(opt => opt.value === formData.user_id?.toString());

  const isCreateMode = mode === 'create';
  const modalTitle = isCreateMode ? 'Create Loan' : 'Edit Loan';
  const modalDescription = isCreateMode 
    ? 'Add a new loan for an employee.'
    : 'Update the loan details below.';
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
                This loan will be created for the currently selected branch
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
                Loan Type <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.loan_type}
                onChange={(e) => handleChange('loan_type', e.target.value)}
                placeholder="e.g., Personal Loan, Emergency Loan"
                disabled={loading}
              />
              {allErrors.loan_type && <p className="text-red-500 text-xs">{allErrors.loan_type}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Principal Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={principalInputValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPrincipalInputValue(value);
                    const numValue = parseFloat(value);
                    if (value === '' || isNaN(numValue)) {
                      handleChange('principal_amount', 0);
                    } else {
                      handleChange('principal_amount', numValue);
                    }
                  }}
                  onBlur={() => {
                    const numValue = parseFloat(principalInputValue);
                    if (principalInputValue === '' || isNaN(numValue)) {
                      setPrincipalInputValue('');
                      handleChange('principal_amount', 0);
                    } else {
                      setPrincipalInputValue(numValue.toString());
                      handleChange('principal_amount', numValue);
                    }
                    handleBlur('principal_amount');
                  }}
                  placeholder="0.00"
                  disabled={loading}
                />
                {allErrors.principal_amount && <p className="text-red-500 text-xs">{allErrors.principal_amount}</p>}
              </div>

              <div className="space-y-2">
                <Label>
                  Interest Rate (%) <span className="text-muted-foreground text-xs">(Optional)</span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={interestRateInputValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    setInterestRateInputValue(value);
                    const numValue = parseFloat(value);
                    if (value === '' || isNaN(numValue)) {
                      handleChange('interest_rate', null);
                    } else {
                      handleChange('interest_rate', numValue);
                    }
                  }}
                  placeholder="0.00"
                  disabled={loading}
                />
                {allErrors.interest_rate && <p className="text-red-500 text-xs">{allErrors.interest_rate}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Total Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={totalAmountInputValue}
                onChange={(e) => {
                  const value = e.target.value;
                  setTotalAmountInputValue(value);
                  setAutoCalculateTotal(false);
                  const numValue = parseFloat(value);
                  if (value === '' || isNaN(numValue)) {
                    handleChange('total_amount', 0);
                  } else {
                    handleChange('total_amount', numValue);
                  }
                }}
                onBlur={() => {
                  const numValue = parseFloat(totalAmountInputValue);
                  if (totalAmountInputValue === '' || isNaN(numValue)) {
                    setTotalAmountInputValue('');
                    handleChange('total_amount', 0);
                  } else {
                    setTotalAmountInputValue(numValue.toFixed(2));
                    handleChange('total_amount', numValue);
                  }
                }}
                placeholder="0.00"
                disabled={loading}
              />
              {allErrors.total_amount && <p className="text-red-500 text-xs">{allErrors.total_amount}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Deduction per Cutoff <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={deductionInputValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDeductionInputValue(value);
                    const numValue = parseFloat(value);
                    if (value === '' || isNaN(numValue)) {
                      handleChange('deduction_per_cutoff', 0);
                    } else {
                      handleChange('deduction_per_cutoff', numValue);
                    }
                  }}
                  onBlur={() => {
                    const numValue = parseFloat(deductionInputValue);
                    if (deductionInputValue === '' || isNaN(numValue)) {
                      setDeductionInputValue('');
                      handleChange('deduction_per_cutoff', 0);
                    } else {
                      setDeductionInputValue(numValue.toString());
                      handleChange('deduction_per_cutoff', numValue);
                    }
                  }}
                  placeholder="0.00"
                  disabled={loading}
                />
                {allErrors.deduction_per_cutoff && <p className="text-red-500 text-xs">{allErrors.deduction_per_cutoff}</p>}
              </div>

              <div className="space-y-2">
                <Label>
                  Remaining Balance <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max={formData.total_amount ?? undefined}
                  value={balanceInputValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    setBalanceInputValue(value);
                    const numValue = parseFloat(value);
                    if (value === '' || isNaN(numValue)) {
                      handleChange('remaining_balance', 0);
                    } else {
                      const clampedValue = Math.min(numValue, formData.total_amount ?? 0);
                      handleChange('remaining_balance', clampedValue);
                    }
                  }}
                  onBlur={() => {
                    const numValue = parseFloat(balanceInputValue);
                    if (balanceInputValue === '' || isNaN(numValue)) {
                      setBalanceInputValue('');
                      handleChange('remaining_balance', 0);
                    } else {
                      const clampedValue = Math.min(numValue, formData.total_amount ?? 0);
                      setBalanceInputValue(clampedValue.toFixed(2));
                      handleChange('remaining_balance', clampedValue);
                    }
                    handleBlur('remaining_balance');
                  }}
                  placeholder="0.00"
                  disabled={loading}
                />
                {allErrors.remaining_balance && <p className="text-red-500 text-xs">{allErrors.remaining_balance}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.start_date && "text-muted-foreground"
                      )}
                      disabled={loading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.start_date
                        ? format(new Date(formData.start_date), "PPP")
                        : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.start_date ? new Date(formData.start_date) : undefined}
                      onSelect={(date) => {
                        handleChange('start_date', date ? format(date, "yyyy-MM-dd") : "");
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {allErrors.start_date && <p className="text-red-500 text-xs">{allErrors.start_date}</p>}
              </div>

              <div className="space-y-2">
                <Label>
                  End Date <span className="text-muted-foreground text-xs">(Optional)</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.end_date && "text-muted-foreground"
                      )}
                      disabled={loading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.end_date
                        ? format(new Date(formData.end_date), "PPP")
                        : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.end_date ? new Date(formData.end_date) : undefined}
                      onSelect={(date) => {
                        handleChange('end_date', date ? format(date, "yyyy-MM-dd") : null);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {allErrors.end_date && <p className="text-red-500 text-xs">{allErrors.end_date}</p>}
              </div>
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              {allErrors.status && <p className="text-red-500 text-xs">{allErrors.status}</p>}
            </div>

            <div className="space-y-2">
              <Label>
                Remarks <span className="text-muted-foreground text-xs">(Optional)</span>
              </Label>
              <Textarea
                value={formData.remarks || ''}
                onChange={(e) => handleChange('remarks', e.target.value || null)}
                placeholder="Enter remarks..."
                disabled={loading}
                rows={3}
              />
              {allErrors.remarks && <p className="text-red-500 text-xs">{allErrors.remarks}</p>}
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
