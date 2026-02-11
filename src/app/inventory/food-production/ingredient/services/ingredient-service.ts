import { api } from "@/services/api";
import { API_ENDPOINTS } from "../../../../../config/api.config";

export interface Ingredient {
  id: number;
  branch_id?: number | null;
  name: string;
  description?: string | null;
  quantity: number;
  measurement_id?: number | null;
  cost_price?: number | null;
  category?: string | null;
  image_path?: string | null;
  measurement?: {
    id: number;
    name: string;
    description?: string | null;
    symbol?: string | null;
  } | null;
  cost: number;
  total_cost: number;
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
  measurement_id?: number;
  cost_price?: number;
  category?: string;
  image_path?: string;
  branch_id?: number;
}

export interface UpdateIngredientRequest {
  name?: string;
  description?: string;
  quantity?: number;
  measurement_id?: number;
  cost_price?: number;
  category?: string;
  image_path?: string;
  branch_id?: number;
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
export async function createIngredient(ingredientData: CreateIngredientRequest & { image?: File }): Promise<{
  data: Ingredient;
  message: string;
}> {
  try {
    const hasImage = typeof (ingredientData as any).image !== 'undefined';

    if (hasImage) {
      const formData = new FormData();
      if (ingredientData.name) formData.append('name', ingredientData.name);
      if (ingredientData.description) formData.append('description', ingredientData.description);
      if (typeof ingredientData.quantity === 'number') formData.append('quantity', ingredientData.quantity.toString());
      if (typeof ingredientData.measurement_id === 'number') {
        formData.append('measurement_id', ingredientData.measurement_id.toString());
      }
      if (typeof ingredientData.cost_price === 'number') {
        formData.append('cost_price', ingredientData.cost_price.toString());
      }
      if (ingredientData.category) formData.append('category', ingredientData.category);
      if (typeof ingredientData.branch_id === 'number') {
        formData.append('branch_id', ingredientData.branch_id.toString());
      }
      const image = (ingredientData as any).image as File;
      if (image instanceof File) {
        formData.append('image', image);
      }

      const response = await api(API_ENDPOINTS.INGREDIENTS.CREATE, {
        method: 'POST',
        body: formData,
      });
      return {
        data: response.data,
        message: response.message || 'Ingredient created successfully.',
      };
    }

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
  ingredientData: UpdateIngredientRequest & { image?: File | null }
): Promise<{
  data: Ingredient;
  message: string;
}> {
  try {
    const hasImageKey = Object.prototype.hasOwnProperty.call(ingredientData, 'image');

    if (hasImageKey) {
      const formData = new FormData();
      formData.append('_method', 'PATCH');

      if (ingredientData.name) formData.append('name', ingredientData.name);
      if (ingredientData.description) formData.append('description', ingredientData.description);
      if (typeof ingredientData.quantity === 'number') {
        formData.append('quantity', ingredientData.quantity.toString());
      }
      if (typeof ingredientData.measurement_id === 'number') {
        formData.append('measurement_id', ingredientData.measurement_id.toString());
      }
      if (typeof ingredientData.cost_price === 'number') {
        formData.append('cost_price', ingredientData.cost_price.toString());
      }
      if (ingredientData.category) formData.append('category', ingredientData.category);
      if (typeof ingredientData.branch_id === 'number') {
        formData.append('branch_id', ingredientData.branch_id.toString());
      }

      const image = (ingredientData as any).image;
      if (image instanceof File) {
        formData.append('image', image);
      } else if (image === null) {
        formData.append('image', '');
      }

      const response = await api(`${API_ENDPOINTS.INGREDIENTS.BASE}/${id}`, {
        method: 'POST',
        body: formData,
      });
      return {
        data: response.data,
        message: response.message || 'Ingredient updated successfully.',
      };
    }

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
