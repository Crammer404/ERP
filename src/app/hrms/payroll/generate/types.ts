import type { PayrollReport as ServicePayrollReport } from './services/generate-service';

export interface PayrollReport {
  id: number;
  dateRange: string;
  payrollType: string;
  employeeCount: number;
  totalBasicPay: number;
  totalNightDiff: number;
  totalOvertime: number;
  totalOtherEarnings: number;
  totalOtherDeductions: number;
  totalSSS: number;
  totalPhilHealth: number;
  totalPagIBIG: number;
  totalIncomeTax: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  generatedBy: string;
  generatedDate: string;
}

export type EditablePayslipFields = {
  basic_pay: number;
  overtime_pay: number;
  night_diff: number;
  income_tax: number;
  sss: number;
  pagibig: number;
  philhealth: number;
  gross: number;
  net: number;
};

export const mapBackendToFrontend = (
  backend: ServicePayrollReport,
  formatDateRange: (value: string) => string
): PayrollReport => ({
  id: backend.id,
  dateRange: formatDateRange(backend.date_range),
  payrollType: backend.payroll_type,
  employeeCount: backend.total_employees,
  totalBasicPay: backend.total_basic_pay,
  totalNightDiff: backend.total_night_differential,
  totalOvertime: backend.total_overtime,
  totalOtherEarnings: backend.total_other_earnings,
  totalOtherDeductions: backend.total_other_deductions,
  totalSSS: backend.total_sss,
  totalPhilHealth: backend.total_philhealth,
  totalPagIBIG: backend.total_pagibig,
  totalIncomeTax: backend.total_income_tax,
  totalGrossPay: backend.total_gross,
  totalDeductions: backend.total_deductions,
  totalNetPay: backend.total_net,
  generatedBy: backend.generated_by,
  generatedDate: backend.generated_at || '',
});
