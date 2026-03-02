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
};
