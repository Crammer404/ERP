import { api } from '@/services';
import { API_CONFIG } from '@/config/api.config';
import { API_ENDPOINTS } from '@/config/api.config';
import type { DtrLogResponseItem } from '../types';
import type { EarlyOutWarningPayload } from './early-out-service';

export interface ManualDtrPayload {
  user_id: number;
  date: string;
  clock_in: string;
  clock_out: string;
  shift?: 'Morning' | 'Afternoon' | 'Night';
}

export const getTimeClockLogs = async (params?: {
  page?: number;
  per_page?: number;
  search?: string;
  shift?: string;
  start_date?: string;
  end_date?: string;
  archived?: boolean;
  early_out?: boolean;
  user_ids?: number[];
}): Promise<any> => {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', String(params.page));
  if (params?.per_page) query.append('per_page', String(params.per_page));
  if (params?.search) query.append('search', params.search);
  if (params?.shift && params.shift !== 'all') query.append('shift', params.shift);
  if (params?.start_date) query.append('start_date', params.start_date);
  if (params?.end_date) query.append('end_date', params.end_date);
  if (params?.archived) query.append('archived', '1');
  if (params?.early_out) query.append('early_out', '1');
  if (params?.user_ids?.length) query.append('user_ids', params.user_ids.join(','));
  const qs = query.toString();
  return await api(`${API_ENDPOINTS.DTR.TIME_CLOCK.LOGS}${qs ? `?${qs}` : ''}`, { method: 'GET' });
};

export const restoreManualLog = async (logId: number): Promise<any> => {
  const endpoint = API_ENDPOINTS.DTR.TIME_CLOCK.RESTORE_LOG.replace('{id}', String(logId));
  return await api(endpoint, { method: 'POST' });
};

export const forceDeleteManualLog = async (logId: number): Promise<any> => {
  const endpoint = API_ENDPOINTS.DTR.TIME_CLOCK.FORCE_DELETE_LOG.replace('{id}', String(logId));
  return await api(endpoint, { method: 'DELETE' });
};

export const createManualLog = async (
  data: ManualDtrPayload,
): Promise<{
  status: string;
  message: string;
  data?: DtrLogResponseItem;
  early_out_warning?: EarlyOutWarningPayload | null;
}> => {
  return await api(API_ENDPOINTS.DTR.TIME_CLOCK.LOGS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
};

export const updateManualLog = async (
  id: number,
  data: Partial<ManualDtrPayload>,
): Promise<{
  status: string;
  message: string;
  data?: DtrLogResponseItem;
  early_out_warning?: EarlyOutWarningPayload | null;
}> => {
  const endpoint = API_ENDPOINTS.DTR.TIME_CLOCK.LOG.replace('{id}', String(id));
  return await api(endpoint, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
};

export const deleteManualLog = async (id: number): Promise<{ status: string; message: string }> => {
  const endpoint = API_ENDPOINTS.DTR.TIME_CLOCK.LOG.replace('{id}', String(id));
  return await api(endpoint, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
};

export const clock = async (userId: number, options?: { confirm_early_out?: boolean }): Promise<any> => {
  return await api(API_ENDPOINTS.DTR.TIME_CLOCK.CLOCK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, confirm_early_out: options?.confirm_early_out ?? false }),
  });
};

export const reopenForOvertime = async (data: { user_id: number; log_id: number }): Promise<any> => {
  return await api(API_ENDPOINTS.DTR.TIME_CLOCK.REOPEN_OVERTIME, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
};

export const exportTimesheet = async (startDate?: string, endDate?: string): Promise<void> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const queryString = params.toString();
    const endpoint = `${API_ENDPOINTS.DTR.EXPORT_TIMESHEET}${queryString ? '?' + queryString : ''}`;
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
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

    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'Timesheet.xlsx';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

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

