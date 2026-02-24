import { api } from '@/services/api';
import { API_ENDPOINTS } from '@/config/api.config';

export interface PayrollPosition {
  id: number;
  branch_id: number;
  user_id: number;
  code: string;
  name: string;
  base_salary: number;
  allowance_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  branch?: {
    id: number;
    name: string;
    branch_code: string;
  };
  user?: {
    id: number;
    email: string;
    user_info?: {
      first_name: string;
      last_name: string;
    };
  };
  allowance?: {
    id: number;
    label: string;
    value: string;
  };
}

export interface CreatePositionRequest {
  branch_id: number;
  user_id: number;
  name: string;
  base_salary: number;
  allowance_id?: number | null;
  is_active?: boolean;
}

export interface UpdatePositionRequest {
  branch_id?: number;
  user_id?: number;
  name?: string;
  base_salary?: number;
  allowance_id?: number | null;
  is_active?: boolean;
}

export const positionService = {
  async getAll(): Promise<PayrollPosition[]> {
    return await api(API_ENDPOINTS.PAYROLL.POSITIONS.BASE);
  },

  async getById(id: number): Promise<PayrollPosition> {
    return await api(API_ENDPOINTS.PAYROLL.POSITIONS.GET.replace('{id}', id.toString()));
  },

  async create(data: CreatePositionRequest): Promise<PayrollPosition> {
    return await api(API_ENDPOINTS.PAYROLL.POSITIONS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: number, data: UpdatePositionRequest): Promise<PayrollPosition> {
    return await api(API_ENDPOINTS.PAYROLL.POSITIONS.UPDATE.replace('{id}', id.toString()), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<void> {
    return await api(API_ENDPOINTS.PAYROLL.POSITIONS.DELETE.replace('{id}', id.toString()), {
      method: 'DELETE',
    });
  },
};
