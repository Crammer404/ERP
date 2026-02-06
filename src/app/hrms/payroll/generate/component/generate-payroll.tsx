'use client';

import { useEffect, useMemo, useState } from 'react';
import { DateRange } from 'react-day-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { FileText } from 'lucide-react';
import { type CheckedState } from '@radix-ui/react-checkbox';
import { userService, UserEntity } from '@/app/management/users/services/userService';
import { Loader } from '@/components/ui/loader';

export interface GeneratePayrollUser {
  id: number;
  name: string;
  role?: string;
}

export interface GeneratePayrollPayload {
  payrollType: string;
  payrollRange?: DateRange;
  userIds: number[];
  includeStatutoryDeductions: boolean;
}

interface GeneratePayrollDialogProps {
  onGenerate?: (payload: GeneratePayrollPayload) => Promise<void> | void;
  users?: GeneratePayrollUser[]; // optional static users if provided
  payrollTypes?: string[];
  triggerLabel?: string;
}

const DEFAULT_PAYROLL_TYPES = ['Semi-Monthly', 'Monthly', 'Weekly'];

const formatRange = (range?: DateRange) => {
  if (!range?.from || !range?.to) return '';

  return `${range.from.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })} - ${range.to.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
};

const GeneratePayrollDialog = ({
  onGenerate,
  users,
  payrollTypes = DEFAULT_PAYROLL_TYPES,
  triggerLabel = 'Generate Payroll',
}: GeneratePayrollDialogProps) => {
  const [open, setOpen] = useState(false);
  const defaultPayrollType = useMemo(
    () => payrollTypes[0] ?? 'Monthly',
    [payrollTypes]
  );

  const [payrollType, setPayrollType] = useState(defaultPayrollType);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [includeStatutory, setIncludeStatutory] = useState(true);
  const [availableUsers, setAvailableUsers] = useState<GeneratePayrollUser[]>(users ?? []);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (users) {
      setAvailableUsers(users);
    }
  }, [users]);

  useEffect(() => {
    if (!open) return;
    if (users) return; // external users provided

    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        setUsersError(null);
        // Fetch first 200 users for the branch (API filters by branch_context)
        const { users: fetchedUsers } = await userService.getAll(1, 200);
        const mapped: GeneratePayrollUser[] = (fetchedUsers || []).map(
          (user: UserEntity) => {
            const firstName = user.user_info?.first_name ?? '';
            const lastName = user.user_info?.last_name ?? '';
            const displayName =
              [firstName, lastName].filter(Boolean).join(' ').trim() ||
              user.name ||
              user.email;

            let roleDisplay = '';
            if (typeof user.role === 'object' && user.role) {
              roleDisplay = (user.role as any).name ?? '';
            } else if (typeof user.role === 'string') {
              roleDisplay = user.role;
            }

            return {
              id: user.id,
              name: displayName,
              role: roleDisplay || undefined,
            };
          }
        );
        setAvailableUsers(mapped);
      } catch (error: any) {
        console.error('Failed to load users for payroll dialog:', error);
        setUsersError(
          error?.message || 'Failed to load users. Please try again.'
        );
        setAvailableUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [open, users]);

  // Ensure selected users remain valid when list changes
  useEffect(() => {
    setSelectedUserIds((prev) =>
      prev.filter((id) => availableUsers.some((user) => user.id === id))
    );
  }, [availableUsers]);

  const allSelected = useMemo(() => {
    return (
      selectedUserIds.length === availableUsers.length &&
      availableUsers.length > 0
    );
  }, [selectedUserIds, availableUsers.length]);

  const selectAllState: CheckedState = allSelected
    ? true
    : selectedUserIds.length === 0
    ? false
    : 'indeterminate';

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(availableUsers.map((u) => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleToggleUser = (userId: number, checked: boolean) => {
    setSelectedUserIds((prev) => {
      if (checked) {
        return [...prev, userId];
      }
      return prev.filter((id) => id !== userId);
    });
  };

  const resetForm = () => {
    setPayrollType(defaultPayrollType);
    setDateRange(undefined);
    setSelectedUserIds([]);
    setIncludeStatutory(true);
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    } else {
      setPayrollType(defaultPayrollType);
    }
  }, [open, defaultPayrollType]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleConfirm = async () => {
    // Validate before submitting
    if (!dateRange?.from || !dateRange?.to) {
      // Let parent handle validation error display
      if (onGenerate) {
        await onGenerate({
          payrollType,
          payrollRange: dateRange,
          userIds: selectedUserIds,
          includeStatutoryDeductions: includeStatutory,
        });
      }
      return; // Don't close if validation fails
    }

    if (selectedUserIds.length === 0) {
      // Let parent handle validation error display
      if (onGenerate) {
        await onGenerate({
          payrollType,
          payrollRange: dateRange,
          userIds: selectedUserIds,
          includeStatutoryDeductions: includeStatutory,
        });
      }
      return; // Don't close if validation fails
    }

    try {
      setIsGenerating(true);
      
      // Call the parent handler - it will handle the async operation
      if (onGenerate) {
        await onGenerate({
          payrollType,
          payrollRange: dateRange,
          userIds: selectedUserIds,
          includeStatutoryDeductions: includeStatutory,
        });
        
        // Only close if successful (no error thrown)
        handleClose();
      }
    } catch (error) {
      // Error is handled by parent, but we keep dialog open so user can see error
      console.error('Error generating payroll:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearRange = () => {
    setDateRange(undefined);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <FileText className="h-4 w-4 mr-2" />
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full max-w-4xl">
        <DialogHeader>
          <DialogTitle>Payroll Details</DialogTitle>
          <DialogDescription>
            Configure the payroll coverage, employees, and deductions for this
            run.
          </DialogDescription>
        </DialogHeader>

          <div className="py-2 space-y-6">
            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              {/* Left column - payroll configuration */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Select Payroll Type</Label>
                  <Select value={payrollType} onValueChange={setPayrollType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payroll type" />
                    </SelectTrigger>
                    <SelectContent>
                      {payrollTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Payroll Range</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <DateRangePicker
                      date={dateRange}
                      onDateChange={setDateRange}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleClearRange}
                      className="sm:w-24"
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 border rounded-md p-4">
                  <Label>Statutory Deductions</Label>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">
                        Include Statutory Deductions (SSS, PhilHealth, Pag-IBIG)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Toggle to include government-mandated deductions in this payroll run.
                      </p>
                    </div>
                    <Switch
                      checked={includeStatutory}
                      onCheckedChange={setIncludeStatutory}
                    />
                  </div>
                </div>
              </div>

              {/* Right column - employee selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Select Users</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all-users"
                      checked={selectAllState}
                      onCheckedChange={(checked) =>
                        handleToggleAll(checked === true)
                      }
                    />
                    <Label htmlFor="select-all-users" className="text-sm">
                      Select All
                    </Label>
                  </div>
                </div>

                <ScrollArea className="h-72 rounded-md border p-4">
                  <div className="space-y-3">
                    {loadingUsers ? (
                      <div className="flex justify-center py-4">
                        <Loader size="sm" />
                      </div>
                    ) : usersError ? (
                      <p className="text-sm text-destructive">{usersError}</p>
                    ) : availableUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No users found for this branch.
                      </p>
                    ) : (
                      availableUsers.map((user) => {
                        const checked = selectedUserIds.includes(user.id);
                        return (
                          <div
                            key={user.id}
                            className="flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                id={`user-${user.id}`}
                                checked={checked}
                                onCheckedChange={(isChecked) =>
                                  handleToggleUser(user.id, isChecked === true)
                                }
                              />
                              <div className="space-y-0.5">
                                <Label htmlFor={`user-${user.id}`}>
                                  {user.id} - {user.name}
                                </Label>
                                {user.role && (
                                  <p className="text-xs text-muted-foreground">
                                    {user.role}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleConfirm}
            disabled={isGenerating || !dateRange?.from || !dateRange?.to || selectedUserIds.length === 0}
          >
            {isGenerating ? 'Generating...' : 'Confirm'}
          </Button>
        </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GeneratePayrollDialog;

