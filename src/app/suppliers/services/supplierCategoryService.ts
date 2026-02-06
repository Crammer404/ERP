// src/app/suppliers/services/supplierCategoryService.ts
import { api } from "../../../services/api";
import { API_ENDPOINTS } from "../../../config/api.config";

export interface SupplierCategory {
  id: number;
  branch?: {
    id: number;
    name: string;
    email: string;
    contact_no: string;
  };
  name: string;
}

export interface CreateSupplierCategoryRequest {
  name: string;
  branch_id?: number;
}

export interface UpdateSupplierCategoryRequest {
  name?: string;
  branch_id?: number;
}

// Fetch all supplier categories
export async function fetchSupplierCategories(search?: string, page?: number, perPage?: number) {
  try {
    const params: any = {};
    if (search) params.search = search;
    if (page) params.page = page;
    if (perPage) params.per_page = perPage;

    const queryString = new URLSearchParams(params).toString();
    const endpoint = `${API_ENDPOINTS.SUPPLIERS.CATEGORIES}${queryString ? '?' + queryString : ''}`;

    const response = await api(endpoint);
    return response; // { message, data }
  } catch (error: any) {
    console.error("Failed to fetch supplier categories:", error);
    throw error;
  }
}

// Fetch a single supplier category by ID
export async function fetchSupplierCategory(id: number) {
  try {
    const response = await api(`${API_ENDPOINTS.SUPPLIERS.CATEGORIES}/${id}`);
    return response; // { message, category, context }
  } catch (error: any) {
    console.error("Failed to fetch supplier category:", error);
    throw error;
  }
}

// Create a new supplier category
export async function createSupplierCategory(categoryData: CreateSupplierCategoryRequest) {
  try {
    const response = await api(API_ENDPOINTS.SUPPLIERS.CATEGORIES, {
      method: "POST",
      body: JSON.stringify(categoryData),
      headers: { "Content-Type": "application/json" },
    });
    return response; // { message, category }
  } catch (error: any) {
    console.error("Failed to create supplier category:", error);
    throw error;
  }
}

// Update a supplier category
export async function updateSupplierCategory(id: number, categoryData: UpdateSupplierCategoryRequest) {
  try {
    const response = await api(`${API_ENDPOINTS.SUPPLIERS.CATEGORIES}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(categoryData),
      headers: { "Content-Type": "application/json" },
    });
    return response; // { message, category }
  } catch (error: any) {
    console.error("Failed to update supplier category:", error);
    throw error;
  }
}

// Delete a supplier category
export async function deleteSupplierCategory(id: number) {
  try {
    const response = await api(`${API_ENDPOINTS.SUPPLIERS.CATEGORIES}/${id}`, {
      method: "DELETE",
    });
    return response; // { message }
  } catch (error: any) {
    console.error("Failed to delete supplier category:", error);
    throw error;
  }
}

export const supplierCategoryService = {
  fetchSupplierCategories,
  fetchSupplierCategory,
  createSupplierCategory,
  updateSupplierCategory,
  deleteSupplierCategory,
};