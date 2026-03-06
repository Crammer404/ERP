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

const hasCompleteShiftRange = (start?: string, end?: string): boolean => {
  return Boolean(start?.trim() && end?.trim());
};

const getShiftSelectionFromFormData = (data: ScheduleFormData): string => {
  const hasMorning = hasCompleteShiftRange(data.morningStart, data.morningEnd);
  const hasAfternoon = hasCompleteShiftRange(data.afternoonStart, data.afternoonEnd);
  const hasNight = hasCompleteShiftRange(data.nightStart, data.nightEnd);

  const activeShiftCount = [hasMorning, hasAfternoon, hasNight].filter(Boolean).length;

  // Any multi-shift setup is treated as Mixed Shift.
  if (activeShiftCount > 1) return 'shift3';
  if (hasNight) return 'shift2';
  if (hasMorning) return 'shift1';

  // Afternoon-only can only be edited via the mixed form layout.
  if (hasAfternoon) return 'shift3';

  return '';
};

// Get schedule name based on selected shift
const getScheduleName = (shift: string): string => {
  const shiftMap: Record<string, string> = {
    'shift1': 'Shift 1',
    'shift2': 'Shift 2',
    'shift3': 'Shift 3',
  };
  return shiftMap[shift] || '';
};

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
  const [selectedShift, setSelectedShift] = useState<string>('');
  const [showOverlapModal, setShowOverlapModal] = useState(false);
  const [overlapErrorMessage, setOverlapErrorMessage] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setFormData({ ...initialData });
        setSelectedShift(getShiftSelectionFromFormData(initialData));
      } else if (mode === 'create') {
        setFormData(getDefaultFormData());
        setSelectedShift('');
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
      setSelectedShift('');
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
        delete newErrors.shiftOverlap;
      }
      if (field === 'afternoonStart' || field === 'afternoonEnd') {
        delete newErrors.afternoonShift;
        delete newErrors.shifts;
        delete newErrors.shiftOverlap;
      }
      if (field === 'nightStart' || field === 'nightEnd') {
        delete newErrors.nightShift;
        delete newErrors.shifts;
        delete newErrors.shiftOverlap;
      }
      return newErrors;
    });

    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      
      // Check for overlaps after update (only for shift 3 - Mix)
      if (selectedShift === 'shift3') {
        // Use setTimeout to check after state update
        setTimeout(() => {
          const overlapError = validateShiftOverlaps(updated);
          if (overlapError) {
            setLocalErrors(prevErrors => ({
              ...prevErrors,
              shiftOverlap: overlapError
            }));
          } else {
            setLocalErrors(prevErrors => {
              const newErrors = { ...prevErrors };
              delete newErrors.shiftOverlap;
              return newErrors;
            });
          }
        }, 0);
      }
      
      return updated;
    });
  };

  // Convert time string (HH:MM or HH:MM:SS) to minutes for comparison
  const timeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0] || '0', 10);
    const minutes = parseInt(parts[1] || '0', 10);
    return hours * 60 + minutes;
  };

  // Check if two time ranges overlap
  const checkTimeOverlap = (
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean => {
    if (!start1 || !end1 || !start2 || !end2) return false;
    
    const start1Min = timeToMinutes(start1);
    const end1Min = timeToMinutes(end1);
    const start2Min = timeToMinutes(start2);
    const end2Min = timeToMinutes(end2);

    // Handle overnight shifts (end time is next day)
    const end1Final = end1Min < start1Min ? end1Min + 24 * 60 : end1Min;
    const end2Final = end2Min < start2Min ? end2Min + 24 * 60 : end2Min;

    // Check for overlap
    return !(end1Final <= start2Min || end2Final <= start1Min);
  };

  // Validate shift overlaps for Shift 3 (Mix)
  const validateShiftOverlaps = (data: ScheduleFormData = formData): string | null => {
    if (selectedShift === 'shift3') {
      // Shift 3: Mix - Check all combinations
      // Check morning vs afternoon
      if (checkTimeOverlap(
        data.morningStart,
        data.morningEnd,
        data.afternoonStart,
        data.afternoonEnd
      )) {
        return 'Morning and Afternoon shifts overlap. Please use Shift 1 (Day Shift) or Shift 2 (Night Shift) instead.';
      }
      // Check morning vs night
      if (checkTimeOverlap(
        data.morningStart,
        data.morningEnd,
        data.nightStart,
        data.nightEnd
      )) {
        return 'Morning and Night shifts overlap. Please use Shift 1 (Day Shift) or Shift 2 (Night Shift) instead.';
      }
      // Check afternoon vs night
      if (checkTimeOverlap(
        data.afternoonStart,
        data.afternoonEnd,
        data.nightStart,
        data.nightEnd
      )) {
        return 'Afternoon and Night shifts overlap. Please use Shift 1 (Day Shift) or Shift 2 (Night Shift) instead.';
      }
    }
    return null;
  };

  const handleShiftChange = (shift: string) => {
    setSelectedShift(shift);
    setLocalErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.shiftOverlap;
      return newErrors;
    });
    // Close overlap modal if open
    setShowOverlapModal(false);
    setOverlapErrorMessage('');

    // Clear shift times based on selected shift
    if (shift === 'shift1') {
      // Shift 1: Day Shift - Only morning, clear afternoon and night
      handleInputChange('afternoonStart', '');
      handleInputChange('afternoonEnd', '');
      handleInputChange('nightStart', '');
      handleInputChange('nightEnd', '');
    } else if (shift === 'shift2') {
      // Shift 2: Night Shift - Only night, clear morning and afternoon
      handleInputChange('morningStart', '');
      handleInputChange('morningEnd', '');
      handleInputChange('afternoonStart', '');
      handleInputChange('afternoonEnd', '');
    }
    // Shift 3: Mix - keeps all shifts (morning, afternoon, night)
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for shift overlaps first (only for Shift 3 - Mix)
    if (selectedShift === 'shift3') {
      const overlapError = validateShiftOverlaps();
      if (overlapError) {
        setLocalErrors(prev => ({
          ...prev,
          shiftOverlap: overlapError
        }));
        setOverlapErrorMessage(overlapError);
        setShowOverlapModal(true);
        return;
      }
    }
    
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

            {/* Schedule Name - Auto-generated in create mode, editable in both modes */}
            <div className="space-y-2">
              <Label htmlFor="schedule-name">Schedule Name</Label>
              <Input
                id="schedule-name"
                type="text"
                disabled={loading}
                value={formData.scheduleName}
                onChange={(e) => handleInputChange('scheduleName', e.target.value)}
                placeholder="e.g., Shift 1, Shift 2, etc."
              />
              {allErrors.scheduleName && (
                <p className="text-red-500 text-xs">{allErrors.scheduleName}</p>
              )}
            </div>

            {/* Shift Schedule Section */}
            <div className="space-y-4">
              {/* Shift Selection */}
              <div className="space-y-2">
                <Label htmlFor="schedule-shift">Shift Schedule</Label>
                <Select
                  value={selectedShift}
                  onValueChange={handleShiftChange}
                  disabled={loading}
                >
                  <SelectTrigger id="schedule-shift">
                    <SelectValue placeholder="Select a shift schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shift1">Day Shift</SelectItem>
                    <SelectItem value="shift2">Night Shift</SelectItem>
                    <SelectItem value="shift3">Mixed Shift</SelectItem>
                  </SelectContent>
                </Select>
                {allErrors.shifts && (
                  <p className="text-red-500 text-xs">{allErrors.shifts}</p>
                )}
                {allErrors.shiftOverlap && (
                  <p className="text-red-500 text-xs">{allErrors.shiftOverlap}</p>
                )}
              </div>

              {/* Shift Time Pickers - Show based on selected shift */}
              <div className="space-y-4">
                {/* Morning Shift - Shift 1, 3 */}
                {(selectedShift === 'shift1' || selectedShift === 'shift3') && (
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                    {selectedShift !== 'shift1' && (
                      <h4 className="text-sm font-semibold text-foreground">Morning Shift</h4>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="morning-start">Start Time</Label>
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
                        <Label htmlFor="morning-end">End Time</Label>
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
                    </div>
                  </div>
                )}

                {/* Afternoon Shift - Shift 3 only */}
                {selectedShift === 'shift3' && (
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                    <h4 className="text-sm font-semibold text-foreground">Afternoon Shift</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="afternoon-start">Start Time</Label>
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
                        <Label htmlFor="afternoon-end">End Time</Label>
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
                    </div>
                  </div>
                )}

                {/* Night Shift - Shift 2, 3 */}
                {(selectedShift === 'shift2' || selectedShift === 'shift3') && (
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                    {selectedShift !== 'shift2' && (
                      <h4 className="text-sm font-semibold text-foreground">Night Shift</h4>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="night-start">Start Time</Label>
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
                        <Label htmlFor="night-end">End Time</Label>
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
                )}

                {/* Show message if no shift is selected */}
                {!selectedShift && (
                  <div className="p-4 border border-dashed rounded-lg bg-muted/20 text-center">
                    <p className="text-sm text-muted-foreground">
                      Please select a shift schedule above to configure shift times.
                    </p>
                  </div>
                )}

                {/* Generic schedule settings (applies to all shifts) */}
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
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

      {/* Overlap Error Modal */}
      <Dialog open={showOverlapModal} onOpenChange={setShowOverlapModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-red-600 dark:text-red-400">
              Schedule Overlap Detected
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-2">
              {overlapErrorMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setShowOverlapModal(false);
                setOverlapErrorMessage('');
              }}
            >
              Close
            </Button>
            <Button 
              type="button"
              onClick={() => {
                setShowOverlapModal(false);
                setOverlapErrorMessage('');
              }}
              className="bg-primary hover:bg-primary/90"
            >
              Understood
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
