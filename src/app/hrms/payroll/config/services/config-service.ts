import { api } from '@/services/api';
import { API_ENDPOINTS } from '@/config/api.config';

export interface PayrollComponent {
  id?: number;
  group: string;
  code: string;
  label: string;
  value: string | number;
  is_rate?: boolean;
}

export interface PayrollSalary {
  id?: number;
  role_id: number;
  branch_id: number;
  monthly_salary: number;
  role?: { id: number; name: string };
  branch?: { id: number; name: string };
}

export interface ComputationData {
  components: PayrollComponent[];
  salaries: PayrollSalary[];
  roles: { id: number; name: string }[];
  branches: { id: number; name: string }[];
  currency_symbol: string;
}

export interface UpdatePayRequest {
  role_id: number;
  branch_id: number;
  monthly: number;
}

export interface UpdateRateRequest {
  nightpay?: number;
  restpay?: number;
  holiday?: number;
  ot_regular?: number;
  ot_restday?: number;
  ot_holiday?: number;
  sss?: number;
  philhealth?: number;
  pagibig?: number;
  f_sss?: number;
  f_philhealth?: number;
  f_pagibig?: number;
}

export interface UpdateCompenOrDeducRequest {
  earnings?: Array<{ label: string; amount: number }>;
  deductions?: Array<{ label: string; amount: number }>;
}

export interface DeleteComponentRequest {
  code: string;
  group: 'earnings' | 'deductions';
}

export const configService = {
  async getComputationData(): Promise<ComputationData> {
    return await api(API_ENDPOINTS.PAYROLL.CONFIG.DATA);
  },

  async getDynamicData(): Promise<{ earnings: PayrollComponent[]; deductions: PayrollComponent[] }> {
    return await api(API_ENDPOINTS.PAYROLL.CONFIG.DYNAMIC_DATA);
  },

  async updatePay(data: UpdatePayRequest): Promise<PayrollSalary[]> {
    return await api(API_ENDPOINTS.PAYROLL.CONFIG.UPDATE_PAY, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateRate(data: UpdateRateRequest): Promise<PayrollComponent[]> {
    return await api(API_ENDPOINTS.PAYROLL.CONFIG.UPDATE_RATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCompenOrDeduc(data: UpdateCompenOrDeducRequest): Promise<{ earnings?: PayrollComponent[]; deductions?: PayrollComponent[] }> {
    return await api(API_ENDPOINTS.PAYROLL.CONFIG.UPDATE_COMPEN_OR_DEDUC, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteComponent(data: DeleteComponentRequest): Promise<PayrollComponent> {
    return await api(API_ENDPOINTS.PAYROLL.CONFIG.DELETE_COMPONENT, {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  },
};
