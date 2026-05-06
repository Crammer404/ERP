'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DateRange } from 'react-day-picker';
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { useRouter } from 'next/navigation';
import { type CheckedState } from '@radix-ui/react-checkbox';
import { userService, UserEntity } from '@/app/management/users/services/userService';
import { positionService, type PayrollPosition } from '@/app/hrms/payroll/positions/services/position-service';
import { getTimeClockLogs } from '@/app/hrms/dtr/time-clock/services/time-clock-service';
import {
  approveOvertime,
  getOvertimeRequests,
  rejectOvertime,
  type OvertimeRequestRecord,
} from '@/app/hrms/dtr/overtime/services/overtime-service';
import {
  approveEarlyOutRequest,
  rejectEarlyOutRequest,
} from '@/app/hrms/dtr/time-clock/services/early-out-service';
import { colaService, type ColaEntry } from '@/app/hrms/allowances/cola/services/cola-service';
import { cashAdvanceService, type CashAdvance } from '@/app/hrms/deductions/cash-advance/services/cash-advance-service';
import { statutoriesService, type StatutoryEntry, type StatutoryType } from '@/app/hrms/deductions/statutories/services/statutories-service';
import { ROUTES } from '@/config/api.config';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';

export const DEFAULT_PAYROLL_TYPES = ['Semi-Monthly', 'Monthly', 'Weekly'];
export const CUSTOM_RANGE_TYPE = 'Range Date';

export const WIZARD_STEPS = [
  { id: 1, title: 'Payroll Type & Range', subtitle: 'Configure payroll coverage period' },
  { id: 2, title: 'Employee Selection', subtitle: 'Select employees for this payroll run' },
  { id: 3, title: 'Overtime Check', subtitle: 'Verify pending overtime requests' },
  { id: 4, title: 'Early Out Check', subtitle: 'Verify pending early time-out requests' },
  { id: 5, title: 'COLA Inclusion', subtitle: 'Choose whether to include COLA' },
  { id: 6, title: 'Cash Advance Rule', subtitle: 'Review included cash advance cutoff' },
  { id: 7, title: 'Statutory Deductions', subtitle: 'Choose statutory deduction inclusion' },
] as const;

export type CashAdvanceWindow = {
  label: string;
  startDate: Date;
  endDate: Date;
};

export type GeneratePayrollUser = {
  id: number;
  name: string;
  role?: string;
};

export interface GeneratePayrollPayload {
  payrollType: string;
  payrollRange?: DateRange;
  userIds: number[];
  includeStatutoryDeductions: boolean;
  includeCola: boolean;
  includeCashAdvance: boolean;
}

export type PendingEarlyOutRecord = {
  id: number;
  request_id: number;
  date: string;
  employee_name: string;
  user_id?: number | null;
  scheduled_clock_out_at?: string | null;
  actual_clock_out_at?: string | null;
  remaining_minutes?: number | null;
  status?: string | null;
};

export const formatColaEntryEmployeeName = (row: ColaEntry): string => {
  const full = [row.first_name ?? '', row.last_name ?? ''].filter(Boolean).join(' ').trim();
  return full || row.email;
};

export const formatCashAdvanceEmployeeName = (row: CashAdvance): string => {
  const first =
    row.user_info?.first_name ??
    row.user_info?.user?.user_info?.first_name ??
    '';
  const last =
    row.user_info?.last_name ??
    row.user_info?.user?.user_info?.last_name ??
    '';
  const full = [first, last].filter(Boolean).join(' ').trim();
  return full || row.user_info?.user?.email || `#${row.user_id}`;
};

export const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Overtime-style display: omits `0h`, omits trailing `0min` when only whole hours. */
export const formatCompactDurationHoursMinutes = (hours: number, minutes: number): string => {
  const safeHours = Math.max(0, Math.floor(hours));
  const safeMinutes = Math.max(0, Math.floor(minutes));

  if (safeHours <= 0 && safeMinutes <= 0) return '0min';
  if (safeHours <= 0) return `${safeMinutes}min`;
  if (safeMinutes <= 0) return `${safeHours}h`;
  return `${safeHours}h ${safeMinutes}min`;
};

/** Total minutes → same compact rules as requested-hours column (e.g. `1h 5min`, `45min`). */
export const formatRemainingMinutesLabel = (totalMinutes: number | null | undefined): string => {
  if (totalMinutes == null || Number.isNaN(Number(totalMinutes))) return '-';
  const safe = Math.max(0, Math.floor(Number(totalMinutes)));
  return formatCompactDurationHoursMinutes(Math.floor(safe / 60), safe % 60);
};

