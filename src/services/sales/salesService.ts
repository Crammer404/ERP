import { api } from '../api';
import { API_ENDPOINTS } from '../../config/api.config';

// Sales/POS Transaction types (renamed to avoid conflict with general Transaction)
export interface SalesTransaction {
  id: number;
  reference_no: number;
  created_by: number;
  tenant_id: number;
  branch_id: number;
  payment_method_id: number;
  is_dine_in: boolean;
  status: string;
  paid_amount: number;
  sub_total: number;
  grand_total: number;
  total_discount: number;
  total_tax: number;
  change: number;
  due_amount: number;
}

export interface CreateSaleRequest {
  branch_id: number;
  user_id: number;
  customer_name?: string;
  total_amount: number;
  discount?: number;
  tax?: number;
  payment_method: string;
}

export interface UpdateSaleRequest {
  customer_name?: string;
  total_amount?: number;
  discount?: number;
  tax?: number;
  payment_method?: string;
  status?: string;
}

export interface CreateSalesTransactionRequest {
  created_by: number;
  payment_method_id: number;
  is_dine_in: boolean;
  status: string;
  paid_amount: number;
  sub_total: number;
  grand_total: number;
  total_discount: number;
  total_tax: number;
  change: number;
  due_amount: number;
  customer_id?: number;
  branch_id?: number;
  order_items: Array<{
    stock_id: number;
    quantity: number;
    discounts?: number[];
  }>;
  taxes: number[];
}

export const salesService = {
  // Get all sales records
  async getAll(): Promise<SalesTransaction[]> {
    return await api(API_ENDPOINTS.SALES.BASE);
  },

  // Get sale by ID
  async getById(id: number): Promise<SalesTransaction> {
    return await api(`${API_ENDPOINTS.SALES.BASE}/${id}`);
  },

  // Create new sale
  async create(saleData: CreateSaleRequest): Promise<SalesTransaction> {
    return await api(API_ENDPOINTS.SALES.CREATE, {
      method: 'POST',
      body: JSON.stringify(saleData),
    });
  },

  // POS transaction
  // DEPRECATED: This endpoint doesn't exist in backend (SalesController missing)
  // Use TRANSACTIONS.CREATE endpoint instead via TransactionController
  async pos(posData: CreateSalesTransactionRequest): Promise<SalesTransaction> {
    // Use the correct transactions endpoint instead of the non-existent /pos/sales/pos
    return await api(API_ENDPOINTS.TRANSACTIONS.CREATE, {
      method: 'POST',
      body: JSON.stringify(posData),
    });
  },

  // Update sale
  async update(id: number, saleData: UpdateSaleRequest): Promise<SalesTransaction> {
    return await api(`${API_ENDPOINTS.SALES.BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(saleData),
    });
  },

  // Delete sale
  async delete(id: number): Promise<void> {
    return await api(`${API_ENDPOINTS.SALES.BASE}/${id}`, {
      method: 'DELETE',
    });
  },

  // Get sale receipts
  async getReceipts(id: number): Promise<any[]> {
    return await api(API_ENDPOINTS.SALES.RECEIPTS.replace('{id}', id.toString()));
  },
};
