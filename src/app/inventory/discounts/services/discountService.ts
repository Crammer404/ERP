// src/services/discountService.ts
import { api } from "@/services/api";
import { API_ENDPOINTS } from "../../../../config/api.config";

export interface Discount {
  id: number;
  branch?: {
    id: number;
    name: string;
    email: string;
    contact_no: string;
  };
  name: string;
  usages: number;
  start_date: string;
  end_date: string;
  value: number;
  value_in_percentage: number;
  classification: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDiscountRequest {
  name: string;
  usages: number;
  start_date: string;
  end_date: string;
  value: number;
  value_in_percentage: number;
  classification: string;
}

export interface UpdateDiscountRequest {
  name?: string;
  usages?: number;
  start_date?: string;
  end_date?: string;
  value?: number;
  value_in_percentage?: number;
  classification?: string;
}

// Fetch all discounts
export async function fetchDiscounts() {
  try {
    console.log('Fetching discounts from:', API_ENDPOINTS.DISCOUNTS.BASE);
    const response = await api(API_ENDPOINTS.DISCOUNTS.BASE);
    console.log('Raw discounts API response:', response);
    return response;
  } catch (error: any) {
    console.error("Failed to fetch discounts:", error);
    throw error.response?.data || error;
  }
}

// Fetch a single discount by ID
export async function fetchDiscount(id: number) {
  try {
    const response = await api(`${API_ENDPOINTS.DISCOUNTS.BASE}/${id}`);
    return response;
  } catch (error: any) {
    console.error("Failed to fetch discount:", error);
    throw error.response?.data || error;
  }
}

// Create a new discount
export async function createDiscount(discountData: CreateDiscountRequest) {
  try {
    const response = await api(API_ENDPOINTS.DISCOUNTS.BASE, {
      method: 'POST',
      body: JSON.stringify(discountData),
    });
    return response;
  } catch (error: any) {
    console.error("Failed to create discount:", error);
    throw error.response?.data || error;
  }
}

// Update a discount
export async function updateDiscount(id: number, discountData: UpdateDiscountRequest) {
  try {
    const response = await api(`${API_ENDPOINTS.DISCOUNTS.BASE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(discountData),
    });
    return response;
  } catch (error: any) {
    console.error("Failed to update discount:", error);
    throw error.response?.data || error;
  }
}

// Delete a discount
export async function deleteDiscount(id: number) {
  try {
    const response = await api(`${API_ENDPOINTS.DISCOUNTS.BASE}/${id}`, {
      method: 'DELETE',
    });
    return response;
  } catch (error: any) {
    console.error("Failed to delete discount:", error);
    throw error.response?.data || error;
  }
}


// Assign discount to multiple stocks
export async function assignDiscountToMultipleStocks(stockIds: number[], discountId: number) {
  try {
    const response = await api(API_ENDPOINTS.DISCOUNTS.BULK_ASSIGN, {
      method: 'POST',
      body: JSON.stringify({
        stock_ids: stockIds,
        discount_id: discountId,
      }),
    });

    return {
      successful: response.successful,
      failed: response.failed,
      total: stockIds.length,
      errors: response.errors || [],
    };
  } catch (error: any) {
    console.error("Failed to assign discount to multiple stocks:", error);
    throw error.response?.data || error;
  }
}

// Fetch stocks assigned to a discount
export async function fetchDiscountedStocks(discountId: number) {
  try {
    const response = await api(`${API_ENDPOINTS.DISCOUNTS.BASE}/${discountId}/stocks`);
    return response;
  } catch (error: any) {
    console.error("Failed to fetch discounted stocks:", error);
    throw error.response?.data || error;
  }
}

// Fetch logs for a discount
export async function fetchDiscountLogs(discountId: number) {
  try {
    // The api function automatically includes X-Branch-ID header from localStorage
    const url = `${API_ENDPOINTS.ACTIVITY_LOGS.DISCOUNT_LOGS}?item_id=${discountId}`;
    const response = await api(url);
    return response;
  } catch (error: any) {
    console.error("Failed to fetch discount logs:", error);
    throw error.response?.data || error;
  }
}

// Unassign/Remove discount from a stock
export async function unassignDiscountFromStock(stockId: number, discountId: number) {
  try {
    const url = API_ENDPOINTS.STOCK_DISCOUNTS.DELETE.replace('{stockId}', stockId.toString()).replace('{discountId}', discountId.toString());
    const response = await api(url, {
      method: 'DELETE',
    });
    return response;
  } catch (error: any) {
    console.error("Failed to unassign discount from stock:", error);
    throw error.response?.data || error;
  }
}

export const discountService = {
  fetchDiscounts,
  fetchDiscount,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  assignDiscountToMultipleStocks,
  fetchDiscountedStocks,
  fetchDiscountLogs,
  unassignDiscountFromStock,
};