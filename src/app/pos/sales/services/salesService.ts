// src/services/posService.ts
import { api } from "../../../../services/api";
import { API_ENDPOINTS } from "../../../../config/api.config";

// ============================
// Product Services
// ============================

// Fetch all products
export async function fetchProducts() {
  try {
    const response = await api(API_ENDPOINTS.PRODUCTS.BASE);
    return response; // { message, data }
  } catch (error: any) {
    console.error("Failed to fetch products:", error);
    throw error;
  }
}

// Fetch a single product
export async function fetchProductById(id: number) {
  try {
    const url = API_ENDPOINTS.PRODUCTS.UPDATE.replace("{id}", id.toString());
    const response = await api(url);
    return response;
  } catch (error: any) {
    console.error(`Failed to fetch product ${id}:`, error);
    throw error;
  }
}
// Fetch active taxes
export async function fetchActiveTaxes() {
  try {
    const response = await api(API_ENDPOINTS.TAXES.ACTIVE);
    return response; // { message, data }
  } catch (error: any) {
    console.error("Failed to fetch active taxes:", error);
    throw error;
  }
}
// Fetch active payment methods
export async function fetchActivePaymentMethods() {
  try {
    const response = await api(API_ENDPOINTS.PAYMENT_METHODS.ACTIVE);
    return response; // { message, data }
  } catch (error: any) {
    console.error("Failed to fetch active payment methods:", error);
    throw error;
  }
}

// Fetch all categories
export async function fetchCategories(branchId?: number) {
  try {
    const url = branchId 
      ? `${API_ENDPOINTS.CATEGORIES.BASE}?branch_id=${branchId}`
      : API_ENDPOINTS.CATEGORIES.BASE;
    const response = await api(url);
    return response; // { message, data }
  } catch (error: any) {
    console.error("Failed to fetch categories:", error);
    throw error;
  }
}

interface TransactionPayload {
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
  order_items: { stock_id: number; quantity: number; discounts: number[] }[];
  taxes: number[];
}

export async function postTransaction(payload: TransactionPayload) {
  return await api(API_ENDPOINTS.TRANSACTIONS.BASE, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  });
}


export default api;
