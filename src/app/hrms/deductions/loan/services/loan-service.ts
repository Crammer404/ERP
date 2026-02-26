import { api } from '@/services/api';
import { API_ENDPOINTS } from '@/config/api.config';

export interface Loan {
  id: number;
  branch_id: number;
  code: string;
  user_id: number;
  loan_type: string;
  principal_amount: number;
  interest_rate: number | null;
  total_amount: number;
  deduction_per_cutoff: number;
  remaining_balance: number;
  start_date: string;
  end_date: string | null;
  status: string;
  remarks: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  branch?: {
    id: number;
    name: string;
    branch_code: string;
  };
  employee?: {
    id: number;
    email: string;
    user_info?: {
      id: number;
      user_id: number;
      first_name?: string;
      last_name?: string;
    };
  };
  creator?: {
    id: number;
    email: string;
    name?: string;
  };
}

export interface CreateLoanRequest {
  user_id: number;
  branch_id: number;
  loan_type: string;
  principal_amount: number;
  interest_rate?: number | null;
  total_amount?: number;
  deduction_per_cutoff: number;
  remaining_balance?: number;
  start_date: string;
  end_date?: string | null;
  status?: string;
  remarks?: string | null;
}

export interface UpdateLoanRequest {
  user_id?: number;
  branch_id?: number;
  loan_type?: string;
  principal_amount?: number;
  interest_rate?: number | null;
  total_amount?: number;
  deduction_per_cutoff?: number;
  remaining_balance?: number;
  start_date?: string;
  end_date?: string | null;
  status?: string;
  remarks?: string | null;
}

export const loanService = {
  async getAll(): Promise<Loan[]> {
    const response = await api(API_ENDPOINTS.DEDUCTIONS.LOAN.BASE);
    return response.data || response;
  },

  async getById(id: number): Promise<Loan> {
    const response = await api(API_ENDPOINTS.DEDUCTIONS.LOAN.GET.replace('{id}', id.toString()));
    return response.data || response;
  },

  async create(data: CreateLoanRequest): Promise<Loan> {
    const response = await api(API_ENDPOINTS.DEDUCTIONS.LOAN.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data || response;
  },

  async update(id: number, data: UpdateLoanRequest): Promise<Loan> {
    const response = await api(API_ENDPOINTS.DEDUCTIONS.LOAN.UPDATE.replace('{id}', id.toString()), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data || response;
  },

  async delete(id: number): Promise<void> {
    return await api(API_ENDPOINTS.DEDUCTIONS.LOAN.DELETE.replace('{id}', id.toString()), {
      method: 'DELETE',
    });
  },
};
