import { api } from '@/services';
import { API_ENDPOINTS } from '@/config/api.config';

export interface EarlyOutWarningPayload {
  employee_name: string;
  attempted_clock_out: string;
  scheduled_clock_out: string;
  remaining_minutes: number;
}

export const approveEarlyOutRequest = async (id: number, reviewNotes?: string): Promise<{ status: string; message: string; data?: any }> => {
  const endpoint = API_ENDPOINTS.DTR.EARLY_OUT.APPROVE.replace('{id}', String(id));
  return await api(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ review_notes: reviewNotes }),
  });
};

export const rejectEarlyOutRequest = async (
  id: number,
  reviewNotes: string,
): Promise<{ status: string; message: string; data?: any }> => {
  const endpoint = API_ENDPOINTS.DTR.EARLY_OUT.REJECT.replace('{id}', String(id));
  return await api(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ review_notes: reviewNotes }),
  });
};

