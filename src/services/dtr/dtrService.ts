import { api } from '../api';
import { API_ENDPOINTS } from '../../config/api.config';

export interface DTR {
  id: number;
  user_id: number;
  branch_id: number;
  check_in: string;
  check_out?: string;
  date: string;
  total_hours?: number;
  overtime_hours?: number;
  created_at: string;
  updated_at: string;
}

export interface CheckInRequest {
  user_id: number;
  branch_id: number;
  check_in: string;
}

export interface CheckOutRequest {
  check_out: string;
}

export interface CreateDTRRequest {
  user_id: number;
  branch_id: number;
  check_in: string;
  check_out?: string;
  date: string;
}

export interface UpdateDTRRequest {
  check_in?: string;
  check_out?: string;
  total_hours?: number;
  overtime_hours?: number;
}

export interface ScheduleConfigRequest {
  schedule_name: string;
  branch_id: string;
  grace_period: string;
  overtime: string;
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
  assignedEmployees: AssignedEmployee[];
}

export const dtrService = {
  // Get all DTR records
  async getAll(): Promise<DTR[]> {
    return await api(API_ENDPOINTS.DTR.BASE);
  },

  // Get DTR by ID
  async getById(id: number): Promise<DTR> {
    return await api(`${API_ENDPOINTS.DTR.BASE}/${id}`);
  },

  // Check in
  async checkIn(checkInData: CheckInRequest): Promise<DTR> {
    return await api(API_ENDPOINTS.DTR.CHECK_IN, {
      method: 'POST',
      body: JSON.stringify(checkInData),
    });
  },

  // Check out
  async checkOut(id: number, checkOutData: CheckOutRequest): Promise<DTR> {
    return await api(`${API_ENDPOINTS.DTR.BASE}/${id}/check-out`, {
      method: 'POST',
      body: JSON.stringify(checkOutData),
    });
  },

  // Create new DTR record
  async create(dtrData: CreateDTRRequest): Promise<DTR> {
    return await api(API_ENDPOINTS.DTR.BASE, {
      method: 'POST',
      body: JSON.stringify(dtrData),
    });
  },

  // Update DTR record
  async update(id: number, dtrData: UpdateDTRRequest): Promise<DTR> {
    return await api(`${API_ENDPOINTS.DTR.BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dtrData),
    });
  },

  // Delete DTR record
  async delete(id: number): Promise<void> {
    return await api(`${API_ENDPOINTS.DTR.BASE}/${id}`, {
      method: 'DELETE',
    });
  },

  // Configuration & Schedule methods
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
