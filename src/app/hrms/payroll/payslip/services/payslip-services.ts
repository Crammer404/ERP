import { api } from '@/services';
import { API_ENDPOINTS } from '@/config/api.config';
import type { ViewPayslipsResponse, PayslipData } from '@/app/hrms/payroll/generate/services/generate-service';

export type { PayslipData, ViewPayslipsResponse };

export const payslipService = {
  async getEmployeePayslips(): Promise<ViewPayslipsResponse> {
    return await api(API_ENDPOINTS.PAYROLL.PAYSLIP.EMPLOYEE_PAYSLIPS);
  },
};

