'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { addDays, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  createManualLog,
  updateManualLog,
  ManualDtrPayload,
  getUserScheduleDetails,
  UserScheduleDetails,
  UserScheduleShiftDetail,
} from '@/services/hrms/dtr';
import {
  managementService,
  Employee,
} from '@/services/management/managementService';

type ShiftKey = 'morning' | 'afternoon' | 'night';
type ShiftName = 'Morning' | 'Afternoon' | 'Night';

interface ShiftDefinition {
  key: ShiftKey;
  label: ShiftName;
  start: string;
  end: string;
  isOvernight: boolean;
}

interface ShiftFieldValue {
  logId: number | null;
  clockIn: string;
  clockOut: string;
}

type ShiftFieldMap = Record<ShiftKey, ShiftFieldValue>;

const createEmptyShiftFieldMap = (): ShiftFieldMap => ({
  morning: { logId: null, clockIn: '', clockOut: '' },
  afternoon: { logId: null, clockIn: '', clockOut: '' },
  night: { logId: null, clockIn: '', clockOut: '' },
});

export interface ManualLogData {
  id: number;
  userId: number;
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

interface ShiftTimeFieldsProps {
  definition: ShiftDefinition;
  value: ShiftFieldValue;
  errors: Record<string, string>;
  disabled: boolean;
  onClockInChange: (value: string) => void;
  onClockOutChange: (value: string) => void;
}

const ShiftTimeFields: React.FC<ShiftTimeFieldsProps> = ({
  definition,
  value,
  errors,
  disabled,
  onClockInChange,
  onClockOutChange,
}) => {
  const inError = errors[`${definition.key}.clockIn`];
  const outError = errors[`${definition.key}.clockOut`];

  return (
    <div className="space-y-4 rounded-md border p-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold">{definition.label} Shift</p>
        <p className="text-xs text-muted-foreground">
          {formatTime12Hour(definition.start)} - {formatTime12Hour(definition.end)}
          {definition.isOvernight ? ' (cross-date)' : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${definition.key}-clock-in`}>
            {definition.label} Clock In
          </Label>
          <TimePicker
            id={`${definition.key}-clock-in`}
            value={value.clockIn}
            onChange={onClockInChange}
            disabled={disabled}
          />
          {inError && <p className="text-xs text-red-500">{inError}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${definition.key}-clock-out`}>
            {definition.label} Clock Out
          </Label>
          <TimePicker
            id={`${definition.key}-clock-out`}
            value={value.clockOut}
            onChange={onClockOutChange}
            disabled={disabled}
          />
          {outError && <p className="text-xs text-red-500">{outError}</p>}
        </div>
      </div>
    </div>
  );
};

const shiftNameToKey = (value?: string | null): ShiftKey | null => {
  const normalized = (value || '').toLowerCase().trim();
  if (normalized === 'morning') return 'morning';
  if (normalized === 'afternoon') return 'afternoon';
  if (normalized === 'night') return 'night';
  return null;
};

const shiftKeyToName = (key: ShiftKey): ShiftName => {
  if (key === 'morning') return 'Morning';
  if (key === 'afternoon') return 'Afternoon';
  return 'Night';
};

const parseDateFromYmd = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const isoToTimePickerFormat = (isoString: string | null): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
};

const formatTime12Hour = (time24: string | null): string => {
  if (!time24) return '';
  const parts = time24.split(':');
  if (parts.length < 2) return '';
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return '';
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
};

