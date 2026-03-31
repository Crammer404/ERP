import { api } from '@/services';
import { API_ENDPOINTS } from '@/config/api.config';

export type StatutoryType = 'sss' | 'philhealth' | 'pagibig';

export interface StatutoryEntry {
  id: number;
  user_id: number;
  branch_id: number;
  amount: number | string;
  is_rate: boolean;
  employee?: { email?: string };
  user?: { email?: string; user_info?: { first_name?: string; last_name?: string } };
  user_info?: { first_name?: string; last_name?: string; user?: { email?: string } };
  created_at?: string;
  updated_at?: string;
}

export interface BulkUpsertItem {
  user_id: number;
  amount: number;
  is_rate: 0 | 1;
}

export const statutoriesService = {
  async getAll(type: StatutoryType): Promise<StatutoryEntry[]> {
    const response = await api(`${API_ENDPOINTS.DEDUCTIONS.STATUTORIES.GET}?type=${type}`);
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    return [];
  },

  async bulkUpsert(type: StatutoryType, items: BulkUpsertItem[]): Promise<StatutoryEntry[]> {
    const response = await api(API_ENDPOINTS.DEDUCTIONS.STATUTORIES.UPSERT, {
      method: 'POST',
      body: JSON.stringify({ type, items }),
    });
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    return [];
  },

  async delete(type: StatutoryType, id: number): Promise<{ success: boolean }> {
    return await api(API_ENDPOINTS.DEDUCTIONS.STATUTORIES.DELETE, {
      method: 'DELETE',
      body: JSON.stringify({ type, id }),
    });
  },
};

