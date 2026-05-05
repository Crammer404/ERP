import { api } from '@/services';
import { API_CONFIG } from '@/config/api.config';
import { API_ENDPOINTS } from '@/config/api.config';
import type { DtrLogResponseItem } from '../../time-clock/types';

export const getAttendanceLogs = async (): Promise<DtrLogResponseItem[]> => {
  return await api(API_ENDPOINTS.DTR.ATTENDANCE.LOGS, { method: 'GET' });
};

export const exportAttendance = async (startDate?: string, endDate?: string): Promise<void> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const queryString = params.toString();
    const endpoint = `${API_ENDPOINTS.DTR.ATTENDANCE.EXPORT}${queryString ? '?' + queryString : ''}`;
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
    let filename = 'Attendance.xlsx';
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