const convert12To24Hour = (time12: string): string => {
  if (!time12) return '';
  const [timePart, periodPart] = time12.trim().split(' ');
  if (!timePart || !periodPart) return '';
  const [hoursPart, minutesPart] = timePart.split(':');
  const hours = Number(hoursPart);
  const minutes = Number(minutesPart);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return '';

  let hours24 = hours;
  const normalizedPeriod = periodPart.toUpperCase();
  if (normalizedPeriod === 'PM' && hours !== 12) {
    hours24 = hours + 12;
  } else if (normalizedPeriod === 'AM' && hours === 12) {
    hours24 = 0;
  }

  return `${String(hours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const toMinutes = (time24: string): number => {
  const [hourPart, minutePart] = time24.split(':');
  const hours = Number(hourPart);
  const minutes = Number(minutePart);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
  return hours * 60 + minutes;
};

const resolveClockOutDate = (
  startDate: Date,
  clockIn24: string,
  clockOut24: string,
  isOvernight: boolean,
): Date => {
  if (isOvernight) {
    return addDays(startDate, 1);
  }

  if (toMinutes(clockOut24) < toMinutes(clockIn24)) {
    return addDays(startDate, 1);
  }

  return startDate;
};

const mapShiftDefinitions = (
  details: UserScheduleDetails | null,
): ShiftDefinition[] => {
  if (!details) return [];

  if (details.shift_details && details.shift_details.length > 0) {
    return details.shift_details
      .filter((shift): shift is UserScheduleShiftDetail => {
        return !!shift.start && !!shift.end;
      })
      .map((shift) => ({
        key: shift.key,
        label: shiftKeyToName(shift.key),
        start: shift.start as string,
        end: shift.end as string,
        isOvernight: shift.is_overnight,
      }));
  }

  const fallback: ShiftDefinition[] = [];
  const allShifts: ShiftKey[] = ['morning', 'afternoon', 'night'];
  allShifts.forEach((key) => {
    const shiftValue = details.shifts[key];
    if (!shiftValue?.start || !shiftValue?.end) return;

    const startMinutes = toMinutes(shiftValue.start.slice(0, 5));
    const endMinutes = toMinutes(shiftValue.end.slice(0, 5));

    fallback.push({
      key,
      label: shiftKeyToName(key),
      start: shiftValue.start,
      end: shiftValue.end,
      isOvernight: endMinutes <= startMinutes,
    });
  });

  return fallback;
};

export function ManualLogModal({
  isOpen,
  mode,
  log,
  onClose,
  onSuccess,
}: ManualLogModalProps) {
  const { toast } = useToast();
  const scheduleRequestRef = useRef(0);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [savingLog, setSavingLog] = useState(false);
  const [scheduleDetails, setScheduleDetails] = useState<UserScheduleDetails | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [shiftDefinitions, setShiftDefinitions] = useState<ShiftDefinition[]>([]);
  const [shiftFields, setShiftFields] = useState<ShiftFieldMap>(createEmptyShiftFieldMap());

  const [logFormData, setLogFormData] = useState({
    userId: '',
    date: new Date(),
  });

  const [logFormErrors, setLogFormErrors] = useState<Record<string, string>>({});

  const configuredShiftSummary = useMemo(() => {
    if (!shiftDefinitions.length) return 'No shift configured';
    return shiftDefinitions
      .map((shift) => `${shift.label} (${formatTime12Hour(shift.start)} - ${formatTime12Hour(shift.end)})`)
      .join(', ');
  }, [shiftDefinitions]);

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

    void fetchEmployees();
  }, [isOpen, mode]);

  useEffect(() => {
    if (!isOpen) return;

    setLogFormErrors({});
    setScheduleDetails(null);
    setScheduleError(null);
    setShiftDefinitions([]);
    setShiftFields(createEmptyShiftFieldMap());

    if (mode === 'add') {
      setLogFormData({
        userId: '',
        date: new Date(),
      });
      return;
    }

    if (mode === 'edit' && log) {
      const parsedDate = parseDateFromYmd(log.dateRaw) || new Date();
      setLogFormData({
        userId: log.userId ? log.userId.toString() : '',
        date: parsedDate,
      });
    }
  }, [isOpen, mode, log]);

  useEffect(() => {
    if (!isOpen) return;
    const userId = Number(logFormData.userId);
    if (!userId || Number.isNaN(userId)) {
      setScheduleDetails(null);
      setScheduleError(null);
      setShiftDefinitions([]);
      setShiftFields(createEmptyShiftFieldMap());
      return;
    }

    void loadScheduleContext(userId, logFormData.date);
  }, [isOpen, logFormData.userId, logFormData.date]);

  const loadScheduleContext = async (userId: number, selectedDate: Date) => {
    const requestId = ++scheduleRequestRef.current;
    setScheduleLoading(true);
    setScheduleError(null);

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const res = await getUserScheduleDetails(userId, dateStr);
      if (requestId !== scheduleRequestRef.current) return;

      if (!res.success || !res.data) {
        setScheduleDetails(null);
        setShiftDefinitions([]);
        setShiftFields(createEmptyShiftFieldMap());
        setScheduleError(res.message || 'No schedule is assigned to this employee in the current branch.');
        return;
      }

      const details = res.data;
      const definitions = mapShiftDefinitions(details);
      const nextShiftFields = createEmptyShiftFieldMap();

      definitions.forEach((definition) => {
        const existing = details.shift_logs?.[definition.key];
        if (!existing) return;
        nextShiftFields[definition.key] = {
          logId: existing.id,
          clockIn: isoToTimePickerFormat(existing.clock_in),
          clockOut: isoToTimePickerFormat(existing.clock_out),
        };
      });

      // Fallback for legacy payloads that may not contain shift_logs.
      if (details.logs && details.logs.length > 0) {
        details.logs.forEach((existingLog) => {
          const key = existingLog.shift_key || shiftNameToKey(existingLog.shift);
          if (!key) return;
          if (nextShiftFields[key].logId) return;

          nextShiftFields[key] = {
            logId: existingLog.id,
            clockIn: isoToTimePickerFormat(existingLog.clock_in),
            clockOut: isoToTimePickerFormat(existingLog.clock_out),
          };
        });
      }

      setScheduleDetails(details);
      setShiftDefinitions(definitions);
      setShiftFields(nextShiftFields);
      setScheduleError(null);
    } catch (error: any) {
      if (requestId !== scheduleRequestRef.current) return;
      const msg =
        error?.response?.data?.message || error?.message || 'Failed to load schedule.';
      setScheduleDetails(null);
      setShiftDefinitions([]);
      setShiftFields(createEmptyShiftFieldMap());
      setScheduleError(msg);
    } finally {
      if (requestId === scheduleRequestRef.current) {
        setScheduleLoading(false);
      }
    }
  };

  const handleLogFormChange = (field: 'userId' | 'date', value: string | Date) => {
    setLogFormData((prev) => ({ ...prev, [field]: value }));
    if (logFormErrors[field]) {
      setLogFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleShiftFieldChange = (
    key: ShiftKey,
    field: 'clockIn' | 'clockOut',
    value: string,
  ) => {
    setShiftFields((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));

    const errorKey = `${key}.${field}`;
    if (logFormErrors[errorKey] || logFormErrors.shiftLogs) {
      setLogFormErrors((prev) => {
        const next = { ...prev };
        delete next[errorKey];
        delete next.shiftLogs;
        return next;
      });
    }
  };

  const buildIsoDateTime = (date: Date, time24: string): string => {
    const datePart = format(date, 'yyyy-MM-dd');
    return `${datePart}T${time24}:00`;
  };

  const handleSubmitLog = async () => {
    const errors: Record<string, string> = {};
    const userId = Number(logFormData.userId);

    if (!userId || Number.isNaN(userId)) {
      errors.userId = 'Employee is required';
    }

    if (
      !logFormData.date ||
      !(logFormData.date instanceof Date) ||
      Number.isNaN(logFormData.date.getTime())
    ) {
      errors.date = 'Date is required';
    }

    if (shiftDefinitions.length === 0) {
      errors.shiftLogs = 'No configured shifts available for this employee.';
    }

    let hasAtLeastOneShift = false;
    const operations: Array<{
      key: ShiftKey;
      definition: ShiftDefinition;
      logId: number | null;
      clockIn24: string;
      clockOut24: string;
    }> = [];

    shiftDefinitions.forEach((definition) => {
      const value = shiftFields[definition.key];
      const hasClockIn = !!value.clockIn.trim();
      const hasClockOut = !!value.clockOut.trim();

      if (hasClockIn || hasClockOut) {
        hasAtLeastOneShift = true;
      }

      if (hasClockIn && !hasClockOut) {
        errors[`${definition.key}.clockOut`] = 'Clock Out time is required.';
        return;
      }

      if (!hasClockIn && hasClockOut) {
        errors[`${definition.key}.clockIn`] = 'Clock In time is required.';
        return;
      }

      if (!hasClockIn || !hasClockOut) {
        return;
      }

      const clockIn24 = convert12To24Hour(value.clockIn);
      const clockOut24 = convert12To24Hour(value.clockOut);

      if (!clockIn24) {
        errors[`${definition.key}.clockIn`] = 'Invalid Clock In time.';
        return;
      }

      if (!clockOut24) {
        errors[`${definition.key}.clockOut`] = 'Invalid Clock Out time.';
        return;
      }

      operations.push({
        key: definition.key,
        definition,
        logId: value.logId,
        clockIn24,
        clockOut24,
      });
    });

    if (!hasAtLeastOneShift) {
      errors.shiftLogs = 'Please enter at least one shift time log.';
    }

    if (Object.keys(errors).length > 0) {
      setLogFormErrors(errors);
      toast({
        title: 'Validation Error',
        description: 'Please review the required shift fields.',
        variant: 'destructive',
      });
      return;
    }

    setSavingLog(true);
    try {
      for (const operation of operations) {
        const clockInDateTime = buildIsoDateTime(logFormData.date, operation.clockIn24);
        const clockOutBaseDate = resolveClockOutDate(
          logFormData.date,
          operation.clockIn24,
          operation.clockOut24,
          operation.definition.isOvernight,
        );
        const clockOutDateTime = buildIsoDateTime(clockOutBaseDate, operation.clockOut24);

        const payload: Partial<ManualDtrPayload> = {
          clock_in: clockInDateTime,
          clock_out: clockOutDateTime,
          shift: shiftKeyToName(operation.key),
        };

        if (operation.logId) {
          const updateResult = await updateManualLog(operation.logId, payload);
          if (updateResult.status === 'error') {
            throw new Error(updateResult.message || `Failed to update ${operation.definition.label} shift.`);
          }
        } else {
          const createPayload: ManualDtrPayload = {
            user_id: userId,
            date: format(logFormData.date, 'yyyy-MM-dd'),
            clock_in: clockInDateTime,
            clock_out: clockOutDateTime,
            shift: shiftKeyToName(operation.key),
          };
          const createResult = await createManualLog(createPayload);
          if (createResult.status === 'error') {
            throw new Error(createResult.message || `Failed to create ${operation.definition.label} shift.`);
          }
        }
      }

      toast({
        title: 'Success',
        description: mode === 'add'
          ? 'Manual time logs saved successfully.'
          : 'Manual time logs updated successfully.',
        variant: 'default',
      });

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
    <Dialog open={isOpen} onOpenChange={(open) => !savingLog && !open && handleClose()}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>
            {mode === 'add' ? 'Add Manual Time Log' : 'Edit Manual Time Log'}
          </DialogTitle>
          <DialogDescription>
            Select employee and date, then encode logs per configured shift schedule.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[68vh] overflow-y-auto pr-1">
          <div className="space-y-4 px-6 py-3">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="employee-select">Employee *</Label>
              {mode === 'add' ? (
                loadingEmployees ? (
                  <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                    Loading employees...
                  </div>
                ) : (
                  <Select
                    value={logFormData.userId}
                    onValueChange={(value) => handleLogFormChange('userId', value)}
                    disabled={savingLog}
                  >
                    <SelectTrigger id="employee-select">
                      <SelectValue placeholder="Select an employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => {
                        let name = '';
                        if (employee.user_info) {
                          const { first_name, middle_name, last_name } = employee.user_info;
                          name = [first_name, middle_name, last_name].filter(Boolean).join(' ');
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
                <p className="text-xs text-red-500">{logFormErrors.userId}</p>
              )}
            </div>

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
                        !logFormData.date && 'text-muted-foreground',
                      )}
                      disabled={savingLog}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {logFormData.date ? format(logFormData.date, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={logFormData.date}
                      onSelect={(selectedDate) => {
                        if (selectedDate) {
                          handleLogFormChange('date', selectedDate);
                        }
                      }}
                      disabled={savingLog}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
              {logFormErrors.date && (
                <p className="text-xs text-red-500">{logFormErrors.date}</p>
              )}
            </div>
          </div>

            <div className="space-y-2">
              <Label>Schedule</Label>
              <Input
                value={scheduleLoading ? 'Loading schedule...' : configuredShiftSummary}
                disabled
                className={cn(
                  'bg-muted',
                  scheduleError && 'border-destructive text-destructive',
                )}
              />
              {scheduleDetails?.schedule_name && (
                <p className="text-xs text-muted-foreground">
                  Schedule: {scheduleDetails.schedule_name}
                </p>
              )}
              {scheduleError && (
                <p className="text-sm text-destructive">
                  {scheduleError}{' '}
                  <Link
                    href="/hrms/dtr/schedule"
                    className="font-medium underline hover:text-destructive/80"
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

            <div className="space-y-3">
              {shiftDefinitions.map((definition) => (
                <ShiftTimeFields
                  key={definition.key}
                  definition={definition}
                  value={shiftFields[definition.key]}
                  errors={logFormErrors}
                  disabled={savingLog || scheduleLoading || !!scheduleError}
                  onClockInChange={(value) =>
                    handleShiftFieldChange(definition.key, 'clockIn', value)
                  }
                  onClockOutChange={(value) =>
                    handleShiftFieldChange(definition.key, 'clockOut', value)
                  }
                />
              ))}
              {logFormErrors.shiftLogs && (
                <p className="text-xs text-red-500">{logFormErrors.shiftLogs}</p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Night shift clock-out automatically rolls to the next day based on the selected start date.
            </p>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-background">
          <Button variant="outline" onClick={handleClose} disabled={savingLog}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitLog}
            disabled={savingLog || scheduleLoading || !!scheduleError}
            className="bg-green-600 hover:bg-green-700"
          >
            {savingLog ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                {mode === 'add' ? 'Saving...' : 'Updating...'}
              </>
            ) : mode === 'add' ? (
              'Save Manual Logs'
            ) : (
              'Update Manual Logs'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
