'use client';

import { api } from "../../../services/api";
import { API_ENDPOINTS } from "../../../config/api.config";

export interface Purchase {
  id: number;
  invoice_no: number;
  date: string;
  subtotal: number;
  items_total_discount: number;
  invoice_discount: number;
  total_discount: number;
  grand_total: number;
  paid_amount: number;
  due: number;
  change: number;
  check_number: string | null;
  check_date: string | null;
  status: string;
  created_at: string;
  creator: {
    id: number;
    name: string;
  };
  supplier: {
    id: number;
    supplier_category: {
      id: number;
      name: string;
    };
    name: string;
    email: string;
    phone_number: string;
    description: string;
  };
  branch: {
    id: number;
    name: string;
  };
  payment_method: {
    id: number;
    name: string;
    slug: string;
  };
  purchase_items: Array<{
    id: number;
    purchase_id: number;
    quantity: number;
    discount: number;
    product: {
      id: number;
      name: string;
      description: string;
      display_image: string | null;
      branch_id: number;
      tenant_id: number;
      low_stock_threshold: number | null;
      status: string;
      stocks: Array<{
        id: number;
        product_id: number;
        cost: string;
        profit_margin: number;
        selling_price: string;
        quantity: number;
        low_stock_threshold: number;
      }>;
    };
  }>;
}

export async function fetchPurchasesBySupplier(supplierId: number): Promise<Purchase[]> {
  try {
    const response = await api(`${API_ENDPOINTS.PURCHASES.BASE}?supplier_id=${supplierId}`);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching purchases by supplier:', error);
    throw error;
  }
}

export async function fetchPurchaseById(purchaseId: number): Promise<Purchase> {
  try {
    const response = await api(`${API_ENDPOINTS.PURCHASES.BASE}/${purchaseId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching purchase by ID:', error);
    throw error;
  }
}