import { api } from '@/services';
import { API_CONFIG, API_ENDPOINTS } from '@/config/api.config';

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
  include_cola?: number;
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
  worked_days?: number;
  regular_hours_worked?: number;
  late_days?: number;
  late_minutes?: number;
  overtime_days?: number;
  overtime_minutes?: number;
  restday_days?: number;
  restday_hours?: number;
  holiday_days?: number;
  holiday_hours?: number;
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

export const generateService = {
  async getReports(): Promise<PayrollReport[]> {
    const response = await api(API_ENDPOINTS.PAYROLL.REPORTS.DATA);

    if (Array.isArray(response)) {
      return response;
    }
    if (response?.data && Array.isArray(response.data)) {
      return response.data;
    }
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

  async viewPayslips(id: number): Promise<ViewPayslipsResponse> {
    const endpoint = API_ENDPOINTS.PAYROLL.REPORTS.VIEW.replace('{id}', id.toString());
    return await api(endpoint);
  },

  async getReportUsers(): Promise<PayrollReportUser[]> {
    const response = await api(API_ENDPOINTS.PAYROLL.REPORTS.USERS);
    if (Array.isArray(response)) {
      return response;
    }
    if (Array.isArray(response?.data)) {
      return response.data;
    }
    if (Array.isArray(response?.data?.data)) {
      return response.data.data;
    }
    return [];
  },

  async getEmployeePayslips(): Promise<ViewPayslipsResponse> {
    return await api(API_ENDPOINTS.PAYROLL.PAYSLIP.EMPLOYEE_PAYSLIPS);
  },

  async exportPayslipsExcel(id: number): Promise<void> {
    const endpoint = API_ENDPOINTS.PAYROLL.REPORTS.EXPORT.replace('{id}', id.toString());
    let tenantId = '';
    let branchId = '';
    const authToken = localStorage.getItem('token');
    try {
      tenantId = String(JSON.parse(localStorage.getItem('tenant_context') || '{}')?.id || '');
      branchId = String(JSON.parse(localStorage.getItem('branch_context') || '{}')?.id || '');
    } catch {
      tenantId = '';
      branchId = '';
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        'X-Tenant-ID': tenantId,
        'X-Branch-ID': branchId,
      },
    });

    if (!response.ok) {
      let errorMessage = 'Failed to export payslips.';
      try {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await response.json();
          errorMessage = data?.message || errorMessage;
        } else {
          const text = await response.text();
          if (text) errorMessage = text;
        }
      } catch {
        // no-op
      }
      throw new Error(errorMessage);
    }

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    const isBinarySpreadsheet =
      contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') ||
      contentType.includes('application/octet-stream');
    const isHtmlOrJson = contentType.includes('text/html') || contentType.includes('application/json');

    if (isHtmlOrJson && !isBinarySpreadsheet) {
      let details = 'Server returned a non-Excel response.';
      try {
        const text = await response.text();
        if (text) details = text.slice(0, 300);
      } catch {
        // no-op
      }
      throw new Error(`Export did not return a valid Excel file. ${details}`);
    }

    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `Payroll_Payslips_${id}.xlsx`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
      if (filenameMatch?.[1]) {
        filename = filenameMatch[1];
      }
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

