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
import { Switch } from "@/components/ui/switch";
import { MultiSelect } from "@/components/ui/multi-select";
import { Loader2 } from "lucide-react";
import type { PayrollPosition, CreatePositionRequest, UpdatePositionRequest } from '../services/position-service';
import { tenantContextService } from '@/services/tenant/tenantContextService';
import { managementService, Employee } from '@/services/management/managementService';
import { branchService } from '@/app/management/branches/services/branchService';

interface PositionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | 'add-employees';
  branches: { id: number; name: string }[];
  userInfos: Array<{ id: number; user_id: number; first_name?: string; last_name?: string; user?: { id: number; email: string } }>;
  allowances: { id: number; label: string; value: string }[];
  initialData?: PayrollPosition;
  onSubmit: (data: CreatePositionRequest | UpdatePositionRequest) => Promise<void> | void;
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

export function PositionFormModal({
  isOpen,
  onClose,
  mode,
  branches,
  userInfos,
  allowances,
  initialData,
  onSubmit,
  loading,
  errors,
  onClearError,
}: PositionFormModalProps) {
  const [formData, setFormData] = useState<CreatePositionRequest>({
    branch_id: 0,
    user_info_ids: [],
    name: '',
    base_salary: 0,
    allowance_id: null,
    is_active: true,
  });
  const [salaryInputValue, setSalaryInputValue] = useState<string>('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [currentBranchName, setCurrentBranchName] = useState<string>('Loading...');
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      getCurrentBranch();
      setLocalErrors({}); // Clear local errors when modal opens
      
      if (mode === 'edit' && initialData) {
        setFormData({
          branch_id: initialData.branch_id,
          user_info_ids: initialData.user_infos?.map(ui => ui.id) || [],
          name: initialData.name,
          base_salary: initialData.base_salary,
          allowance_id: initialData.allowance_id,
          is_active: initialData.is_active,
        });
        setSalaryInputValue(initialData.base_salary.toString());
      } else if (mode === 'add-employees' && initialData) {
        // For add-employees mode, start with empty selection (new employees to add)
        setFormData({
          branch_id: initialData.branch_id,
          user_info_ids: [],
          name: initialData.name,
          base_salary: initialData.base_salary,
          allowance_id: initialData.allowance_id,
          is_active: initialData.is_active,
        });
        setSalaryInputValue(initialData.base_salary.toString());
      } else {
        // Set branch from context for create mode
        const branchContext = tenantContextService.getStoredBranchContext();
        if (branchContext) {
          setFormData({
            branch_id: branchContext.id,
            user_info_ids: [],
            name: '',
            base_salary: 0,
            allowance_id: null,
            is_active: true,
          });
        } else {
          setFormData({
            branch_id: 0,
            user_info_ids: [],
            name: '',
            base_salary: 0,
            allowance_id: null,
            is_active: true,
          });
        }
        setSalaryInputValue('');
      }
    }
  }, [mode, initialData, isOpen]);

  // Fetch employees when branch_id is available
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
      
      // Determine which branch to fetch employees from
      let targetBranchId: number | null = null;
      
      if (mode === 'add-employees' && initialData?.branch_id) {
        // In add-employees mode, use the position's branch
        targetBranchId = initialData.branch_id;
      } else if (mode === 'edit' && initialData?.branch_id) {
        // In edit mode, use the position's branch (not current context)
        targetBranchId = initialData.branch_id;
      } else if (mode === 'create' && formData.branch_id) {
        // In create mode, use the form's branch_id (from context)
        targetBranchId = formData.branch_id;
      } else {
        // Fallback: try to get from current branch context
        const branchContext = tenantContextService.getStoredBranchContext();
        targetBranchId = branchContext?.id || null;
      }
      
      if (targetBranchId) {
        // Fetch employees from the specific branch
        const response = await branchService.getEmployees(targetBranchId);
        if (response?.users && Array.isArray(response.users)) {
          // Convert branch employees to Employee format
          // BranchUserResource returns: { id, branch_id, user_id, user: { id, email, role, user_info } }
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
        // Fallback: use current branch context (legacy behavior)
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

    // Skip validation for add-employees mode
    if (mode === 'add-employees') {
      setLocalErrors(newErrors);
      return true;
    }

    // Validate branch
    if (!formData.branch_id || formData.branch_id === 0) {
      newErrors.branch_id = 'Branch is required';
    }

    // Validate position name
    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'Position name is required';
    }

    // Validate monthly salary
    if (!formData.base_salary || formData.base_salary <= 0) {
      newErrors.base_salary = 'Monthly salary must be greater than 0';
    }

    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (!validateForm()) {
      return;
    }

    // For add-employees mode, merge new selections with existing employees
    if (mode === 'add-employees' && initialData) {
      const existingIds = initialData.user_infos?.map(ui => ui.id) || [];
      const newIds = formData.user_info_ids || [];
      // Merge and remove duplicates
      const mergedIds = [...new Set([...existingIds, ...newIds])];
      onSubmit({ user_info_ids: mergedIds });
    } else {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof CreatePositionRequest, value: any) => {
    onClearError(field);
    // Clear local error for this field
    setLocalErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: keyof CreatePositionRequest) => {
    // Validate on blur
    const newErrors: Record<string, string> = {};

    if (field === 'name' && (!formData.name || formData.name.trim() === '')) {
      newErrors.name = 'Position name is required';
    }

    if (field === 'base_salary' && (!formData.base_salary || formData.base_salary <= 0)) {
      newErrors.base_salary = 'Monthly salary must be greater than 0';
    }

    if (Object.keys(newErrors).length > 0) {
      setLocalErrors(prev => ({ ...prev, ...newErrors }));
    }
  };

  // Merge local errors with API errors (API errors take precedence)
  const allErrors = { ...localErrors, ...errors };

  const handleEmployeeChange = (selectedValues: string[]) => {
    const userInfoIds = selectedValues.map(v => parseInt(v));
    handleChange('user_info_ids', userInfoIds);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Position' : mode === 'add-employees' ? 'Add Employees' : 'Edit Position'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Add a new payroll position for an employee.'
              : mode === 'add-employees'
              ? 'Add employees to this position.'
              : 'Update the position details below.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Branch - Read-only */}
            {mode !== 'add-employees' && (
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
                  This position will be created for the currently selected branch
                </p>
                {allErrors.branch_id && (
                  <p className="text-sm text-destructive">{allErrors.branch_id}</p>
                )}
              </div>
            )}

            {/* Position Name */}
            {mode !== 'add-employees' && (
              <div className="space-y-2">
                <Label>
                  Position Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  placeholder="Position name"
                  disabled={loading}
                />
                {allErrors.name && (
                  <p className="text-sm text-destructive">{allErrors.name}</p>
                )}
              </div>
            )}

            {/* Monthly Salary */}
            {mode !== 'add-employees' && (
              <div className="space-y-2">
                <Label>
                  Monthly Salary <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={salaryInputValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSalaryInputValue(value);
                    const numValue = parseFloat(value);
                    if (value === '' || isNaN(numValue)) {
                      handleChange('base_salary', 0);
                    } else {
                      handleChange('base_salary', numValue);
                    }
                  }}
                  onBlur={() => {
                    // Ensure we have a valid number on blur
                    const numValue = parseFloat(salaryInputValue);
                    if (salaryInputValue === '' || isNaN(numValue)) {
                      setSalaryInputValue('');
                      handleChange('base_salary', 0);
                    } else {
                      setSalaryInputValue(numValue.toString());
                      handleChange('base_salary', numValue);
                    }
                    handleBlur('base_salary');
                  }}
                  placeholder="0.00"
                  disabled={loading}
                />
                {allErrors.base_salary && (
                  <p className="text-sm text-destructive">{allErrors.base_salary}</p>
                )}
              </div>
            )}

            {/* Status - Toggle */}
            {mode !== 'add-employees' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="status-toggle">Status</Label>
                  <Switch
                    id="status-toggle"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleChange('is_active', checked)}
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {formData.is_active ? 'Position is active' : 'Position is inactive'}
                </p>
              </div>
            )}

            {/* Employees - MultiSelect */}
            <div className="space-y-2">
              <Label htmlFor="employee-select">
                Select Employees <span className="text-muted-foreground text-xs">(Optional)</span>
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
                <MultiSelect
                  options={employees
                    .filter((employee) => {
                      if (mode === 'add-employees' && initialData) {
                        const userInfo = userInfos.find(ui => ui.user_id === employee.id);
                        const userInfoId = userInfo && 'id' in userInfo ? userInfo.id : null;
                        const existingIds = initialData.user_infos?.map(ui => ui.id) || [];
                        return userInfoId && !existingIds.includes(userInfoId);
                      }
                      return true;
                    })
                    .map((employee) => {
                      let userInfoId: number | null = null;
                      if (
                        employee.user_info && 
                        typeof (employee.user_info as any).id === 'number'
                      ) {
                        userInfoId = (employee.user_info as any).id;
                      } else {
                        const userInfo = userInfos.find(ui => ui.user_id === employee.id);
                        userInfoId = userInfo?.id || null;
                      }
                      if (!userInfoId) {
                        return null;
                      }
                      return {
                        value: userInfoId.toString(),
                        label: getEmployeeDisplayName(employee),
                      };
                    })
                    .filter((opt): opt is { value: string; label: string } => opt !== null)}
                  value={formData.user_info_ids?.map(id => id.toString()) || []}
                  onChange={handleEmployeeChange}
                  searchPlaceholder="Search employees..."
                  disabled={loading}
                  maxHeight="200px"
                  emptyLabel={mode === 'add-employees' ? "Click to add new employees" : "Click to add employees"}
                />
              )}
              {allErrors.user_info_ids && (
                <p className="text-sm text-destructive">{allErrors.user_info_ids}</p>
              )}
            </div>

            {allErrors.general && (
              <p className="text-sm text-destructive">{allErrors.general}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Create' : mode === 'add-employees' ? 'Add Employees' : 'Update'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
