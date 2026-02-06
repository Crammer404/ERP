'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TimePicker } from '@/components/ui/time-picker';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { managementService, Employee } from '@/services/management/managementService';
import { useToast } from '@/hooks/use-toast';
import { validateScheduleForm } from '@/lib/validations/scheduleValidation';
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';

export interface ScheduleFormData {
  scheduleName: string;
  branchId: string;
  morningStart: string;
  morningEnd: string;
  afternoonStart: string;
  afternoonEnd: string;
  nightStart: string;
  nightEnd: string;
  gracePeriod: string;
  overtimeThreshold: string;
  selectedEmployees: string[];
}

interface Errors {
  [key: string]: string;
}

interface AddScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initialData?: ScheduleFormData;
  onSubmit: (data: ScheduleFormData) => void;
  loading: boolean;
  errors: Errors;
  onClearError?: (field: string) => void;
}

const getDefaultFormData = (): ScheduleFormData => ({
  scheduleName: '',
  branchId: '',
  morningStart: '',
  morningEnd: '',
  afternoonStart: '',
  afternoonEnd: '',
  nightStart: '',
  nightEnd: '',
  gracePeriod: '',
  overtimeThreshold: '',
  selectedEmployees: [],
});

export function AddScheduleModal({
  isOpen,
  onClose,
  mode,
  initialData,
  onSubmit,
  loading,
  errors,
  onClearError
}: AddScheduleModalProps) {
  const [formData, setFormData] = useState<ScheduleFormData>(getDefaultFormData());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [currentBranchName, setCurrentBranchName] = useState<string>('Loading...');
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setFormData({ ...initialData });
      } else if (mode === 'create') {
        setFormData(getDefaultFormData());
      }
      // Clear local errors when modal opens
      setLocalErrors({});
      // Fetch employees when modal opens
      fetchEmployees();
      // Get current branch context
      getCurrentBranch();
    } else {
      setFormData(getDefaultFormData());
      setLocalErrors({});
    }
  }, [isOpen, mode, initialData]);

  const getCurrentBranch = () => {
    try {
      const branchContext = localStorage.getItem('branch_context');
      if (branchContext) {
        const branch = JSON.parse(branchContext);
        setCurrentBranchName(branch.name || 'Unknown Branch');
        // Set branch ID in form data
        setFormData(prev => ({
          ...prev,
          branchId: branch.id?.toString() || ''
        }));
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
      const employeeList = await managementService.fetchBranchEmployees();
      setEmployees(employeeList);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const getEmployeeDisplayName = (employee: Employee): string => {
    let name = '';
    
    if (employee.user_info) {
      const { first_name, last_name, middle_name } = employee.user_info;
      const fullName = [first_name, middle_name, last_name].filter(Boolean).join(' ');
      name = fullName || employee.name || employee.email;
    } else {
      name = employee.name || employee.email;
    }
    
    // Add role if available
    const role = employee.role?.name || 'Employee';
    return `${name} - ${role}`;
  };

  const handleInputChange = (field: keyof ScheduleFormData, value: string | string[]) => {
    // Clear server-side error
    if (onClearError) {
      onClearError(field);
    }

    // Clear local validation error
    setLocalErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      // Also clear related errors
      if (field === 'morningStart' || field === 'morningEnd') {
        delete newErrors.morningShift;
        delete newErrors.shifts;
      }
      if (field === 'afternoonStart' || field === 'afternoonEnd') {
        delete newErrors.afternoonShift;
        delete newErrors.shifts;
      }
      if (field === 'nightStart' || field === 'nightEnd') {
        delete newErrors.nightShift;
        delete newErrors.shifts;
      }
      return newErrors;
    });

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form using centralized validation
    const validation = validateScheduleForm(formData);
    
    if (!validation.isValid) {
      setLocalErrors(validation.errors);
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields correctly.',
        variant: 'destructive',
      });
      return;
    }

    // Clear local errors if validation passed
    setLocalErrors({});
    onSubmit(formData);
  };

  // Merge local errors with server errors
  const allErrors = { ...localErrors, ...errors };

  const isCreateMode = mode === 'create';
  const modalTitle = isCreateMode ? 'Add New Schedule' : 'Edit Schedule';
  const modalDescription = isCreateMode
    ? 'Configure shift schedules and assign employees.'
    : 'Update shift schedule configuration below.';
  const submitButtonText = isCreateMode
    ? (loading ? 'Creating...' : 'Create Schedule')
    : (loading ? 'Updating...' : 'Update Schedule');

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
            {/* Schedule Name */}
            <div className="space-y-2">
              <Label htmlFor="schedule-name">Schedule Name</Label>
              <Input
                id="schedule-name"
                type="text"
                disabled={loading}
                value={formData.scheduleName}
                onChange={(e) => handleInputChange('scheduleName', e.target.value)}
                placeholder="e.g., Regular Day Shift, Night Shift, etc."
              />
              {allErrors.scheduleName && (
                <p className="text-red-500 text-xs">{allErrors.scheduleName}</p>
              )}
            </div>

            {/* Branch (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="branch-name">Branch</Label>
              <Input
                id="branch-name"
                type="text"
                value={currentBranchName}
                readOnly
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                This schedule will be created for the currently selected branch
              </p>
              {allErrors.branchId && (
                <p className="text-red-500 text-xs">{allErrors.branchId}</p>
              )}
            </div>

            {/* Shift Schedule Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Shift Schedule</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  At least one shift (Morning, Afternoon, or Night) is required
                </p>
                {allErrors.shifts && (
                  <p className="text-red-500 text-xs mt-1">{allErrors.shifts}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* Morning Shift */}
                <div className="space-y-2">
                  <Label htmlFor="morning-start">Morning Shift Start</Label>
                  <TimePicker
                    id="morning-start"
                    disabled={loading}
                    value={formData.morningStart}
                    onChange={(value) => handleInputChange('morningStart', value)}
                  />
                  {allErrors.morningStart && (
                    <p className="text-red-500 text-xs">{allErrors.morningStart}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="morning-end">Morning Shift End</Label>
                  <TimePicker
                    id="morning-end"
                    disabled={loading}
                    value={formData.morningEnd}
                    onChange={(value) => handleInputChange('morningEnd', value)}
                  />
                  {allErrors.morningEnd && (
                    <p className="text-red-500 text-xs">{allErrors.morningEnd}</p>
                  )}
                  {allErrors.morningShift && (
                    <p className="text-red-500 text-xs">{allErrors.morningShift}</p>
                  )}
                </div>

                {/* Afternoon Shift */}
                <div className="space-y-2">
                  <Label htmlFor="afternoon-start">Afternoon Shift Start</Label>
                  <TimePicker
                    id="afternoon-start"
                    disabled={loading}
                    value={formData.afternoonStart}
                    onChange={(value) => handleInputChange('afternoonStart', value)}
                  />
                  {allErrors.afternoonStart && (
                    <p className="text-red-500 text-xs">{allErrors.afternoonStart}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="afternoon-end">Afternoon Shift End</Label>
                  <TimePicker
                    id="afternoon-end"
                    disabled={loading}
                    value={formData.afternoonEnd}
                    onChange={(value) => handleInputChange('afternoonEnd', value)}
                  />
                  {allErrors.afternoonEnd && (
                    <p className="text-red-500 text-xs">{allErrors.afternoonEnd}</p>
                  )}
                  {allErrors.afternoonShift && (
                    <p className="text-red-500 text-xs">{allErrors.afternoonShift}</p>
                  )}
                </div>

                {/* Night Shift */}
                <div className="space-y-2">
                  <Label htmlFor="night-start">Night Shift Start</Label>
                  <TimePicker
                    id="night-start"
                    disabled={loading}
                    value={formData.nightStart}
                    onChange={(value) => handleInputChange('nightStart', value)}
                  />
                  {allErrors.nightStart && (
                    <p className="text-red-500 text-xs">{allErrors.nightStart}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="night-end">Night Shift End</Label>
                  <TimePicker
                    id="night-end"
                    disabled={loading}
                    value={formData.nightEnd}
                    onChange={(value) => handleInputChange('nightEnd', value)}
                  />
                  {allErrors.nightEnd && (
                    <p className="text-red-500 text-xs">{allErrors.nightEnd}</p>
                  )}
                  {allErrors.nightShift && (
                    <p className="text-red-500 text-xs">{allErrors.nightShift}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Other Settings Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Schedule Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grace-period">Grace Period (Minutes)</Label>
                  <Input
                    id="grace-period"
                    type="number"
                    disabled={loading}
                    value={formData.gracePeriod}
                    onChange={(e) => handleInputChange('gracePeriod', e.target.value)}
                    placeholder="15"
                  />
                  {allErrors.gracePeriod && (
                    <p className="text-red-500 text-xs">{allErrors.gracePeriod}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="overtime-threshold">Overtime Threshold (Minutes)</Label>
                  <Input
                    id="overtime-threshold"
                    type="number"
                    disabled={loading}
                    value={formData.overtimeThreshold}
                    onChange={(e) => handleInputChange('overtimeThreshold', e.target.value)}
                    placeholder="30"
                  />
                  {allErrors.overtimeThreshold && (
                    <p className="text-red-500 text-xs">{allErrors.overtimeThreshold}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Employee Selection */}
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
                  options={employees.map((employee) => ({
                    value: employee.id.toString(),
                    label: getEmployeeDisplayName(employee),
                  }))}
                  value={formData.selectedEmployees}
                  onChange={(value) => handleInputChange('selectedEmployees', value)}
                  searchPlaceholder="Search employees..."
                  disabled={loading}
                  maxHeight="200px"
                  emptyLabel="Click to add employees"
                />
              )}
              {allErrors.selectedEmployees && (
                <p className="text-red-500 text-xs">{allErrors.selectedEmployees}</p>
              )}
            </div>

            {allErrors.general && (
              <p className="text-red-500 text-xs">{allErrors.general}</p>
            )}
          </form>
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose} 
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={loading}
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700 min-w-[120px]"
          >
            {submitButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

