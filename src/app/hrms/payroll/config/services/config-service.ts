import { api } from '@/services/api';
import { API_ENDPOINTS } from '@/config/api.config';

export interface PayrollComponent {
  id?: number;
  group: string;
  category?: 'earnings' | 'deductions';
  code: string;
  label: string;
  value: string | number;
  is_rate?: boolean;
  assigned_count?: number;
}

export interface PayrollPosition {
  id?: number;
  branch_id: number;
  code: string;
  name: string;
  base_salary: number;
  allowance_id?: number | null;
  is_active: boolean;
  user_infos?: Array<{
    id: number;
    user_id: number;
    first_name?: string;
    last_name?: string;
    user?: { id: number; email: string; user_info?: { first_name?: string; last_name?: string } };
  }>;
  branch?: { id: number; name: string };
  allowance?: { id: number; label: string; value: string };
}

export interface ComputationData {
  components: PayrollComponent[];
  positions: PayrollPosition[];
  roles: { id: number; name: string }[];
  branches: { id: number; name: string }[];
  currency_symbol: string;
  assignment_counts: Record<string, number>;
}

export interface UpdatePayRequest {
  user_info_id: number;
  branch_id: number;
  name?: string;
  base_salary: number;
  code?: string;
}

export interface UpdateRateRequest {
  /**
   * Preferred: upsert arbitrary rate items (data-driven UI).
   * Backend should accept this payload and persist to payroll_config using the provided group.
   */
  rates?: Array<{
    code: string;
    label: string;
    value: number;
    is_rate: 0 | 1;
    group?: string;
    category?: 'earnings' | 'deductions';
  }>;
  delete_codes?: string[];
  delete_group?: string;
  delete_category?: 'earnings' | 'deductions';
  delete_items?: Array<{
    code: string;
    group?: string;
    category?: 'earnings' | 'deductions';
  }>;

  /**
   * Legacy: keep backwards compatibility with existing backend payload shape.
   */
  nightpay?: number;
  restpay?: number;
  holiday?: number;
  ot_regular?: number;
  ot_restday?: number;
  ot_holiday?: number;
  sss?: number;
  philhealth?: number;
  pagibig?: number;
}

export interface UpdateCompenOrDeducRequest {
  earnings?: Array<{ label: string; amount: number }>;
  deductions?: Array<{ label: string; amount: number }>;
}

export interface DeleteComponentRequest {
  code: string;
  group?: string;
  category?: 'earnings' | 'deductions';
}

export interface PayrollItemEmployee {
  id: number;
  name: string;
  email: string;
  is_assigned: boolean;
}

export interface PayrollItemEmployeesResponse {
  item: {
    id: number;
    code: string;
    label: string;
    group: string;
    category?: 'earnings' | 'deductions';
  };
  assigned_user_ids: number[];
  employees: PayrollItemEmployee[];
}

const normalizeComputationData = (payload: any): ComputationData => {
  const source = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
  return {
    components: Array.isArray(source?.components)
      ? source.components.map((component: PayrollComponent) => ({
        ...component,
        assigned_count: Number(source?.assignment_counts?.[String(component.id ?? '')] || 0),
      }))
      : [],
    positions: Array.isArray(source?.positions) ? source.positions : [],
    roles: Array.isArray(source?.roles) ? source.roles : [],
    branches: Array.isArray(source?.branches) ? source.branches : [],
    currency_symbol: typeof source?.currency_symbol === 'string' ? source.currency_symbol : 'P',
    assignment_counts: (source?.assignment_counts && typeof source.assignment_counts === 'object')
      ? source.assignment_counts
      : {},
  };
};

export const configService = {
  async getComputationData(): Promise<ComputationData> {
    const response = await api(API_ENDPOINTS.PAYROLL.CONFIG.DATA);
    return normalizeComputationData(response);
  },

  async getDynamicData(): Promise<{ earnings: PayrollComponent[]; deductions: PayrollComponent[] }> {
    return await api(API_ENDPOINTS.PAYROLL.CONFIG.DYNAMIC_DATA);
  },

  async updatePay(data: UpdatePayRequest): Promise<PayrollPosition[]> {
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

  async getItemEmployees(itemId: number): Promise<PayrollItemEmployeesResponse> {
    const endpoint = API_ENDPOINTS.PAYROLL.CONFIG.ITEM_EMPLOYEES.replace('{id}', String(itemId));
    return await api(endpoint);
  },

  async updateItemEmployees(itemId: number, userIds: number[]): Promise<{ message: string; payroll_config_id: number; assigned_user_ids: number[] }> {
    const endpoint = API_ENDPOINTS.PAYROLL.CONFIG.ITEM_EMPLOYEES.replace('{id}', String(itemId));
    return await api(endpoint, {
      method: 'PUT',
      body: JSON.stringify({ user_ids: userIds }),
    });
  },
};
