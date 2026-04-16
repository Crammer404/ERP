import type { DtrLogResponseItem } from '@/services/hrms/dtr';
import type { TimeClockLog } from '../types';

const formatHoursAndMinutes = (
  raw: number | string | null | undefined,
  fallback?: number | string | null | undefined
): string => {
  const toNum = (v: unknown): number | null => {
    if (v === null || v === undefined) return null;
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    return Number.isNaN(n) ? null : n;
  };

  const primary = toNum(raw);
  const secondary = toNum(fallback);
  const value = primary ?? secondary ?? 0;
  if (!value || value <= 0) return '0h 0m';

  let hours = 0;
  let minutes = 0;
  if (value < 48) {
    hours = Math.floor(value);
    minutes = Math.round((value - hours) * 60);
  } else {
    hours = Math.floor(value / 60);
    minutes = Math.round(value % 60);
  }

  if (minutes >= 60) {
    hours += Math.floor(minutes / 60);
    minutes %= 60;
  }

  return `${hours}h ${minutes}min`;
};

const formatLateMinutes = (
  late: number | string | null | undefined,
  grace: number | string | null | undefined
): string => {
  const lateMinutes = Number(late ?? 0);
  const graceMinutes = Number(grace ?? 0);
  if (lateMinutes <= 0) return '-';
  if (graceMinutes > 0 && lateMinutes <= graceMinutes) return '-';
  return `${lateMinutes} min`;
};

const formatOvertimeMinutes = (
  overtime: number | string | null | undefined,
  grace: number | string | null | undefined
): string => {
  const overtimeMin = Number(overtime ?? 0);
  const graceMin = Number(grace ?? 0);
  if (overtimeMin <= 0) return '-';
  if (graceMin > 0 && overtimeMin <= graceMin) return '-';
  return `${overtimeMin} min`;
};

const toTime = (ts: string | null): string => {
  if (!ts) return '-';
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
};

const formatTimeOnly = (time: string | null | undefined): string => {
  if (!time) return '-';
  const parts = String(time).split(':');
  if (parts.length < 2) return '-';
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  const seconds = parts.length > 2 ? Number(parts[2]) : 0;
  if (Number.isNaN(hours) || Number.isNaN(minutes) || Number.isNaN(seconds)) return '-';

  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} ${period}`;
};

const toDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return dateStr;
};

export const formatStatusLabel = (status: string | null): string => {
  if (!status || !status.trim()) return '-';
  return status
    .trim()
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const mapTimeClockLog = (item: DtrLogResponseItem): TimeClockLog => {
  const isEarlyOutRequestRow = typeof item.request_id === 'number';

  if (isEarlyOutRequestRow) {
    const employeeName = item.employee_name || `#${item.user_id}`;
    return {
      id: item.id,
      userId: item.user_id,
      employeeNameRaw: item.employee_name || '',
      date: toDate(item.date),
      dateRaw: item.date,
      deletedAt: null,
      employee: employeeName,
      branch: item.branch_name || '-',
      scheduleName: '-',
      shift: '-',
      clockIn: '-',
      clockOut: '-',
      late: '-',
      overtime: '-',
      actualHours: '-',
      totalWorkHours: '-',
      clockInRaw: null,
      clockOutRaw: null,
      status: item.status || null,
      earlyOutRequestId: item.request_id ?? item.id,
      earlyOutRequestStatus: (item.status as 'pending' | 'approved' | 'rejected' | null) || null,
      earlyOutRemainingMinutes: Number(item.remaining_minutes || 0),
      scheduledClockOut: formatTimeOnly(item.scheduled_clock_out_at || null),
      actualClockOut: toTime(item.actual_clock_out_at || null),
      reviewedBy: item.reviewed_by_name || '-',
    };
  }

  const nestedFirst = (item.user as any)?.user_info?.first_name;
  const nestedLast = (item.user as any)?.user_info?.last_name;
  const employeeName =
    item.user?.name ||
    [item.user?.first_name, item.user?.last_name].filter(Boolean).join(' ') ||
    [nestedFirst, nestedLast].filter(Boolean).join(' ') ||
    `#${item.user_id}`;

  const branchName = item.user?.branch_users?.[0]?.branch?.name || '-';
  const scheduleName = item.schedule_name || '-';

  return {
    id: item.id,
    userId: item.user_id,
    date: toDate(item.date),
    dateRaw: item.date,
    deletedAt: item.deleted_at || null,
    employee: employeeName,
    branch: branchName,
    scheduleName,
    shift: item.shift || '-',
    clockIn: toTime(item.clock_in),
    clockOut: toTime(item.clock_out),
    overtime: formatOvertimeMinutes(item.overtime_minutes, item.grace_overtime_minutes),
    actualHours: formatHoursAndMinutes(item.actual_hours, item.cleaned_total_work_hours),
    totalWorkHours: formatHoursAndMinutes(item.total_work_hours),
    late: formatLateMinutes(item.late_minutes, item.grace_late_minutes),
    clockInRaw: item.clock_in,
    clockOutRaw: item.clock_out,
    status: item.status || null,
    earlyOutRequestId: item.early_out_request?.id ?? null,
    earlyOutRequestStatus: item.early_out_request_status || null,
    earlyOutRemainingMinutes: item.early_out_remaining_minutes || 0,
    scheduledClockOut: '-',
    actualClockOut: '-',
    reviewedBy: '-',
  };
};

