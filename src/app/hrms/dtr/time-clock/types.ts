export interface DtrUserInfo {
  first_name?: string;
  last_name?: string;
  middle_name?: string;
}

export interface DtrBranch {
  id: number;
  name?: string;
}

export interface DtrBranchUser {
  id: number;
  branch_id: number;
  branch?: DtrBranch | null;
}

export interface DtrUser {
  id: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  user_info?: DtrUserInfo | null;
  branch_users?: DtrBranchUser[] | null;
}

export interface DtrLogResponseItem {
  id: number;
  user_id: number;
  user?: DtrUser | null;
  date: string;
  shift: string;
  clock_in: string | null;
  clock_out: string | null;
  deleted_at?: string | null;
  grace_late_minutes?: number | null;
  late_minutes?: number | null;
  grace_overtime_minutes?: number | null;
  overtime_minutes?: number | null;
  total_work_hours?: number | null;
  cleaned_total_work_hours?: number | null;
  actual_hours?: number | null;
  schedule_name?: string | null;
  status?: string | null;
  early_out_request?: {
    id: number;
    status?: 'pending' | 'approved' | 'rejected' | null;
    remaining_minutes?: number | null;
    review_notes?: string | null;
    reason?: string | null;
    reviewed_at?: string | null;
  } | null;
  early_out_request_status?: 'pending' | 'approved' | 'rejected' | null;
  early_out_remaining_minutes?: number | null;
  request_id?: number;
  employee_name?: string;
  branch_name?: string;
  scheduled_clock_out_at?: string | null;
  actual_clock_out_at?: string | null;
  remaining_minutes?: number | null;
  reviewed_by_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

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
  earlyOutReviewNotes: string;
  earlyOutReason: string;
  earlyOutReviewedAt: string;
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
