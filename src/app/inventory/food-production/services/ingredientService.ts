import { api } from "@/services/api";
import { API_ENDPOINTS } from "../../../../config/api.config";

export interface Ingredient {
  id: number;
  stock_id?: number;
  name: string;
  description?: string | null;
  quantity: number;
  unit?: string | null;
  measurement_id?: number | null;
  measurement?: {
    id: number;
    name: string;
    description?: string | null;
  } | null;
  conversion_factor: number;
  cost: number; // Accessor from backend
  total_cost: number; // Accessor from backend
  stock?: {
    id: number;
    product_id: number;
    cost: number;
    quantity: number;
    selling_price: number;
    product?: {
      id: number;
      name: string;
      category?: {
        id: number;
        name: string;
      } | null;
      brand?: {
        id: number;
        name: string;
      } | null;
    } | null;
    variant_specification?: {
      id: number;
      name: string;
    } | null;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface CreateIngredientRequest {
  name: string;
  description?: string;
  quantity: number;
  unit?: string;
  measurement_id?: number;
}

export interface UpdateIngredientRequest {
  stock_id?: number;
  name?: string;
  description?: string;
  quantity?: number;
  unit?: string;
  measurement_id?: number;
}

export interface Stock {
  id: number;
  product_id: number;
  variant_specification_id?: number | null;
  cost: number;
  profit_margin: number;
  selling_price: number;
  quantity: number;
  low_stock_threshold?: number;
  product?: {
    id: number;
    name: string;
    category?: {
      id: number;
      name: string;
    } | null;
    brand?: {
      id: number;
      name: string;
    } | null;
  } | null;
  variant_specification?: {
    id: number;
    name: string;
  } | null;
}

// Fetch all ingredients
export async function fetchIngredients(params?: { page?: number }): Promise<{
  data: Ingredient[];
  message: string;
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    
    const url = `${API_ENDPOINTS.INGREDIENTS.BASE}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await api(url);
    return {
      data: response.data || [],
      message: response.message || 'Ingredients retrieved successfully.',
      pagination: response.pagination,
    };
  } catch (error: any) {
    console.error("Failed to fetch ingredients:", error);
    throw error.response?.data || error;
  }
}

// Fetch a single ingredient by ID
export async function fetchIngredient(id: number): Promise<{
  data: Ingredient;
  message: string;
}> {
  try {
    const response = await api(`${API_ENDPOINTS.INGREDIENTS.BASE}/${id}`);
    return {
      data: response.data,
      message: response.message || 'Ingredient retrieved successfully.',
    };
  } catch (error: any) {
    console.error("Failed to fetch ingredient:", error);
    throw error.response?.data || error;
  }
}

// Create a new ingredient
export async function createIngredient(ingredientData: CreateIngredientRequest): Promise<{
  data: Ingredient;
  message: string;
}> {
  try {
    const response = await api(API_ENDPOINTS.INGREDIENTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(ingredientData),
    });
    return {
      data: response.data,
      message: response.message || 'Ingredient created successfully.',
    };
  } catch (error: any) {
    console.error("Failed to create ingredient:", error);
    throw error.response?.data || error;
  }
}

// Update an ingredient
export async function updateIngredient(
  id: number,
  ingredientData: UpdateIngredientRequest
): Promise<{
  data: Ingredient;
  message: string;
}> {
  try {
    const response = await api(`${API_ENDPOINTS.INGREDIENTS.BASE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(ingredientData),
    });
    return {
      data: response.data,
      message: response.message || 'Ingredient updated successfully.',
    };
  } catch (error: any) {
    console.error("Failed to update ingredient:", error);
    throw error.response?.data || error;
  }
}

// Delete an ingredient
export async function deleteIngredient(id: number): Promise<{
  message: string;
}> {
  try {
    const response = await api(`${API_ENDPOINTS.INGREDIENTS.BASE}/${id}`, {
      method: 'DELETE',
    });
    return {
      message: response.message || 'Ingredient deleted successfully.',
    };
  } catch (error: any) {
    console.error("Failed to delete ingredient:", error);
    throw error.response?.data || error;
  }
}

// Fetch all stocks (for dropdown/select)
export async function fetchStocks(): Promise<{
  data: Stock[];
  message: string;
}> {
  try {
    const response = await api(API_ENDPOINTS.STOCKS.BASE);
    return {
      data: response.data || [],
      message: response.message || 'Stocks retrieved successfully.',
    };
  } catch (error: any) {
    console.error("Failed to fetch stocks:", error);
    throw error.response?.data || error;
  }
}
