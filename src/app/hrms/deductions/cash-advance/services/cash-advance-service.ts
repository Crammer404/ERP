import { api } from '@/services/api';
import { API_ENDPOINTS } from '@/config/api.config';

export interface CashAdvance {
  id: number;
  branch_id: number;
  code: string;
  user_id: number;
  amount: number;
  outstanding_balance: number;
  date_issued: string;
  status: string;
  description: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  branch?: {
    id: number;
    name: string;
    branch_code: string;
  };
  user_info?: {
    id: number;
    user_id: number;
    first_name?: string;
    last_name?: string;
    user?: {
      id: number;
      email: string;
      user_info?: {
        first_name?: string;
        last_name?: string;
      };
    };
  };
  creator?: {
    id: number;
    email: string;
    name?: string;
  };
}

export interface CreateCashAdvanceRequest {
  user_id: number;
  branch_id: number;
  amount: number;
  outstanding_balance?: number;
  date_issued: string;
  status?: string;
  description?: string | null;
}

export interface UpdateCashAdvanceRequest {
  user_id?: number;
  branch_id?: number;
  amount?: number;
  outstanding_balance?: number;
  date_issued?: string;
  status?: string;
  description?: string | null;
}

export const cashAdvanceService = {
  async getAll(): Promise<CashAdvance[]> {
    const response = await api(API_ENDPOINTS.DEDUCTIONS.CASH_ADVANCE.BASE);
    return response.data || response;
  },

  async getById(id: number): Promise<CashAdvance> {
    const response = await api(API_ENDPOINTS.DEDUCTIONS.CASH_ADVANCE.GET.replace('{id}', id.toString()));
    return response.data || response;
  },

  async create(data: CreateCashAdvanceRequest): Promise<CashAdvance> {
    const response = await api(API_ENDPOINTS.DEDUCTIONS.CASH_ADVANCE.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data || response;
  },

  async update(id: number, data: UpdateCashAdvanceRequest): Promise<CashAdvance> {
    const response = await api(API_ENDPOINTS.DEDUCTIONS.CASH_ADVANCE.UPDATE.replace('{id}', id.toString()), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data || response;
  },

  async delete(id: number): Promise<void> {
    return await api(API_ENDPOINTS.DEDUCTIONS.CASH_ADVANCE.DELETE.replace('{id}', id.toString()), {
      method: 'DELETE',
    });
  },
};
