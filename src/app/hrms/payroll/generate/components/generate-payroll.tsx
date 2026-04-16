'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { FileText, Search } from 'lucide-react';
import { type CheckedState } from '@radix-ui/react-checkbox';
import { userService, UserEntity } from '@/app/management/users/services/userService';
import { positionService, type PayrollPosition } from '@/app/hrms/payroll/positions/services/position-service';
import { Loader } from '@/components/ui/loader';
import { getOvertimeRequests, getTimeClockLogs } from '@/services/hrms/dtr';
import { ROUTES } from '@/config/api.config';

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
  includeCola: boolean;
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

// Use local timezone when converting picked dates to YYYY-MM-DD.
// `toISOString()` converts to UTC and can shift the calendar day by -1/+1 depending on timezone.
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const GeneratePayrollDialog = ({
  onGenerate,
  users,
  payrollTypes = DEFAULT_PAYROLL_TYPES,
  triggerLabel = 'Generate Payroll',
}: GeneratePayrollDialogProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const defaultPayrollType = useMemo(
    () => payrollTypes[0] ?? 'Monthly',
    [payrollTypes]
  );

  const [payrollType, setPayrollType] = useState(defaultPayrollType);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [includeStatutory, setIncludeStatutory] = useState(true);
  const [includeCola, setIncludeCola] = useState(true);
  const [availableUsers, setAvailableUsers] = useState<GeneratePayrollUser[]>(users ?? []);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPendingOvertimeDialog, setShowPendingOvertimeDialog] = useState(false);
  const [showPendingEarlyOutDialog, setShowPendingEarlyOutDialog] = useState(false);

  useEffect(() => {
    if (users) {
      setAvailableUsers(users);
    }
  }, [users]);

  useEffect(() => {
    if (!open) return;
    if (users) return;

    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        setUsersError(null);

        // Fetch ALL employees for the active branch.
        // The backend users listing endpoint is paginated, so grabbing only page 1/per_page=200 truncates the list.
        const PER_PAGE = 200;
        const MAX_PAGES = 50; // safety guard

        let page = 1;
        const fetchedUsers: UserEntity[] = [];

        while (page <= MAX_PAGES) {
          const { users: pageUsers, pagination } = await userService.getAll(page, PER_PAGE);
          fetchedUsers.push(...(pageUsers || []));

          const hasMore = Boolean(pagination?.has_more_pages);
          const lastPage = pagination?.last_page ?? 1;

          if (hasMore) {
            page += 1;
            continue;
          }

          // If backend pagination metadata is present, respect it.
          if (Number.isFinite(lastPage) && page < lastPage) {
            page += 1;
            continue;
          }

          // Fallback: if we received a full page, try one more.
          if ((pageUsers || []).length === PER_PAGE) {
            page += 1;
            continue;
          }

          break;
        }

        const positions: PayrollPosition[] = await positionService.getAll();
        const positionsById = positions.reduce<Record<number, string>>((acc, position) => {
          acc[position.id] = position.name;
          return acc;
        }, {});
        const mapped: GeneratePayrollUser[] = (fetchedUsers || []).map(
          (user: UserEntity) => {
            const firstName = user.user_info?.first_name ?? '';
            const lastName = user.user_info?.last_name ?? '';
            const displayName =
              [firstName, lastName].filter(Boolean).join(' ').trim() ||
              user.name ||
              user.email;

            const positionId = Number(user.user_info?.payroll_positions_id);
            const positionName =
              Number.isFinite(positionId) && positionId > 0
                ? positionsById[positionId] || ''
                : '';

            return {
              id: user.id,
              name: displayName,
              role: positionName || undefined,
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

  const filteredUsers = useMemo(() => {
    const q = employeeSearch.trim().toLowerCase();
    if (!q) return availableUsers;

    return availableUsers.filter((u) => {
      const idStr = String(u.id);
      return (
        idStr.includes(q) ||
        u.name.toLowerCase().includes(q) ||
        (u.role ?? '').toLowerCase().includes(q)
      );
    });
  }, [availableUsers, employeeSearch]);

  const visibleUserIds = useMemo(() => filteredUsers.map((u) => u.id), [filteredUsers]);
  const visibleSelectedCount = useMemo(
    () => visibleUserIds.filter((id) => selectedUserIds.includes(id)).length,
    [visibleUserIds, selectedUserIds]
  );

  const selectAllState: CheckedState =
    visibleUserIds.length === 0
      ? false
      : visibleSelectedCount === 0
        ? false
        : visibleSelectedCount === visibleUserIds.length
          ? true
          : 'indeterminate';

  const handleToggleAll = (checked: boolean) => {
    if (visibleUserIds.length === 0) return;

    if (checked) {
      // Add all visible employees (respect any existing selections outside the filter).
      setSelectedUserIds((prev) => {
        const next = new Set(prev);
        visibleUserIds.forEach((id) => next.add(id));
        return Array.from(next);
      });
    } else {
      // Remove only the visible employees.
      const visibleSet = new Set(visibleUserIds);
      setSelectedUserIds((prev) => prev.filter((id) => !visibleSet.has(id)));
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
    setIncludeCola(true);
    setEmployeeSearch('');
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
          includeCola,
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
          includeCola,
        });
      }
      return; // Don't close if validation fails
    }

    const hasNoPendingOvertime = await (async () => {
      if (!dateRange?.from || !dateRange?.to || selectedUserIds.length === 0) {
        return true;
      }

      try {
        const params: {
          status: string;
          start_date: string;
          end_date: string;
        } = {
          status: 'pending',
          start_date: formatLocalDate(dateRange.from),
          end_date: formatLocalDate(dateRange.to),
        };

        const pendingRecords = await getOvertimeRequests(params);
        const selectedUserSet = new Set(selectedUserIds);
        const blocking = pendingRecords.filter((record) =>
          selectedUserSet.has(record.employee_id)
        );

        if (blocking.length > 0) {
          setShowPendingOvertimeDialog(true);
          return false;
        }

        return true;
      } catch (error) {
        console.error('Failed to check pending overtime before payroll generation:', error);
        return true;
      }
    })();

    if (!hasNoPendingOvertime) {
      return;
    }

    const hasNoPendingEarlyOut = await (async () => {
      if (!dateRange?.from || !dateRange?.to || selectedUserIds.length === 0) {
        return true;
      }

      try {
        const selectedUserSet = new Set(selectedUserIds);
        const startDate = formatLocalDate(dateRange.from);
        const endDate = formatLocalDate(dateRange.to);
        const perPage = 100;
        let page = 1;
        let hasNext = true;

        while (hasNext) {
          const response: any = await getTimeClockLogs({
            page,
            per_page: perPage,
            start_date: startDate,
            end_date: endDate,
            early_out: true,
          });

          const records: any[] = Array.isArray(response?.data)
            ? response.data
            : (Array.isArray(response) ? response : []);

          const hasBlocking = records.some((record: any) =>
            String(record?.status || '').toLowerCase() === 'pending' &&
            selectedUserSet.has(Number(record?.user_id || 0))
          );

          if (hasBlocking) {
            setShowPendingEarlyOutDialog(true);
            return false;
          }

          const lastPage = Number(response?.meta?.last_page || 1);
          const currentPage = Number(response?.meta?.current_page || page);
          hasNext = currentPage < lastPage;
          page += 1;
        }

        return true;
      } catch (error) {
        console.error('Failed to check pending early-out before payroll generation:', error);
        return true;
      }
    })();

    if (!hasNoPendingEarlyOut) {
      return;
    }

    try {
      setIsGenerating(true);
      if (onGenerate) {
        await onGenerate({
          payrollType,
          payrollRange: dateRange,
          userIds: selectedUserIds,
          includeStatutoryDeductions: includeStatutory,
          includeCola,
        });
        handleClose();
      }
    } catch (error: any) {
      const errorMessage = String(
        error?.response?.data?.message ||
        error?.message ||
        ''
      ).toLowerCase();

      if (errorMessage.includes('pending early clock-out requests')) {
        setShowPendingEarlyOutDialog(true);
        return;
      }

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

                <div className="space-y-2 border rounded-md p-4">
                  <Label>COLA Allowance</Label>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">
                        Include COLA in this payroll run
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Adds per-employee COLA to earnings and Gross.
                      </p>
                    </div>
                    <Switch checked={includeCola} onCheckedChange={setIncludeCola} />
                  </div>
                </div>
              </div>

              {/* Right column - employee selection */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <Label>Select Employees</Label>
                    <p className="text-xs text-muted-foreground">
                      {filteredUsers.length} shown of {availableUsers.length} • {selectedUserIds.length} selected
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0 pt-1">
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

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    placeholder="Search employees..."
                    className="pl-10"
                  />
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
                    ) : filteredUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No employees match your search.
                      </p>
                    ) : (
                      filteredUsers.map((user) => {
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

      <Dialog open={showPendingOvertimeDialog} onOpenChange={setShowPendingOvertimeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pending Overtime Requests</DialogTitle>
            <DialogDescription>
              There are pending overtime requests for the selected employees in this date range.
              Please approve or reject all overtime before generating payroll.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                setShowPendingOvertimeDialog(false);
                setOpen(false);
                router.push(ROUTES.HRMS.DTR.OVERTIME);
              }}
            >
              Go to Overtime
          </Button>
        </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPendingEarlyOutDialog} onOpenChange={setShowPendingEarlyOutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pending Early Time-Out Requests</DialogTitle>
            <DialogDescription>
              There are pending early time-out requests for the selected employees in this date range.
              Please approve or reject all early time-out requests before generating payroll.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                setShowPendingEarlyOutDialog(false);
                setOpen(false);
                router.push(ROUTES.HRMS.DTR.TIME_CLOCK);
              }}
            >
              Go to Time Clock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GeneratePayrollDialog;

