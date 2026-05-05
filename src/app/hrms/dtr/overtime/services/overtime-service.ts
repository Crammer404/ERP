import { api } from '@/services';
import { API_ENDPOINTS } from '@/config/api.config';

export interface MyOvertimeRecord {
  id: number;
  date: string;
  shift: string;
  clock_in: string | null;
  clock_out: string | null;
  overtime_minutes: number;
  overtime_hours: number;
  request_id?: number;
  request_status: 'not_requested' | 'pending' | 'approved' | 'rejected';
  request_reason?: string;
  request_notes?: string;
  requested_at?: string;
  appeal_attempts?: number;
  pay_type?: 'overtime' | 'regular' | null;
}

export interface OvertimeRequestRecord {
  id: number;
  dtr_log_id: number;
  date: string;
  date_formatted: string;
  employee: string;
  employee_id: number;
  branch: string;
  overtime_minutes: number;
  overtime_hours: number;
  requested_hours: number;
  actual_hours: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  pay_type?: 'overtime' | 'regular';
  requested_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  notes?: string;
}

export const getMyOvertime = async (): Promise<MyOvertimeRecord[]> => {
  return await api(API_ENDPOINTS.DTR.OVERTIME.MY, { method: 'GET' });
};

export const getEmployeeOvertime = async (employeeId: number): Promise<MyOvertimeRecord[]> => {
  const queryParams = new URLSearchParams();
  queryParams.append('employee_id', employeeId.toString());
  return await api(`${API_ENDPOINTS.DTR.OVERTIME.EMPLOYEE}?${queryParams.toString()}`, { method: 'GET' });
};

export const getOvertimeRequests = async (params?: {
  status?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
}): Promise<OvertimeRequestRecord[]> => {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.start_date) queryParams.append('start_date', params.start_date);
  if (params?.end_date) queryParams.append('end_date', params.end_date);

  const queryString = queryParams.toString();
  const endpoint = `${API_ENDPOINTS.DTR.OVERTIME.BASE}${queryString ? '?' + queryString : ''}`;
  return await api(endpoint, { method: 'GET' });
};

export const getOvertimeRequest = async (id: number): Promise<OvertimeRequestRecord> => {
  const endpoint = API_ENDPOINTS.DTR.OVERTIME.SHOW.replace('{id}', String(id));
  return await api(endpoint, { method: 'GET' });
};

export const requestOvertime = async (data: { dtr_log_id: number; reason?: string }): Promise<{ message: string; data: any }> => {
  return await api(API_ENDPOINTS.DTR.OVERTIME.BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
};

export const requestEmployeeOvertime = async (data: {
  employee_id: number;
  dtr_log_id: number;
  reason?: string;
}): Promise<{ message: string; data: any }> => {
  return await api(API_ENDPOINTS.DTR.OVERTIME.EMPLOYEE_REQUEST, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
};

export const approveOvertime = async (id: number, payType: 'overtime' | 'regular', notes?: string): Promise<{ message: string; data: any }> => {
  const endpoint = API_ENDPOINTS.DTR.OVERTIME.APPROVE.replace('{id}', String(id));
  return await api(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pay_type: payType, notes }),
  });
};

export const rejectOvertime = async (id: number, notes: string): Promise<{ message: string; data: any }> => {
  const endpoint = API_ENDPOINTS.DTR.OVERTIME.REJECT.replace('{id}', String(id));
  return await api(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  });
};

