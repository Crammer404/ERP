import { api } from '@/services';
import { API_ENDPOINTS } from '@/config/api.config';

export interface UserScheduleShifts {
  morning: { start: string | null; end: string | null };
  afternoon: { start: string | null; end: string | null };
  night: { start: string | null; end: string | null };
}

export interface UserScheduleShiftDetail {
  key: 'morning' | 'afternoon' | 'night';
  label: string;
  start: string | null;
  end: string | null;
  is_overnight: boolean;
}

export interface UserScheduleLogItem {
  id: number;
  date: string | null;
  shift: string;
  shift_key: 'morning' | 'afternoon' | 'night' | null;
  clock_in: string | null;
  clock_out: string | null;
}

export interface UserScheduleDetails {
  schedule_name: string | null;
  branch_id: number | null;
  grace_period: number;
  overtime: number;
  shifts: UserScheduleShifts;
  shift_details?: UserScheduleShiftDetail[];
  start_date?: string | null;
  shift_logs?: Partial<Record<'morning' | 'afternoon' | 'night', UserScheduleLogItem>>;
  logs?: UserScheduleLogItem[];
}

export const getUserScheduleDetails = async (
  userId: number,
  date?: string,
  logId?: number,
): Promise<{ success: boolean; data?: UserScheduleDetails; message?: string }> => {
  const params = new URLSearchParams();
  if (date) params.append('date', date);
  if (logId != null && Number.isFinite(logId)) params.append('log_id', String(logId));
  const query = params.toString();
  const endpoint = API_ENDPOINTS.DTR.USER_SCHEDULE.DETAILS.replace('{userId}', String(userId));
  return await api(`${endpoint}${query ? `?${query}` : ''}`, { method: 'GET' });
};

export interface ScheduleConfigRequest {
  schedule_name: string;
  branch_id: string;
  grace_period: string;
  overtime: string;
  allow_auto_split_logs?: boolean;
  late_deduction_mode?: 'rate' | 'fixed';
  late_deduction_fixed_amount?: string;
  morning_shift_start: string;
  morning_shift_end: string;
  afternoon_shift_start: string;
  afternoon_shift_end: string;
  night_shift_start: string;
  night_shift_end: string;
  user_ids: string[];
}

export interface AssignedEmployee {
  id: number;
  name: string;
  email?: string;
}

export interface Schedule {
  id: number;
  name: string;
  branch: string;
  morningShift: string;
  afternoonShift: string;
  nightShift: string;
  gracePeriod: number;
  overtimeThreshold: number;
  allowAutoSplitLogs?: boolean;
  lateDeductionMode?: 'rate' | 'fixed';
  lateDeductionFixedAmount?: number;
  assignedEmployees: AssignedEmployee[];
}

export const dtrService = {
  async getSchedules(): Promise<{ schedules: Schedule[] }> {
    return await api(API_ENDPOINTS.DTR.CONFIGURATION.SCHEDULES);
  },

  async getSchedule(id: number): Promise<any> {
    const endpoint = API_ENDPOINTS.DTR.CONFIGURATION.GET_SCHEDULE.replace('{id}', id.toString());
    return await api(endpoint);
  },

  async createSchedule(scheduleData: ScheduleConfigRequest): Promise<{ message: string }> {
    return await api(API_ENDPOINTS.DTR.CONFIGURATION.STORE, {
      method: 'POST',
      body: JSON.stringify(scheduleData),
    });
  },

  async updateSchedule(id: number, scheduleData: ScheduleConfigRequest): Promise<{ message: string }> {
    const endpoint = API_ENDPOINTS.DTR.CONFIGURATION.UPDATE_SCHEDULE.replace('{id}', id.toString());
    return await api(endpoint, {
      method: 'PUT',
      body: JSON.stringify(scheduleData),
    });
  },

  async updateScheduleEmployees(id: number, userIds: string[]): Promise<{ message: string }> {
    const endpoint = API_ENDPOINTS.DTR.CONFIGURATION.UPDATE_SCHEDULE_EMPLOYEES.replace('{id}', id.toString());
    return await api(endpoint, {
      method: 'PUT',
      body: JSON.stringify({ user_ids: userIds }),
    });
  },

  async deleteSchedule(id: number): Promise<{ message: string }> {
    const endpoint = API_ENDPOINTS.DTR.CONFIGURATION.DELETE_SCHEDULE.replace('{id}', id.toString());
    return await api(endpoint, {
      method: 'DELETE',
    });
  },
};

