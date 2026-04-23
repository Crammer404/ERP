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
  generated_at?: string;
}

export interface GeneratePayrollRequest {
  user_ids: number[];
  start_date: string;
  end_date: string;
  payroll_type: string;
  statutory_include?: number;
  include_cola?: number;
}

export interface GeneratePayrollResponse {
  success: boolean;
  message?: string;
  action?: 'created' | 'updated';
  payroll_count_id?: number;
  merged_users_count?: number;
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
  id: number;
  employee_name: string;
  profile_pic?: string | null;
  position: string;
  branch: string;
  date_range: string;
  date_start: string;
  date_end: string;
  pay_date: string;
  generated_at?: string;
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

  async generatePayroll(data: GeneratePayrollRequest): Promise<GeneratePayrollResponse> {
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

  async updatePayslip(payload: {
    payslip_id: number;
    basic_pay: number;
    overtime_pay: number;
    night_diff: number;
    income_tax: number;
    sss: number;
    pagibig: number;
    philhealth: number;
    gross: number;
    net: number;
  }): Promise<{ success: boolean; message?: string }> {
    return await api(API_ENDPOINTS.PAYROLL.REPORTS.PAYSLIP_UPDATE, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async deletePayslip(payslipId: number): Promise<{ success: boolean; message?: string }> {
    return await api(API_ENDPOINTS.PAYROLL.REPORTS.PAYSLIP_DELETE, {
      method: 'POST',
      body: JSON.stringify({ payslip_id: payslipId }),
    });
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

  async exportPayslipsExcel(
    id: number,
    options?: {
      onProgress?: (state: { percent: number; phase: 'preparing' | 'downloading' | 'saving' }) => void;
    }
  ): Promise<void> {
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

    const onProgress = options?.onProgress;
    let waitingTimer: ReturnType<typeof setInterval> | null = null;
    let waitingValue = 0;

    const startPreparingPulse = () => {
      onProgress?.({ percent: 0, phase: 'preparing' });
      waitingTimer = setInterval(() => {
        waitingValue = Math.min(waitingValue + 1.25, 36);
        onProgress?.({ percent: Math.round(waitingValue), phase: 'preparing' });
      }, 320);
    };

    const stopPreparingPulse = () => {
      if (waitingTimer) {
        clearInterval(waitingTimer);
        waitingTimer = null;
      }
    };

    startPreparingPulse();

    let response: Response;
    try {
      response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          'X-Tenant-ID': tenantId,
          'X-Branch-ID': branchId,
        },
      });
    } finally {
      stopPreparingPulse();
    }

    if (!response.ok) {
      let errorMessage = 'Failed to export payslips.';
      try {
        const ct = response.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
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

    const contentTypeHeader = (response.headers.get('content-type') || '').toLowerCase();
    const isBinarySpreadsheet =
      contentTypeHeader.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') ||
      contentTypeHeader.includes('application/octet-stream');
    const isHtmlOrJson = contentTypeHeader.includes('text/html') || contentTypeHeader.includes('application/json');

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

    onProgress?.({ percent: 40, phase: 'downloading' });

    const contentLengthRaw = response.headers.get('content-length');
    const totalBytes = contentLengthRaw ? parseInt(contentLengthRaw, 10) : 0;
    const body = response.body;

    let blob: Blob;

    if (body && typeof body.getReader === 'function' && Number.isFinite(totalBytes) && totalBytes > 0) {
      const reader = body.getReader();
      const chunks: BlobPart[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value?.byteLength) {
          chunks.push(value);
          received += value.byteLength;
          const pct = 40 + Math.min(58, Math.round((received / totalBytes) * 58));
          onProgress?.({ percent: Math.min(pct, 98), phase: 'downloading' });
        }
      }

      onProgress?.({ percent: 99, phase: 'saving' });
      const mime =
        contentTypeHeader.includes('spreadsheet') || contentTypeHeader.includes('excel')
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : response.headers.get('content-type') || 'application/octet-stream';
      blob = new Blob(chunks, { type: mime });
    } else if (body && typeof body.getReader === 'function') {
      const reader = body.getReader();
      const chunks: BlobPart[] = [];
      let displayed = 40;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value?.byteLength) {
          chunks.push(value);
          displayed = Math.min(96, displayed + 2.5);
          onProgress?.({ percent: Math.round(displayed), phase: 'downloading' });
        }
      }

      onProgress?.({ percent: 99, phase: 'saving' });
      const mime =
        contentTypeHeader.includes('spreadsheet') || contentTypeHeader.includes('excel')
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : response.headers.get('content-type') || 'application/octet-stream';
      blob = new Blob(chunks, { type: mime });
    } else {
      blob = await response.blob();
      onProgress?.({ percent: 95, phase: 'downloading' });
    }

    onProgress?.({ percent: 100, phase: 'saving' });

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

