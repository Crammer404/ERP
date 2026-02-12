import { api } from "@/services/api";
import { API_ENDPOINTS } from "../../../../../config/api.config";

export interface IngredientStockLog {
  id: number;
  branch_id: number;
  ingredient_id: number;
  reference_type: string;
  reference_id?: number | string | null;
  reference_code?: string | null;
  movement_direction: 'IN' | 'OUT';
  quantity: number | string;
  bulk_cost?: number | string | null;
  unit_cost?: number | string | null;
  quantity_before: number | string;
  quantity_after: number | string;
  ingredient?: {
    id: number;
    name: string;
  } | null;
  branch?: {
    id: number;
    name: string;
    branch_code?: string | null;
  } | null;
  created_by?: {
    id: number;
    name: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface StockAdjustmentRequest {
  ingredient_id: number;
  quantity: number;
  movement_direction: 'IN' | 'OUT';
  reference_type?: string;
  reference_id?: number | null;
  bulk_cost?: number;
  unit_cost?: number;
  purchase_date?: string;
  expiry_date?: string;
}

export async function fetchStockLogs(params?: {
  ingredient_id?: number;
  reference_type?: string;
  movement_direction?: string;
}): Promise<{
  data: IngredientStockLog[];
  message: string;
}> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.ingredient_id) queryParams.append('ingredient_id', params.ingredient_id.toString());
    if (params?.reference_type) queryParams.append('reference_type', params.reference_type);
    if (params?.movement_direction) queryParams.append('movement_direction', params.movement_direction);
    
    const url = `${API_ENDPOINTS.INGREDIENT_STOCK_LOGS.BASE}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await api(url);
    return {
      data: response.data || [],
      message: response.message || 'Stock logs retrieved successfully.',
    };
  } catch (error: any) {
    console.error("Failed to fetch stock logs:", error);
    throw error.response?.data || error;
  }
}

export async function createStockAdjustment(adjustmentData: StockAdjustmentRequest): Promise<{
  data: IngredientStockLog;
  message: string;
}> {
  try {
    const response = await api(API_ENDPOINTS.INGREDIENT_STOCK_LOGS.CREATE, {
      method: 'POST',
      body: JSON.stringify(adjustmentData),
    });
    return {
      data: response.data,
      message: response.message || 'Stock adjustment logged successfully.',
    };
  } catch (error: any) {
    console.error("Failed to create stock adjustment:", error);
    throw error.response?.data || error;
  }
}
