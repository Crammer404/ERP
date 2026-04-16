import type { DtrLogResponseItem } from '@/services/hrms/dtr';

export interface TimeClockLog {
  id: number;
  userId: number;
  employeeNameRaw?: string;
  date: string;
  dateRaw: string;
  deletedAt: string | null;
  employee: string;
  branch: string;
  scheduleName: string;
  shift: string;
  clockIn: string;
  clockOut: string;
  late: string;
  overtime: string;
  actualHours: string;
  totalWorkHours: string;
  clockInRaw: string | null;
  clockOutRaw: string | null;
  status: string | null;
  earlyOutRequestId: number | null;
  earlyOutRequestStatus: 'pending' | 'approved' | 'rejected' | null;
  earlyOutRemainingMinutes: number;
  scheduledClockOut: string;
  actualClockOut: string;
  reviewedBy: string;
}

export interface CachedPageData {
  logs: TimeClockLog[];
  totalItems: number;
  totalPages: number;
  pageFrom: number;
  pageTo: number;
  earliestLogDate?: Date;
}

export interface TimeClockQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  shift?: string;
  start_date?: string;
  end_date?: string;
  archived?: boolean;
  early_out?: boolean;
}

export type TimeClockApiLog = DtrLogResponseItem;