export const formatRequestedHoursLabel = (value: unknown): string => {
  const raw = String(value ?? '').trim();
  if (!raw) return '0min';

  const numeric = Number(raw.replace(/[^\d.:-]/g, ''));
  if (Number.isFinite(numeric)) {
    const totalMinutes = Math.max(0, Math.round(numeric * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return formatCompactDurationHoursMinutes(hours, minutes);
  }

  const colonMatch = raw.match(/^(\d{1,2}):(\d{1,2})$/);
  if (colonMatch) {
    const hours = Number(colonMatch[1] || 0);
    const minutes = Number(colonMatch[2] || 0);
    if (Number.isFinite(hours) && Number.isFinite(minutes)) {
      return formatCompactDurationHoursMinutes(hours, minutes);
    }
  }

  return raw;
};

/** Scheduled/actual clock-out values: ISO datetime or 24h `HH:MM` / `HH:MM:SS` → e.g. `1:00 PM`. */
export const formatClockTime12h = (value: string | null | undefined): string => {
  if (value == null || String(value).trim() === '') return '-';
  const s = String(value).trim();

  const timeOnly = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
  const m = s.match(timeOnly);
  if (m) {
    let h = Number(m[1]);
    const min = Number(m[2]);
    if (Number.isNaN(h) || Number.isNaN(min)) return '-';
    h = ((h % 24) + 24) % 24;
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(min).padStart(2, '0')} ${period}`;
  }

  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  return '-';
};

const weekRangeContaining = (d: Date): DateRange => {
  const from = startOfWeek(d, { weekStartsOn: 1 });
  const to = endOfWeek(d, { weekStartsOn: 1 });
  return { from, to };
};

const semiMonthlyRangeContaining = (d: Date): DateRange => {
  const y = d.getFullYear();
  const m = d.getMonth();
  const day = d.getDate();
  if (day <= 15) {
    return { from: new Date(y, m, 1), to: new Date(y, m, 15) };
  }
  return { from: new Date(y, m, 16), to: endOfMonth(d) };
};

const monthlyRangeContaining = (d: Date): DateRange => ({
  from: startOfMonth(d),
  to: endOfMonth(d),
});

export const payrollTypeKey = (type: string) =>
  type.trim().toLowerCase().replace(/\s+/g, '-');

export const normalizeRangeForPayrollType = (
  type: string,
  range: DateRange | undefined
): DateRange | undefined => {
  if (!range?.from) return undefined;
  const anchor = range.to ?? range.from;
  switch (payrollTypeKey(type)) {
    case 'weekly':
      return weekRangeContaining(anchor);
    case 'semi-monthly':
      return semiMonthlyRangeContaining(anchor);
    case 'monthly':
      return monthlyRangeContaining(anchor);
    default:
      return range;
  }
};

export const defaultRangeForPayrollType = (type: string): DateRange => {
  const today = new Date();
  return normalizeRangeForPayrollType(type, {
    from: today,
    to: today,
  }) ?? { from: today, to: today };
};

export const getCashAdvanceWindowForPayrollRange = (
  payrollType: string,
  range: DateRange | undefined
): CashAdvanceWindow | null => {
  if (!range?.from || !range?.to) {
    return null;
  }

  // Only Semi-Monthly uses special cutoff windows.
  // Weekly/Monthly/Custom Range use the same payroll coverage.
  if (payrollTypeKey(payrollType) !== 'semi-monthly') {
    return {
      label: `${format(range.from, 'MMM d, yyyy')} - ${format(range.to, 'MMM d, yyyy')}`,
      startDate: range.from,
      endDate: range.to,
    };
  }

  const fromDay = range.from.getDate();
  const fromMonth = range.from.getMonth();
  const fromYear = range.from.getFullYear();

  if (fromDay <= 15) {
    const previousMonthDate = addMonths(new Date(fromYear, fromMonth, 1), -1);
    const previousMonth = previousMonthDate.getMonth();
    const previousYear = previousMonthDate.getFullYear();
    const startDate = new Date(previousYear, previousMonth, 6);
    const endDate = new Date(previousYear, previousMonth, 20);

    return {
      label: `6-20 (${format(startDate, 'MMM yyyy')})`,
      startDate,
      endDate,
    };
  }

  const previousMonthDate = addMonths(new Date(fromYear, fromMonth, 1), -1);
  const previousMonth = previousMonthDate.getMonth();
  const previousYear = previousMonthDate.getFullYear();
  const startDate = new Date(previousYear, previousMonth, 21);
  const endDate = new Date(fromYear, fromMonth, 5);

  return {
    label: `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`,
    startDate,
    endDate,
  };
};

export const usePayrollContextSummary = (dateRange?: DateRange) => {
  const activeBranchName = useMemo(() => {
    if (typeof window === 'undefined') return 'Active branch';
    try {
      const branch = JSON.parse(localStorage.getItem('branch_context') || '{}');
      return String(branch?.name || 'Active branch');
    } catch {
      return 'Active branch';
    }
  }, []);

  const selectedRangeLabel = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return 'selected payroll range';
    return `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`;
  }, [dateRange?.from, dateRange?.to]);

  return { activeBranchName, selectedRangeLabel };
};

interface UseGeneratePayrollModalOptions {
  users?: GeneratePayrollUser[];
  payrollTypes?: string[];
  onGenerate?: (payload: GeneratePayrollPayload) => Promise<void> | void;
}

export const useGeneratePayrollModal = ({
  users,
  payrollTypes = DEFAULT_PAYROLL_TYPES,
  onGenerate,
}: UseGeneratePayrollModalOptions) => {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const isSuperAdmin = user?.role_slug === 'super_admin';
  const [open, setOpen] = useState(false);
  const availablePayrollTypes = useMemo(() => {
    const base = payrollTypes.filter((type) => payrollTypeKey(type) !== payrollTypeKey(CUSTOM_RANGE_TYPE));
    if (!isSuperAdmin) return base;
    return [...base, CUSTOM_RANGE_TYPE];
  }, [isSuperAdmin, payrollTypes]);
  const defaultPayrollType = useMemo(
    () => availablePayrollTypes[0] ?? 'Monthly',
    [availablePayrollTypes]
  );

  const [payrollType, setPayrollType] = useState(defaultPayrollType);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [includeStatutory, setIncludeStatutory] = useState(true);
  const [includeCola, setIncludeCola] = useState(true);
  const [includeCashAdvance, setIncludeCashAdvance] = useState(true);
  const [availableUsers, setAvailableUsers] = useState<GeneratePayrollUser[]>(users ?? []);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStepChecking, setIsStepChecking] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
  const [showPendingOvertimeDialog, setShowPendingOvertimeDialog] = useState(false);
  const [showPendingEarlyOutDialog, setShowPendingEarlyOutDialog] = useState(false);
  const [pendingOvertimeRecords, setPendingOvertimeRecords] = useState<OvertimeRequestRecord[]>([]);
  const [pendingEarlyOutRecords, setPendingEarlyOutRecords] = useState<PendingEarlyOutRecord[]>([]);
  const [pendingOvertimeLoading, setPendingOvertimeLoading] = useState(false);
  const [pendingEarlyOutLoading, setPendingEarlyOutLoading] = useState(false);
  const [colaEntries, setColaEntries] = useState<ColaEntry[]>([]);
  const [colaLoading, setColaLoading] = useState(false);
  const [cashAdvanceEntries, setCashAdvanceEntries] = useState<CashAdvance[]>([]);
  const [cashAdvanceLoading, setCashAdvanceLoading] = useState(false);
  const [statutoryActiveTab, setStatutoryActiveTab] = useState<StatutoryType>('sss');
  const [statutoryEntries, setStatutoryEntries] = useState<StatutoryEntry[]>([]);
  const [statutoryLoading, setStatutoryLoading] = useState(false);
  const [selectedOvertimeRecord, setSelectedOvertimeRecord] = useState<OvertimeRequestRecord | null>(null);
  const [approveOvertimeModalOpen, setApproveOvertimeModalOpen] = useState(false);
  const [rejectOvertimeModalOpen, setRejectOvertimeModalOpen] = useState(false);
  const [overtimePayType, setOvertimePayType] = useState<'overtime' | 'regular'>('overtime');
  const [overtimeActionNotes, setOvertimeActionNotes] = useState('');
  const [approveOvertimeSubmitting, setApproveOvertimeSubmitting] = useState(false);
  const [rejectOvertimeSubmitting, setRejectOvertimeSubmitting] = useState(false);
  const [selectedEarlyOutRecord, setSelectedEarlyOutRecord] = useState<PendingEarlyOutRecord | null>(null);
  const [approveEarlyOutModalOpen, setApproveEarlyOutModalOpen] = useState(false);
  const [rejectEarlyOutModalOpen, setRejectEarlyOutModalOpen] = useState(false);
  const [earlyOutModalNotes, setEarlyOutModalNotes] = useState('');
  const [earlyOutModalSubmitting, setEarlyOutModalSubmitting] = useState(false);
  const isCustomRange = payrollTypeKey(payrollType) === payrollTypeKey(CUSTOM_RANGE_TYPE);
  const payrollTypeForSubmit = isCustomRange ? 'Monthly' : payrollType;
  const totalSteps = 7;
  const cashAdvanceWindow = useMemo(
    () => getCashAdvanceWindowForPayrollRange(payrollTypeForSubmit, dateRange),
    [payrollTypeForSubmit, dateRange]
  );
  const activeStepMeta = WIZARD_STEPS.find((step) => step.id === currentStep) ?? WIZARD_STEPS[0];
  const { activeBranchName, selectedRangeLabel } = usePayrollContextSummary(dateRange);
  const isStepConditionSatisfied = useMemo(() => {
    switch (currentStep) {
      case 1:
        return Boolean(dateRange?.from && dateRange?.to);
      case 2:
        return selectedUserIds.length > 0;
      case 3:
        return !pendingOvertimeLoading && pendingOvertimeRecords.length === 0;
      case 4:
        return !pendingEarlyOutLoading && pendingEarlyOutRecords.length === 0;
      default:
        return true;
    }
  }, [
    currentStep,
    dateRange?.from,
    dateRange?.to,
    pendingOvertimeLoading,
    pendingOvertimeRecords.length,
    pendingEarlyOutLoading,
    pendingEarlyOutRecords.length,
    selectedUserIds.length,
  ]);

  useEffect(() => {
    if (users) {
      setAvailableUsers(users);
    }
  }, [users]);

  useEffect(() => {
    if (!open || users) return;
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        setUsersError(null);
        const PER_PAGE = 200;
        const MAX_PAGES = 50;
        let page = 1;
        const fetchedUsers: UserEntity[] = [];

        while (page <= MAX_PAGES) {
          const { users: pageUsers, pagination } = await userService.getAll(page, PER_PAGE);
          fetchedUsers.push(...(pageUsers || []));
          const hasMore = Boolean(pagination?.has_more_pages);
          const lastPage = pagination?.last_page ?? 1;
          if (hasMore || (Number.isFinite(lastPage) && page < lastPage) || (pageUsers || []).length === PER_PAGE) {
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
        const mapped: GeneratePayrollUser[] = (fetchedUsers || [])
          .map((entry: UserEntity) => {
            const firstName = entry.user_info?.first_name ?? '';
            const lastName = entry.user_info?.last_name ?? '';
            const displayName =
              [firstName, lastName].filter(Boolean).join(' ').trim() ||
              entry.name ||
              entry.email;
            const positionId = Number(entry.user_info?.payroll_positions_id);
            const positionName =
              Number.isFinite(positionId) && positionId > 0
                ? positionsById[positionId] || ''
                : '';
            return { id: entry.id, name: displayName, role: positionName || undefined };
          })
          .filter((entry) => Boolean(entry.role));
        setAvailableUsers(mapped);
      } catch (error: any) {
        console.error('Failed to load users for payroll dialog:', error);
        setUsersError(error?.message || 'Failed to load users. Please try again.');
        setAvailableUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [open, users]);

  useEffect(() => {
    setSelectedUserIds((prev) =>
      prev.filter((id) => availableUsers.some((entry) => entry.id === id))
    );
  }, [availableUsers]);

  const filteredUsers = useMemo(() => {
    const q = employeeSearch.trim().toLowerCase();
    if (!q) return availableUsers;
    return availableUsers.filter((entry) => {
      const idStr = String(entry.id);
      return idStr.includes(q) || entry.name.toLowerCase().includes(q) || (entry.role ?? '').toLowerCase().includes(q);
    });
  }, [availableUsers, employeeSearch]);

  const visibleUserIds = useMemo(() => filteredUsers.map((entry) => entry.id), [filteredUsers]);
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
      setSelectedUserIds((prev) => {
        const next = new Set(prev);
        visibleUserIds.forEach((id) => next.add(id));
        return Array.from(next);
      });
      return;
    }
    const visibleSet = new Set(visibleUserIds);
    setSelectedUserIds((prev) => prev.filter((id) => !visibleSet.has(id)));
  };

  const handleToggleUser = (userId: number, checked: boolean) => {
    setSelectedUserIds((prev) => (checked ? [...prev, userId] : prev.filter((id) => id !== userId)));
  };

  const resetForm = () => {
    setPayrollType(defaultPayrollType);
    setDateRange(undefined);
    setSelectedUserIds([]);
    setIncludeStatutory(true);
    setIncludeCola(true);
    setIncludeCashAdvance(true);
    setEmployeeSearch('');
    setCurrentStep(1);
    setStepError(null);
    setShowGenerateConfirm(false);
    setColaEntries([]);
    setCashAdvanceEntries([]);
    setStatutoryActiveTab('sss');
    setStatutoryEntries([]);
  };

  const fetchColaEntries = useCallback(async () => {
    setColaLoading(true);
    try {
      const data = await colaService.getAll();
      const scoped = (data || []).filter((row) =>
        selectedUserIds.length > 0 ? selectedUserIds.includes(row.user_id) : true
      );
      const sorted = [...scoped].sort((a, b) =>
        formatColaEntryEmployeeName(a).localeCompare(formatColaEntryEmployeeName(b), undefined, {
          sensitivity: 'base',
        })
      );
      setColaEntries(sorted);
    } catch (error) {
      console.error('Failed to load COLA entries:', error);
      setColaEntries([]);
    } finally {
      setColaLoading(false);
    }
  }, [selectedUserIds]);

  const activeBranchId = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      const branch = JSON.parse(localStorage.getItem('branch_context') || '{}');
      const id = Number(branch?.id);
      return Number.isFinite(id) && id > 0 ? id : null;
    } catch {
      return null;
    }
  }, []);

  const fetchCashAdvanceEntries = useCallback(async () => {
    if (!cashAdvanceWindow) {
      setCashAdvanceEntries([]);
      return;
    }

    setCashAdvanceLoading(true);
    try {
      const all = await cashAdvanceService.getAll();

      const fromTime = new Date(cashAdvanceWindow.startDate).setHours(0, 0, 0, 0);
      const toTime = new Date(cashAdvanceWindow.endDate).setHours(23, 59, 59, 999);

      const filtered = (all || [])
        .filter((row) => (activeBranchId ? row.branch_id === activeBranchId : true))
        .filter((row) => (selectedUserIds.length > 0 ? selectedUserIds.includes(row.user_id) : true))
        .filter((row) => {
          const issued = new Date(row.date_issued);
          const t = issued.getTime();
          if (Number.isNaN(t)) return false;
          return t >= fromTime && t <= toTime;
        })
        .filter((row) => String(row.status || '').toLowerCase() === 'active')
        .filter((row) => Number(row.outstanding_balance ?? 0) > 0);

      const sorted = [...filtered].sort((a, b) =>
        formatCashAdvanceEmployeeName(a).localeCompare(formatCashAdvanceEmployeeName(b), undefined, {
          sensitivity: 'base',
        })
      );

      setCashAdvanceEntries(sorted);
    } catch (error) {
      console.error('Failed to load cash advance entries:', error);
      setCashAdvanceEntries([]);
    } finally {
      setCashAdvanceLoading(false);
    }
  }, [activeBranchId, cashAdvanceWindow, selectedUserIds]);

  const fetchStatutoryEntries = useCallback(async (type: StatutoryType = statutoryActiveTab) => {
    setStatutoryLoading(true);
    try {
      const all = await statutoriesService.getAll(type);
      const scoped = (all || []).filter((row) =>
        selectedUserIds.length > 0 ? selectedUserIds.includes((row as any).user_id) : true
      );
      setStatutoryEntries(scoped);
    } catch (error) {
      console.error('Failed to load statutory entries:', error);
      setStatutoryEntries([]);
    } finally {
      setStatutoryLoading(false);
    }
  }, [selectedUserIds, statutoryActiveTab]);

  useEffect(() => {
    if (!open) {
      resetForm();
    } else {
      setPayrollType(defaultPayrollType);
    }
  }, [open, defaultPayrollType]);

  useEffect(() => {
    if (!open) return;
    setDateRange(defaultRangeForPayrollType(payrollType));
  }, [open, payrollType]);

  const fetchPendingOvertimeRecords = async (): Promise<OvertimeRequestRecord[]> => {
    if (!dateRange?.from || !dateRange?.to) {
      setPendingOvertimeRecords([]);
      return [];
    }
    if (selectedUserIds.length === 0) {
      setPendingOvertimeRecords([]);
      return [];
    }
    setPendingOvertimeLoading(true);
    try {
      const records = await getOvertimeRequests({
        status: 'pending',
        start_date: formatLocalDate(dateRange.from),
        end_date: formatLocalDate(dateRange.to),
        user_ids: selectedUserIds,
      });
      const filtered = (records || []).filter((r) =>
        selectedUserIds.includes((r as any).employee_id ?? -1)
      );
      setPendingOvertimeRecords(filtered);
      return filtered;
    } catch (error) {
      console.error('Failed to load pending overtime records:', error);
      setPendingOvertimeRecords([]);
      return [];
    } finally {
      setPendingOvertimeLoading(false);
    }
  };

  const fetchPendingEarlyOutRecords = async (): Promise<PendingEarlyOutRecord[]> => {
    if (!dateRange?.from || !dateRange?.to) {
      setPendingEarlyOutRecords([]);
      return [];
    }
    if (selectedUserIds.length === 0) {
      setPendingEarlyOutRecords([]);
      return [];
    }
    setPendingEarlyOutLoading(true);
    try {
      const response: any = await getTimeClockLogs({
        page: 1,
        per_page: 1000,
        start_date: formatLocalDate(dateRange.from),
        end_date: formatLocalDate(dateRange.to),
        early_out: true,
        user_ids: selectedUserIds,
      });
      const rows: any[] = Array.isArray(response?.data)
        ? response.data
        : (Array.isArray(response) ? response : []);
      const normalizedRows: PendingEarlyOutRecord[] = rows.map((row: any) => ({
        id: Number(row?.id ?? 0),
        request_id: Number(row?.request_id ?? row?.early_out_request?.id ?? 0),
        date: String(row?.date ?? ''),
        employee_name: String(row?.employee_name ?? row?.employee ?? ''),
        user_id: Number(row?.user_id ?? row?.userId ?? row?.employee_id ?? 0),
        scheduled_clock_out_at: row?.scheduled_clock_out_at ?? row?.scheduled_clock_out ?? null,
        actual_clock_out_at: row?.actual_clock_out_at ?? row?.actual_clock_out ?? null,
        remaining_minutes: row?.remaining_minutes ?? row?.early_out_remaining_minutes ?? null,
        status: row?.status ?? row?.early_out_request_status ?? null,
      }));
      const pendingOnly = normalizedRows
        .filter((row) => String(row?.status || '').toLowerCase() === 'pending')
        .filter((row: any) => selectedUserIds.includes(Number((row as any).user_id || 0)));
      setPendingEarlyOutRecords(pendingOnly);
      return pendingOnly;
    } catch (error) {
      console.error('Failed to load pending early-out records:', error);
      setPendingEarlyOutRecords([]);
      return [];
    } finally {
      setPendingEarlyOutLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !dateRange?.from || !dateRange?.to) return;
    if (currentStep === 3) fetchPendingOvertimeRecords();
    if (currentStep === 4) fetchPendingEarlyOutRecords();
  }, [open, currentStep, dateRange?.from, dateRange?.to]);

  useEffect(() => {
    if (!open || currentStep !== 5) return;
    void fetchColaEntries();
  }, [open, currentStep, fetchColaEntries]);

  useEffect(() => {
    if (!open || currentStep !== 6) return;
    void fetchCashAdvanceEntries();
  }, [open, currentStep, fetchCashAdvanceEntries]);

  useEffect(() => {
    if (!open || currentStep !== 7) return;
    void fetchStatutoryEntries(statutoryActiveTab);
  }, [open, currentStep, statutoryActiveTab, fetchStatutoryEntries]);

  const handlePayrollRangeChange = (range: DateRange | undefined) => {
    if (isCustomRange) {
      setDateRange(range);
      setSelectedUserIds([]);
      return;
    }
    setDateRange(normalizeRangeForPayrollType(payrollType, range));
    setSelectedUserIds([]);
  };

  const handleClose = () => setOpen(false);
  const handleClearRange = () => setDateRange(undefined);

  const handleApproveOvertimeFromStep = async (record: OvertimeRequestRecord, payType: 'overtime' | 'regular') => {
    try {
      await approveOvertime(record.id, payType, 'Approved via payroll wizard check');
      await fetchPendingOvertimeRecords();
      toast({ title: 'Success', description: 'Overtime request approved.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to approve overtime request.', variant: 'destructive' });
    }
  };

  const handleRejectOvertimeFromStep = async (record: OvertimeRequestRecord) => {
    try {
      await rejectOvertime(record.id, 'Rejected via payroll wizard check');
      await fetchPendingOvertimeRecords();
      toast({ title: 'Success', description: 'Overtime request rejected.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to reject overtime request.', variant: 'destructive' });
    }
  };

  const openApproveOvertimeModalFromStep = (record: OvertimeRequestRecord) => {
    setSelectedOvertimeRecord(record);
    setOvertimePayType('overtime');
    setOvertimeActionNotes('');
    setApproveOvertimeModalOpen(true);
  };

  const openRejectOvertimeModalFromStep = (record: OvertimeRequestRecord) => {
    setSelectedOvertimeRecord(record);
    setOvertimeActionNotes('');
    setRejectOvertimeModalOpen(true);
  };

  const confirmApproveOvertimeFromStep = async () => {
    if (!selectedOvertimeRecord) return;
    try {
      setApproveOvertimeSubmitting(true);
      await handleApproveOvertimeFromStep(selectedOvertimeRecord, overtimePayType);
      setApproveOvertimeModalOpen(false);
      setSelectedOvertimeRecord(null);
      setOvertimeActionNotes('');
    } finally {
      setApproveOvertimeSubmitting(false);
    }
  };

  const confirmRejectOvertimeFromStep = async () => {
    if (!selectedOvertimeRecord) return;
    if (!overtimeActionNotes.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a rejection reason.',
        variant: 'destructive',
      });
      return;
    }
    try {
      setRejectOvertimeSubmitting(true);
      await rejectOvertime(selectedOvertimeRecord.id, overtimeActionNotes.trim());
      await fetchPendingOvertimeRecords();
      toast({ title: 'Success', description: 'Overtime request rejected.' });
      setRejectOvertimeModalOpen(false);
      setSelectedOvertimeRecord(null);
      setOvertimeActionNotes('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to reject overtime request.',
        variant: 'destructive',
      });
    } finally {
      setRejectOvertimeSubmitting(false);
    }
  };

  const openApproveEarlyOutModalFromStep = (record: PendingEarlyOutRecord) => {
    setSelectedEarlyOutRecord(record);
    setEarlyOutModalNotes('');
    setApproveEarlyOutModalOpen(true);
  };

  const openRejectEarlyOutModalFromStep = (record: PendingEarlyOutRecord) => {
    setSelectedEarlyOutRecord(record);
    setEarlyOutModalNotes('');
    setRejectEarlyOutModalOpen(true);
  };

  const confirmApproveEarlyOutFromStep = async () => {
    if (!selectedEarlyOutRecord?.request_id) {
      toast({ title: 'Error', description: 'Invalid early-out request.', variant: 'destructive' });
      return;
    }
    try {
      setEarlyOutModalSubmitting(true);
      await approveEarlyOutRequest(
        selectedEarlyOutRecord.request_id,
        earlyOutModalNotes.trim() || undefined,
      );
      await fetchPendingEarlyOutRecords();
      toast({
        title: 'Success',
        description: `Early-out request for ${selectedEarlyOutRecord.employee_name || 'employee'} has been approved.`,
      });
      setApproveEarlyOutModalOpen(false);
      setSelectedEarlyOutRecord(null);
      setEarlyOutModalNotes('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || error?.message || 'Failed to approve early-out request.',
        variant: 'destructive',
      });
    } finally {
      setEarlyOutModalSubmitting(false);
    }
  };

  const confirmRejectEarlyOutFromStep = async () => {
    if (!selectedEarlyOutRecord?.request_id) {
      toast({ title: 'Error', description: 'Invalid early-out request.', variant: 'destructive' });
      return;
    }
    if (!earlyOutModalNotes.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a rejection reason.',
        variant: 'destructive',
      });
      return;
    }
    try {
      setEarlyOutModalSubmitting(true);
      await rejectEarlyOutRequest(selectedEarlyOutRecord.request_id, earlyOutModalNotes.trim());
      await fetchPendingEarlyOutRecords();
      toast({
        title: 'Success',
        description: `Early-out request for ${selectedEarlyOutRecord.employee_name || 'employee'} has been rejected.`,
      });
      setRejectEarlyOutModalOpen(false);
      setSelectedEarlyOutRecord(null);
      setEarlyOutModalNotes('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || error?.message || 'Failed to reject early-out request.',
        variant: 'destructive',
      });
    } finally {
      setEarlyOutModalSubmitting(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      if (onGenerate) {
        await onGenerate({
          payrollType: payrollTypeForSubmit,
          payrollRange: dateRange,
          userIds: selectedUserIds,
          includeStatutoryDeductions: includeStatutory,
          includeCola,
          includeCashAdvance,
        });
        handleClose();
      }
    } catch (error: any) {
      const errorMessage = String(error?.response?.data?.message || error?.message || '').toLowerCase();
      if (errorMessage.includes('pending early clock-out requests')) {
        setShowPendingEarlyOutDialog(true);
        return;
      }
      console.error('Error generating payroll:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNextStep = async () => {
    setStepError(null);
    if (currentStep === 1 && (!dateRange?.from || !dateRange?.to)) {
      setStepError('Please select payroll type and payroll range before continuing.');
      return;
    }
    if (currentStep === 2) {
      if (selectedUserIds.length === 0) {
        setStepError('Please select at least one employee.');
        return;
      }
    }
    if (currentStep === 3) {
      setIsStepChecking(true);
      const pendingOvertime = await fetchPendingOvertimeRecords();
      setIsStepChecking(false);
      if (pendingOvertime.length > 0) {
        setStepError('Pending overtime requests detected. Resolve them before proceeding.');
        return;
      }
    }
    if (currentStep === 4) {
      setIsStepChecking(true);
      const pendingEarlyOut = await fetchPendingEarlyOutRecords();
      setIsStepChecking(false);
      if (pendingEarlyOut.length > 0) {
        setStepError('Pending early time-out requests detected. Resolve them before proceeding.');
        return;
      }
    }
    if (currentStep === 7) {
      setShowGenerateConfirm(true);
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handleBackStep = (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault();
    event?.stopPropagation();
    setStepError(null);
    setCurrentStep((prev) => (prev <= 1 ? 1 : prev - 1));
  };

  const goToOvertime = () => {
    setShowPendingOvertimeDialog(false);
    setOpen(false);
    router.push(ROUTES.HRMS.DTR.OVERTIME);
  };

  const goToTimeClock = () => {
    setShowPendingEarlyOutDialog(false);
    setOpen(false);
    router.push(ROUTES.HRMS.DTR.TIME_CLOCK);
  };

  return {
    open,
    setOpen,
    availablePayrollTypes,
    payrollType,
    setPayrollType,
    dateRange,
    handlePayrollRangeChange,
    handleClearRange,
    selectedUserIds,
    includeStatutory,
    setIncludeStatutory,
    includeCola,
    setIncludeCola,
    includeCashAdvance,
    setIncludeCashAdvance,
    availableUsers,
    employeeSearch,
    setEmployeeSearch,
    loadingUsers,
    usersError,
    isGenerating,
    isStepChecking,
    currentStep,
    stepError,
    showGenerateConfirm,
    setShowGenerateConfirm,
    showPendingOvertimeDialog,
    setShowPendingOvertimeDialog,
    showPendingEarlyOutDialog,
    setShowPendingEarlyOutDialog,
    pendingOvertimeRecords,
    pendingEarlyOutRecords,
    pendingOvertimeLoading,
    pendingEarlyOutLoading,
    colaEntries,
    colaLoading,
    fetchColaEntries,
    cashAdvanceEntries,
    cashAdvanceLoading,
    fetchCashAdvanceEntries,
    statutoryActiveTab,
    setStatutoryActiveTab,
    statutoryEntries,
    statutoryLoading,
    fetchStatutoryEntries,
    selectedOvertimeRecord,
    approveOvertimeModalOpen,
    setApproveOvertimeModalOpen,
    rejectOvertimeModalOpen,
    setRejectOvertimeModalOpen,
    overtimePayType,
    setOvertimePayType,
    overtimeActionNotes,
    setOvertimeActionNotes,
    approveOvertimeSubmitting,
    rejectOvertimeSubmitting,
    payrollTypeForSubmit,
    totalSteps,
    cashAdvanceWindow,
    activeStepMeta,
    activeBranchName,
    selectedRangeLabel,
    isStepConditionSatisfied,
    filteredUsers,
    selectAllState,
    handleToggleAll,
    handleToggleUser,
    handleClose,
    fetchPendingOvertimeRecords,
    fetchPendingEarlyOutRecords,
    openApproveOvertimeModalFromStep,
    openRejectOvertimeModalFromStep,
    confirmApproveOvertimeFromStep,
    confirmRejectOvertimeFromStep,
    selectedEarlyOutRecord,
    approveEarlyOutModalOpen,
    setApproveEarlyOutModalOpen,
    rejectEarlyOutModalOpen,
    setRejectEarlyOutModalOpen,
    earlyOutModalNotes,
    setEarlyOutModalNotes,
    earlyOutModalSubmitting,
    openApproveEarlyOutModalFromStep,
    openRejectEarlyOutModalFromStep,
    confirmApproveEarlyOutFromStep,
    confirmRejectEarlyOutFromStep,
    handleGenerate,
    handleNextStep,
    handleBackStep,
    goToOvertime,
    goToTimeClock,
  };
};
