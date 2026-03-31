import { api } from '@/services/api';
import { API_ENDPOINTS } from '@/config/api.config';

export interface ColaEntry {
  cola_id: number | null;
  user_id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  amount: number;
}

export interface UpsertColaRequest {
  user_id: number;
  amount: number;
}

export const colaService = {
  async getAll(): Promise<ColaEntry[]> {
    const response = await api(API_ENDPOINTS.ALLOWANCES.COLA.BASE);
    if (Array.isArray(response)) return response as ColaEntry[];
    if (response?.data && Array.isArray(response.data)) return response.data as ColaEntry[];
    return [];
  },

  async upsert(data: UpsertColaRequest): Promise<{ cola_id: number; user_id: number; amount: number }> {
    const response = await api(API_ENDPOINTS.ALLOWANCES.COLA.BASE, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return response?.data || response;
  },

  async update(id: number, amount: number): Promise<{ cola_id: number; user_id: number; amount: number }> {
    const response = await api(API_ENDPOINTS.ALLOWANCES.COLA.UPDATE.replace('{id}', id.toString()), {
      method: 'PUT',
      body: JSON.stringify({ amount }),
    });

    return response?.data || response;
  },

  async delete(id: number): Promise<void> {
    await api(API_ENDPOINTS.ALLOWANCES.COLA.DELETE.replace('{id}', id.toString()), {
      method: 'DELETE',
    });
  },
};

