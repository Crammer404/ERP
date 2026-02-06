// DTR (Time Clock) service
import { api } from "../api";

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
  grace_late_minutes?: number | null;
  late_minutes?: number | null;
  grace_overtime_minutes?: number | null;
  overtime_minutes?: number | null;
  total_work_hours?: number | null;
  cleaned_total_work_hours?: number | null;
  schedule_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

export const getTimeClockLogs = async (): Promise<DtrLogResponseItem[]> => {
  return await api("/hrms/dtr/logs", { method: "GET" });
};

export const getAttendanceLogs = async (): Promise<DtrLogResponseItem[]> => {
  return await api("/hrms/dtr/attendance/logs", { method: "GET" });
};

export const exportAttendance = async (startDate?: string, endDate?: string): Promise<void> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const queryString = params.toString();
    const endpoint = `/hrms/dtr/attendance/export${queryString ? '?' + queryString : ''}`;
    
    // Make API call to get the file
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'X-Tenant-ID': JSON.parse(localStorage.getItem('tenant_context') || '{}')?.id || '',
        'X-Branch-ID': JSON.parse(localStorage.getItem('branch_context') || '{}')?.id || '',
      },
    });

    if (!response.ok) {
      let errorMessage = 'Export failed';
      try {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await response.json();
          errorMessage = data?.message || errorMessage;
        } else {
          const text = await response.text();
          if (text) {
            errorMessage = text;
          }
        }
      } catch (parseError) {
        console.warn('Failed to parse export error response', parseError);
      }

      const error = new Error(errorMessage);
      (error as any).status = response.status;
      throw error;
    }

    // Get filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'Attendance.xlsx';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Download the file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
};

export const clock = async (userId: number) => {
  return await api("/hrms/dtr/clock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });
};

export const exportTimesheet = async (startDate?: string, endDate?: string): Promise<void> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const queryString = params.toString();
    const endpoint = `/hrms/dtr/export-timesheet${queryString ? '?' + queryString : ''}`;
    
    // Make API call to get the file
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'X-Tenant-ID': JSON.parse(localStorage.getItem('tenant_context') || '{}')?.id || '',
        'X-Branch-ID': JSON.parse(localStorage.getItem('branch_context') || '{}')?.id || '',
      },
    });

    if (!response.ok) {
      let errorMessage = 'Export failed';
      try {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await response.json();
          errorMessage = data?.message || errorMessage;
        } else {
          const text = await response.text();
          if (text) errorMessage = text;
        }
      } catch {}

      const error = new Error(errorMessage);
      (error as any).status = response.status;
      throw error;
    }

    // Get filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'Timesheet.xlsx';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Download the file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
};

// Overtime interfaces
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
  requested_at?: string;
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

// Overtime API functions
export const getMyOvertime = async (): Promise<MyOvertimeRecord[]> => {
  return await api("/hrms/dtr/overtime/my", { method: "GET" });
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
  const endpoint = `/hrms/dtr/overtime${queryString ? '?' + queryString : ''}`;
  return await api(endpoint, { method: "GET" });
};

export const getOvertimeRequest = async (id: number): Promise<OvertimeRequestRecord> => {
  return await api(`/hrms/dtr/overtime/${id}`, { method: "GET" });
};

export const requestOvertime = async (data: {
  dtr_log_id: number;
  reason?: string;
}): Promise<{ message: string; data: any }> => {
  return await api("/hrms/dtr/overtime", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};

export const approveOvertime = async (id: number, payType: 'overtime' | 'regular', notes?: string): Promise<{ message: string; data: any }> => {
  return await api(`/hrms/dtr/overtime/${id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pay_type: payType, notes }),
  });
};

export const rejectOvertime = async (id: number, notes: string): Promise<{ message: string; data: any }> => {
  return await api(`/hrms/dtr/overtime/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes }),
  });
};