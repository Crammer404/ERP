import { api } from "@/services/api";
import { API_ENDPOINTS } from "../../../../../config/api.config";

export interface RecipeItem {
  id: number;
  recipe_id: number;
  ingredient_id: number;
  quantity: number;
  ingredient?: {
    id: number;
    name: string;
    quantity: number;
    measurement?: {
      id: number;
      name: string;
      symbol: string;
    } | null;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface Recipe {
  id: number;
  branch_id: number;
  product_id: number;
  product?: {
    id: number;
    name: string;
    display_image?: string | null;
  } | null;
  items?: RecipeItem[];
  max_producible_quantity?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateRecipeRequest {
  product_id: number;
  items: {
    ingredient_id: number;
    quantity: number;
  }[];
}

export interface UpdateRecipeRequest {
  product_id?: number;
  items?: {
    ingredient_id: number;
    quantity: number;
  }[];
}

export async function fetchRecipes(params?: { page?: number }): Promise<{
  data: Recipe[];
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
    
    const url = `${API_ENDPOINTS.RECIPES.BASE}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await api(url);
    return {
      data: response.data || [],
      message: response.message || 'Recipes retrieved successfully.',
      pagination: response.pagination,
    };
  } catch (error: any) {
    console.error("Failed to fetch recipes:", error);
    throw error.response?.data || error;
  }
}

export async function fetchRecipe(id: number): Promise<{
  data: Recipe;
  message: string;
}> {
  try {
    const response = await api(`${API_ENDPOINTS.RECIPES.BASE}/${id}`);
    return {
      data: response.data,
      message: response.message || 'Recipe retrieved successfully.',
    };
  } catch (error: any) {
    console.error("Failed to fetch recipe:", error);
    throw error.response?.data || error;
  }
}

export async function createRecipe(recipeData: CreateRecipeRequest): Promise<{
  data: Recipe;
  message: string;
}> {
  try {
    const response = await api(API_ENDPOINTS.RECIPES.CREATE, {
      method: 'POST',
      body: JSON.stringify(recipeData),
    });
    return {
      data: response.data,
      message: response.message || 'Recipe created successfully.',
    };
  } catch (error: any) {
    console.error("Failed to create recipe:", error);
    throw error.response?.data || error;
  }
}

export async function updateRecipe(
  id: number,
  recipeData: UpdateRecipeRequest
): Promise<{
  data: Recipe;
  message: string;
}> {
  try {
    const response = await api(`${API_ENDPOINTS.RECIPES.BASE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(recipeData),
    });
    return {
      data: response.data,
      message: response.message || 'Recipe updated successfully.',
    };
  } catch (error: any) {
    console.error("Failed to update recipe:", error);
    throw error.response?.data || error;
  }
}

export async function deleteRecipe(id: number): Promise<{
  message: string;
}> {
  try {
    const response = await api(`${API_ENDPOINTS.RECIPES.BASE}/${id}`, {
      method: 'DELETE',
    });
    return {
      message: response.message || 'Recipe deleted successfully.',
    };
  } catch (error: any) {
    console.error("Failed to delete recipe:", error);
    throw error.response?.data || error;
  }
}

export async function fetchMaxProducibleQuantity(recipeId: number): Promise<{
  data: {
    recipe_id: number;
    max_producible_quantity: number;
  };
  message: string;
}> {
  try {
    const response = await api(`${API_ENDPOINTS.RECIPES.BASE}/${recipeId}/max-producible`);
    return {
      data: response.data,
      message: response.message || 'Max producible quantity calculated successfully.',
    };
  } catch (error: any) {
    console.error("Failed to fetch max producible quantity:", error);
    throw error.response?.data || error;
  }
}
