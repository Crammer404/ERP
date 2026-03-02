'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Clock, Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { TimePicker } from '@/components/ui/time-picker';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  createManualLog,
  updateManualLog,
  ManualDtrPayload,
  getUserScheduleDetails,
  UserScheduleDetails,
} from '@/services/hrms/dtr';
import {
  managementService,
  Employee,
} from '@/services/management/managementService';

export interface ManualLogData {
  id: number;
  dateRaw: string;
  employee: string;
  branch: string;
  scheduleName: string;
  shift: string;
  clockInRaw: string | null;
  clockOutRaw: string | null;
}

interface ManualLogModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  log: ManualLogData | null;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}

export function ManualLogModal({
  isOpen,
  mode,
  log,
  onClose,
  onSuccess,
}: ManualLogModalProps) {
  const { toast } = useToast();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [savingLog, setSavingLog] = useState(false);
  const [scheduleDetails, setScheduleDetails] = useState<UserScheduleDetails | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const [logFormData, setLogFormData] = useState({
    userId: '',
    date: new Date(),
    clockIn: '',
    clockOut: '',
  });

  const [logFormErrors, setLogFormErrors] = useState<Record<string, string>>(
    {},
  );

  // Helper function to format 24-hour time to 12-hour format (e.g., "09:00:00" -> "9:00 AM")
  const formatTime12Hour = (time24: string | null): string => {
    if (!time24) return '';
    try {
      const [hours, minutes] = time24.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
    } catch {
      return '';
    }
  };

  // Helper function to convert 12-hour format to 24-hour format (e.g., "9:00 AM" -> "09:00")
  const convert12To24Hour = (time12: string): string => {
    if (!time12) return '';
    try {
      const [timePart, period] = time12.split(' ');
      const [hours, minutes] = timePart.split(':').map(Number);
      let hours24 = hours;
      if (period?.toUpperCase() === 'PM' && hours !== 12) {
        hours24 = hours + 12;
      } else if (period?.toUpperCase() === 'AM' && hours === 12) {
        hours24 = 0;
      }
      return `${String(hours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    } catch {
      return '';
    }
  };

  // Helper function to get shift display text with time range
  const getShiftDisplayText = (shiftName: string | null | undefined, scheduleDetails: UserScheduleDetails | null): string => {
    if (!scheduleDetails || !shiftName) return shiftName || '-';
    
    const shiftLower = shiftName.toLowerCase();
    let shiftTime: { start: string | null; end: string | null } | null = null;
    
    if (shiftLower.includes('morning')) {
      shiftTime = scheduleDetails.shifts.morning;
    } else if (shiftLower.includes('afternoon')) {
      shiftTime = scheduleDetails.shifts.afternoon;
    } else if (shiftLower.includes('night')) {
      shiftTime = scheduleDetails.shifts.night;
    }
    
    if (!shiftTime || !shiftTime.start || !shiftTime.end) {
      return shiftName;
    }
    
    const startFormatted = formatTime12Hour(shiftTime.start);
    const endFormatted = formatTime12Hour(shiftTime.end);
    
    return `${shiftName} (${startFormatted} - ${endFormatted})`;
  };

  // Load employees when opening in add mode
  useEffect(() => {
    if (!isOpen || mode !== 'add') return;

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

    fetchEmployees();
  }, [isOpen, mode]);

  // Initialize form when modal opens / mode or log changes
  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'add') {
      setLogFormData({
        userId: '',
        date: new Date(),
        clockIn: '',
        clockOut: '',
      });
      setLogFormErrors({});
      setScheduleDetails(null);
      setScheduleError(null);
      return;
    }

    if (mode === 'edit' && log) {
      // Convert ISO time to 12-hour format for TimePicker
      const getTimeFromISO = (isoString: string | null): string => {
        if (!isoString) return '';
        try {
          const date = new Date(isoString);
          if (Number.isNaN(date.getTime())) return '';
          const hours = date.getHours();
          const minutes = date.getMinutes();
          const period = hours >= 12 ? 'PM' : 'AM';
          const hours12 = hours % 12 || 12;
          return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
        } catch {
          return '';
        }
      };

      // Parse date string to Date object
      const dateObj = log.dateRaw ? new Date(log.dateRaw) : new Date();
      if (Number.isNaN(dateObj.getTime())) {
        setLogFormData({
          userId: '',
          date: new Date(),
          clockIn: getTimeFromISO(log.clockInRaw),
          clockOut: getTimeFromISO(log.clockOutRaw),
        });
      } else {
        setLogFormData({
          userId: '',
          date: dateObj,
          clockIn: getTimeFromISO(log.clockInRaw),
          clockOut: getTimeFromISO(log.clockOutRaw),
        });
      }
      setLogFormErrors({});
      setScheduleDetails(null);
      setScheduleError(null);
    }
  }, [isOpen, mode, log]);

  const handleLogFormChange = (field: string, value: string | Date) => {
    setLogFormData(prev => ({ ...prev, [field]: value }));
    if (logFormErrors[field]) {
      setLogFormErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }

    // When employee changes in add mode, fetch schedule details
    if (field === 'userId' && mode === 'add' && typeof value === 'string' && value) {
      const id = parseInt(value, 10);
      if (!Number.isNaN(id)) {
        setScheduleError(null);
        loadScheduleDetails(id);
      } else {
        setScheduleError(null);
        setScheduleDetails(null);
      }
    } else if (field === 'userId' && mode === 'add' && !value) {
      // Clear schedule when employee is deselected
      setScheduleError(null);
      setScheduleDetails(null);
    }
  };

  const loadScheduleDetails = async (userId: number) => {
    setScheduleLoading(true);
    setScheduleDetails(null);
    setScheduleError(null);
    try {
      const res = await getUserScheduleDetails(userId);
      if (!res.success || !res.data) {
        const errorMsg = res.message || 'No schedule is assigned to this employee in the current branch.';
        setScheduleError(errorMsg);
        setScheduleDetails(null);
        return;
      }
      setScheduleDetails(res.data);
      setScheduleError(null);
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || error?.message || 'Failed to load schedule.';
      setScheduleError(msg);
      setScheduleDetails(null);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleSubmitLog = async () => {
    const errors: Record<string, string> = {};

    if (mode === 'add' && !logFormData.userId) {
      errors.userId = 'Employee is required';
    }
    if (!logFormData.date || !(logFormData.date instanceof Date) || Number.isNaN(logFormData.date.getTime())) {
      errors.date = 'Date is required';
    }
    if (!logFormData.clockIn) {
      errors.clockIn = 'Clock In time is required';
    }
    if (!logFormData.clockOut) {
      errors.clockOut = 'Clock Out time is required';
    }

    if (Object.keys(errors).length > 0) {
      setLogFormErrors(errors);
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    // Convert date to YYYY-MM-DD format
    const dateStr = format(logFormData.date, 'yyyy-MM-dd');
    
    // Convert 12-hour format to 24-hour format
    const clockIn24 = convert12To24Hour(logFormData.clockIn);
    const clockOut24 = convert12To24Hour(logFormData.clockOut);
    
    // Parse times to compare
    const [clockInHours, clockInMinutes] = clockIn24.split(':').map(Number);
    const [clockOutHours, clockOutMinutes] = clockOut24.split(':').map(Number);
    
    // Determine if clock-out is on the next day
    // If clock-out time is earlier than clock-in time, it's likely the next day
    // (e.g., clock-in 6:00 PM, clock-out 2:00 AM next day)
    const clockInMinutesTotal = clockInHours * 60 + clockInMinutes;
    const clockOutMinutesTotal = clockOutHours * 60 + clockOutMinutes;
    
    let clockOutDate = logFormData.date;
    // If clock-out time is earlier than clock-in time, assume it's next day
    // But also check if it's a reasonable next-day scenario (clock-out < 12 hours from clock-in)
    if (clockOutMinutesTotal < clockInMinutesTotal) {
      const hoursDiff = (clockOutMinutesTotal + (24 * 60) - clockInMinutesTotal) / 60;
      // If the difference suggests next day (less than 24 hours total work time)
      if (hoursDiff < 24) {
        clockOutDate = new Date(logFormData.date);
        clockOutDate.setDate(clockOutDate.getDate() + 1);
      }
    }
    
    const clockInDateTime = `${dateStr}T${clockIn24}:00`;
    const clockOutDateStr = format(clockOutDate, 'yyyy-MM-dd');
    const clockOutDateTime = `${clockOutDateStr}T${clockOut24}:00`;

    setSavingLog(true);
    try {
      if (mode === 'add') {
        const payload: ManualDtrPayload = {
          user_id: parseInt(logFormData.userId, 10),
          date: dateStr,
          clock_in: clockInDateTime,
          clock_out: clockOutDateTime,
        };

        const result = await createManualLog(payload);

        if (result.status === 'error') {
          toast({
            title: 'Error',
            description: result.message || 'Failed to create time log.',
            variant: 'destructive',
          });
          return;
        }

        toast({
          title: 'Success',
          description: result.message || 'Time log created successfully.',
          variant: 'default',
        });
      } else {
        if (!log) return;

        const result = await updateManualLog(log.id, {
          clock_in: clockInDateTime,
          clock_out: clockOutDateTime,
        });

        if (result.status === 'error') {
          toast({
            title: 'Error',
            description: result.message || 'Failed to update time log.',
            variant: 'destructive',
          });
          return;
        }

        toast({
          title: 'Success',
          description: result.message || 'Time log updated successfully.',
          variant: 'default',
        });
      }

      await onSuccess();
      onClose();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || error?.message || 'An error occurred';
      const statusCode = error?.response?.status || error?.status || 500;

      if (statusCode === 403) {
        toast({
          title: 'Unauthorized',
          description: 'You are not authorized to modify time logs manually.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setSavingLog(false);
    }
  };

  const handleClose = () => {
    if (savingLog) return;
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !savingLog && !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add Manual Time Log' : 'Edit Time Log'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? 'Create a new time clock log entry manually.'
              : 'Update the clock in and clock out times. Other fields will be automatically recalculated.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Employee Selection - same field for add & edit, disabled in edit */}
          <div className="space-y-2">
            <Label htmlFor="employee-select">Employee *</Label>
            {mode === 'add' ? (
              loadingEmployees ? (
                <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                  Loading employees...
                </div>
              ) : (
                <Select
                  value={logFormData.userId}
                  onValueChange={value => handleLogFormChange('userId', value)}
                  disabled={savingLog}
                >
                  <SelectTrigger id="employee-select">
                    <SelectValue placeholder="Select an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(employee => {
                      let name = '';
                      if (employee.user_info) {
                        const { first_name, middle_name, last_name } =
                          employee.user_info;
                        name = [first_name, middle_name, last_name]
                          .filter(Boolean)
                          .join(' ');
                      } else {
                        name = employee.name || employee.email;
                      }
                      return (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          {name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )
            ) : (
              <Input
                id="employee-select"
                value={log?.employee || ''}
                disabled
                className="bg-muted"
              />
            )}
            {logFormErrors.userId && (
              <p className="text-red-500 text-xs">{logFormErrors.userId}</p>
            )}
          </div>

          {/* Shift - auto from backend (read-only) */}
          <div className="space-y-2">
            <Label>Shift</Label>
            <Input
              value={
                mode === 'edit'
                  ? log?.shift
                    ? getShiftDisplayText(log.shift, scheduleDetails)
                    : log?.scheduleName || '-'
                  : scheduleLoading
                  ? 'Loading schedule...'
                  : scheduleError
                  ? ''
                  : scheduleDetails && logFormData.userId
                  ? (() => {
                      // Try to determine shift from schedule details (for add mode, we show all shifts)
                      const shifts = [];
                      if (scheduleDetails.shifts.morning.start && scheduleDetails.shifts.morning.end) {
                        shifts.push(`Morning (${formatTime12Hour(scheduleDetails.shifts.morning.start)} - ${formatTime12Hour(scheduleDetails.shifts.morning.end)})`);
                      }
                      if (scheduleDetails.shifts.afternoon.start && scheduleDetails.shifts.afternoon.end) {
                        shifts.push(`Afternoon (${formatTime12Hour(scheduleDetails.shifts.afternoon.start)} - ${formatTime12Hour(scheduleDetails.shifts.afternoon.end)})`);
                      }
                      if (scheduleDetails.shifts.night.start && scheduleDetails.shifts.night.end) {
                        shifts.push(`Night (${formatTime12Hour(scheduleDetails.shifts.night.start)} - ${formatTime12Hour(scheduleDetails.shifts.night.end)})`);
                      }
                      return shifts.length > 0 ? shifts.join(', ') : scheduleDetails.schedule_name || 'No shift configured';
                    })()
                  : 'Select employee to load schedule'
              }
              disabled
              className={cn(
                "bg-muted",
                scheduleError && "border-destructive text-destructive"
              )}
            />
            {scheduleError && (
              <p className="text-sm text-destructive">
                {scheduleError}{' '}
                <Link
                  href="/hrms/dtr/schedule"
                  className="underline hover:text-destructive/80 font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                >
                  Assign schedule here
                </Link>
              </p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="log-date">Date *</Label>
            {mode === 'edit' ? (
              <Input
                id="log-date"
                value={format(logFormData.date, 'PPP')}
                disabled
                className="bg-muted"
              />
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="log-date"
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !logFormData.date && 'text-muted-foreground'
                    )}
                    disabled={savingLog}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {logFormData.date ? (
                      format(logFormData.date, 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={logFormData.date}
                    onSelect={(date) => {
                      if (date) {
                        setLogFormData(prev => ({ ...prev, date }));
                        if (logFormErrors.date) {
                          setLogFormErrors(prev => {
                            const next = { ...prev };
                            delete next.date;
                            return next;
                          });
                        }
                      }
                    }}
                    initialFocus
                    disabled={savingLog}
                  />
                </PopoverContent>
              </Popover>
            )}
            {logFormErrors.date && (
              <p className="text-red-500 text-xs">{logFormErrors.date}</p>
            )}
          </div>

          {/* Clock In */}
          <div className="space-y-2">
            <Label htmlFor="clock-in">Clock In Time *</Label>
            <TimePicker
              id="clock-in"
              value={logFormData.clockIn}
              onChange={(value) => handleLogFormChange('clockIn', value)}
              disabled={savingLog}
            />
            {logFormErrors.clockIn && (
              <p className="text-red-500 text-xs">{logFormErrors.clockIn}</p>
            )}
          </div>

          {/* Clock Out */}
          <div className="space-y-2">
            <Label htmlFor="clock-out">Clock Out Time *</Label>
            <TimePicker
              id="clock-out"
              value={logFormData.clockOut}
              onChange={(value) => handleLogFormChange('clockOut', value)}
              disabled={savingLog}
            />
            {logFormErrors.clockOut && (
              <p className="text-red-500 text-xs">{logFormErrors.clockOut}</p>
            )}
          </div>

          {mode === 'edit' && (
            <p className="text-xs text-muted-foreground">
              Note: Late minutes, overtime, and total work hours will be
              automatically recalculated after saving.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={savingLog}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitLog}
            disabled={savingLog}
            className="bg-green-600 hover:bg-green-700"
          >
            {savingLog ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                {mode === 'add' ? 'Creating...' : 'Updating...'}
              </>
            ) : mode === 'add' ? (
              'Create Log'
            ) : (
              'Update Log'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

