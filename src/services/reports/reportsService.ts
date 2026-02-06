import { api } from '../api';
import { API_ENDPOINTS } from '../../config/api.config';

export interface SalesReport {
  period: string;
  total_sales: number;
  total_transactions: number;
  average_transaction: number;
  top_products: Array<{
    product_id: number;
    product_name: string;
    quantity_sold: number;
    revenue: number;
  }>;
}

export interface PayrollReport {
  period: string;
  total_employees: number;
  total_payroll: number;
  average_salary: number;
  overtime_hours: number;
  overtime_pay: number;
}

export interface InventoryReport {
  total_products: number;
  low_stock_items: number;
  out_of_stock_items: number;
  total_inventory_value: number;
  top_moving_products: Array<{
    product_id: number;
    product_name: string;
    quantity_moved: number;
  }>;
}

export interface DTRReport {
  period: string;
  total_employees: number;
  total_hours_worked: number;
  average_hours_per_employee: number;
  overtime_hours: number;
  attendance_rate: number;
}

export interface DashboardReport {
  sales: {
    today: number;
    this_week: number;
    this_month: number;
  };
  payroll: {
    current_period: number;
    pending_approvals: number;
  };
  inventory: {
    low_stock_alerts: number;
    total_products: number;
  };
  dtr: {
    active_employees: number;
    pending_checkouts: number;
  };
}

export const reportsService = {
  // Get sales report
  async getSalesReport(period?: string): Promise<SalesReport> {
    const endpoint = period 
      ? `${API_ENDPOINTS.REPORTS.SALES}?period=${period}`
      : API_ENDPOINTS.REPORTS.SALES;
    return await api(endpoint);
  },

  // Get payroll report
  async getPayrollReport(period?: string): Promise<PayrollReport> {
    const endpoint = period 
      ? `${API_ENDPOINTS.REPORTS.PAYROLL}?period=${period}`
      : API_ENDPOINTS.REPORTS.PAYROLL;
    return await api(endpoint);
  },

  // Get inventory report
  async getInventoryReport(): Promise<InventoryReport> {
    return await api(API_ENDPOINTS.REPORTS.INVENTORY);
  },

  // Get DTR report
  async getDTRReport(period?: string): Promise<DTRReport> {
    const endpoint = period 
      ? `${API_ENDPOINTS.REPORTS.DTR}?period=${period}`
      : API_ENDPOINTS.REPORTS.DTR;
    return await api(endpoint);
  },

  // Get dashboard report
  async getDashboardReport(): Promise<DashboardReport> {
    return await api(API_ENDPOINTS.REPORTS.DASHBOARD);
  },
};
