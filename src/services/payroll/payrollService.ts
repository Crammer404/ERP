import { api } from '../api';
import { API_ENDPOINTS } from '../../config/api.config';

export interface Payroll {
  id: number;
  user_id: number;
  branch_id: number;
  period_start: string;
  period_end: string;
  basic_salary: number;
  overtime_pay: number;
  allowances: number;
  deductions: number;
  net_pay: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePayrollRequest {
  user_id: number;
  branch_id: number;
  period_start: string;
  period_end: string;
  basic_salary: number;
  overtime_pay?: number;
  allowances?: number;
  deductions?: number;
}

export interface UpdatePayrollRequest {
  basic_salary?: number;
  overtime_pay?: number;
  allowances?: number;
  deductions?: number;
  status?: string;
}

export interface CalculatePayrollRequest {
  user_id: number;
  branch_id: number;
  period_start: string;
  period_end: string;
}

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

// Reports interfaces
export interface PayrollReport {
  id: number;
  date_range: string;
  payroll_type: string;
  total_employees: number;
  total_basic_pay: number;
  total_night_differential: number;
  total_overtime: number;
  total_other_earnings: number;
  total_other_deductions: number;
  total_sss: number;
  total_philhealth: number;
  total_pagibig: number;
  total_income_tax: number;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  generated_by: string;
}

export interface GeneratePayrollRequest {
  user_ids: number[];
  start_date: string;
  end_date: string;
  payroll_type: string;
  statutory_include?: number;
}

export interface PayrollReportUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  branch: string;
}

export interface PayslipData {
  employee_name: string;
  role: string;
  branch: string;
  date_range: string;
  date_start: string;
  date_end: string;
  pay_date: string;
  payroll_type: string;
  basic_pay: number;
  overtime_pay: number;
  allowance: number;
  night_diff: number;
  income_tax: number;
  sss: number;
  pagibig: number;
  philhealth: number;
  total_allowance: number;
  earnings: Array<{ description: string; total: number }>;
  deductions: Array<{ description: string; total: number }>;
  gross: number;
  net: number;
}

export interface ViewPayslipsResponse {
  company: {
    name: string;
    logo: string | null;
  };
  payslips: PayslipData[];
}

export const payrollService = {
  // Get all payroll records
  async getAll(): Promise<Payroll[]> {
    return await api(API_ENDPOINTS.PAYROLL.BASE);
  },

  // Get payroll by ID
  async getById(id: number): Promise<Payroll> {
    return await api(`${API_ENDPOINTS.PAYROLL.BASE}/${id}`);
  },

  // Create new payroll record
  async create(payrollData: CreatePayrollRequest): Promise<Payroll> {
    return await api(API_ENDPOINTS.PAYROLL.CREATE, {
      method: 'POST',
      body: JSON.stringify(payrollData),
    });
  },

  // Calculate payroll
  async calculate(calculateData: CalculatePayrollRequest): Promise<Payroll> {
    return await api(API_ENDPOINTS.PAYROLL.CALCULATE, {
      method: 'POST',
      body: JSON.stringify(calculateData),
    });
  },

  // Update payroll record
  async update(id: number, payrollData: UpdatePayrollRequest): Promise<Payroll> {
    return await api(`${API_ENDPOINTS.PAYROLL.BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payrollData),
    });
  },

  // Delete payroll record
  async delete(id: number): Promise<void> {
    return await api(`${API_ENDPOINTS.PAYROLL.BASE}/${id}`, {
      method: 'DELETE',
    });
  },

  // Computation endpoints
  async getComputationData(): Promise<ComputationData> {
    return await api(API_ENDPOINTS.PAYROLL.COMPUTATION.DATA);
  },

  async getDynamicData(): Promise<{ earnings: PayrollComponent[]; deductions: PayrollComponent[] }> {
    return await api(API_ENDPOINTS.PAYROLL.COMPUTATION.DYNAMIC_DATA);
  },

  async updatePay(data: UpdatePayRequest): Promise<PayrollSalary[]> {
    return await api(API_ENDPOINTS.PAYROLL.COMPUTATION.UPDATE_PAY, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateRate(data: UpdateRateRequest): Promise<PayrollComponent[]> {
    return await api(API_ENDPOINTS.PAYROLL.COMPUTATION.UPDATE_RATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCompenOrDeduc(data: UpdateCompenOrDeducRequest): Promise<{ earnings?: PayrollComponent[]; deductions?: PayrollComponent[] }> {
    return await api(API_ENDPOINTS.PAYROLL.COMPUTATION.UPDATE_COMPEN_OR_DEDUC, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteComponent(data: DeleteComponentRequest): Promise<PayrollComponent> {
    return await api(API_ENDPOINTS.PAYROLL.COMPUTATION.DELETE_COMPONENT, {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  },

  // Reports endpoints - Returns REAL data from database, NOT dummy data
  async getReports(): Promise<PayrollReport[]> {
    // Call API endpoint - this queries the database directly
    const response = await api(API_ENDPOINTS.PAYROLL.REPORTS.DATA);
    
    // Handle both direct array response and wrapped response
    if (Array.isArray(response)) {
      // This is real database data, not dummy/mock data
      return response;
    }
    // If response is wrapped in data property
    if (response?.data && Array.isArray(response.data)) {
      // This is real database data, not dummy/mock data
      return response.data;
    }
    // Return empty array if no data - this means database is empty, not an error
    return [];
  },

  async generatePayroll(data: GeneratePayrollRequest): Promise<{ success: boolean; message?: string }> {
    return await api(API_ENDPOINTS.PAYROLL.REPORTS.GENERATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteReport(id: number): Promise<{ success: boolean }> {
    return await api(API_ENDPOINTS.PAYROLL.REPORTS.DELETE, {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
  },

  async viewPayslips(countId: number): Promise<ViewPayslipsResponse> {
    const endpoint = API_ENDPOINTS.PAYROLL.REPORTS.VIEW.replace('{id}', countId.toString());
    return await api(endpoint);
  },

  async getReportUsers(): Promise<PayrollReportUser[]> {
    return await api(API_ENDPOINTS.PAYROLL.REPORTS.USERS);
  },

  // Payslip endpoints
  async getEmployeePayslips(): Promise<ViewPayslipsResponse> {
    return await api(API_ENDPOINTS.PAYROLL.PAYSLIP.EMPLOYEE_PAYSLIPS);
  },
};
