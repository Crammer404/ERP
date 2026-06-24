import { api } from '@/services/api';
import { API_ENDPOINTS } from '@/config/api.config';

export type RateType = 'monthly' | 'daily' | 'hourly';

export const WORKING_DAYS_PER_MONTH = 22;
export const WORKING_HOURS_PER_DAY = 8;
export const TOTAL_WORKING_HOURS_PER_MONTH = WORKING_DAYS_PER_MONTH * WORKING_HOURS_PER_DAY;

export interface ComputedRates {
  base_salary: number;
  daily_rate: number;
  hourly_rate: number;
}

const round = (value: number, decimals: number): number => {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

export const computeRates = (rateType: RateType, amount: number): ComputedRates => {
  const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;

  switch (rateType) {
    case 'daily':
      return {
        base_salary: round(safeAmount * WORKING_DAYS_PER_MONTH, 2),
        daily_rate: round(safeAmount, 2),
        hourly_rate: round(safeAmount / WORKING_HOURS_PER_DAY, 4),
      };
    case 'hourly':
      return {
        base_salary: round(safeAmount * TOTAL_WORKING_HOURS_PER_MONTH, 2),
        daily_rate: round(safeAmount * WORKING_HOURS_PER_DAY, 2),
        hourly_rate: round(safeAmount, 4),
      };
    case 'monthly':
    default:
      return {
        base_salary: round(safeAmount, 2),
        daily_rate: round(safeAmount / WORKING_DAYS_PER_MONTH, 2),
        hourly_rate: round(safeAmount / TOTAL_WORKING_HOURS_PER_MONTH, 4),
      };
  }
};

export const getAmountForRateType = (
  rateType: RateType,
  rates: { base_salary?: number | string; daily_rate?: number | string; hourly_rate?: number | string }
): number => {
  const toNum = (v: number | string | undefined) => {
    if (v === undefined || v === null || v === '') return 0;
    const n = typeof v === 'number' ? v : parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };
  switch (rateType) {
    case 'daily':
      return toNum(rates.daily_rate);
    case 'hourly':
      return toNum(rates.hourly_rate);
    case 'monthly':
    default:
      return toNum(rates.base_salary);
  }
};

export interface PayrollPosition {
  id: number;
  branch_id: number;
  code: string;
  name: string;
  base_salary: number;
  daily_rate: number;
  hourly_rate: number;
  rate_type: RateType;
  allowance_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  branch?: {
    id: number;
    name: string;
    branch_code: string;
  };
  user_infos?: Array<{
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
  }>;
  allowance?: {
    id: number;
    label: string;
    value: string;
  };
}

export interface CreatePositionRequest {
  branch_id: number;
  name: string;
  rate_type: RateType;
  base_salary: number;
  daily_rate: number;
  hourly_rate: number;
  allowance_id?: number | null;
  is_active?: boolean;
  user_info_ids?: number[];
}

export interface UpdatePositionRequest {
  branch_id?: number;
  name?: string;
  rate_type?: RateType;
  base_salary?: number;
  daily_rate?: number;
  hourly_rate?: number;
  allowance_id?: number | null;
  is_active?: boolean;
  user_info_ids?: number[];
}

export const positionService = {
  async getAll(branchId?: number | null): Promise<PayrollPosition[]> {
    const params =
      branchId != null && Number.isFinite(branchId) && branchId > 0
        ? `?branch_id=${branchId}`
        : '';
    return await api(`${API_ENDPOINTS.PAYROLL.POSITIONS.BASE}${params}`);
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
