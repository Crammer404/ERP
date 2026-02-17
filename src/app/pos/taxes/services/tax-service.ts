// src/services/taxService.ts
import { api } from "../../../../services/api";
import { API_ENDPOINTS } from "../../../../config/api.config";

export interface Tax {
  id: number;
  is_global: boolean;
  branch_id?: number;
  branch?: {
    id: number;
    name: string;
  };
  name: string;
  is_percent: boolean;
  percentage: number;
  is_active: boolean;
}

export interface CreateTaxRequest {
  is_global?: boolean;
  branch_id?: number;
  name: string;
  is_percent?: boolean;
  percentage: number;
  is_active?: boolean;
}

export interface UpdateTaxRequest {
  is_global?: boolean;
  branch_id?: number;
  name?: string;
  is_percent?: boolean;
  percentage?: number;
  is_active?: boolean;
}

// Fetch all taxes
export async function fetchTaxes() {
  try {
    const response = await api(API_ENDPOINTS.TAXES.BASE);
    return response; // { message, data }
  } catch (error: any) {
    console.error("Failed to fetch taxes:", error);
    throw error.response?.data || error;
  }
}

// Fetch a single tax by ID
export async function fetchTax(id: number) {
  try {
    const response = await api(`${API_ENDPOINTS.TAXES.BASE}/${id}`);
    return response; // { message, data }
  } catch (error: any) {
    console.error("Failed to fetch tax:", error);
    throw error.response?.data || error;
  }
}

// Create a new tax
export async function createTax(taxData: CreateTaxRequest) {
  try {
    const response = await api(API_ENDPOINTS.TAXES.BASE, {
      method: 'POST',
      body: JSON.stringify(taxData),
      headers: { 'Content-Type': 'application/json' },
    });
    return response; // { message, data }
  } catch (error: any) {
    throw error.response?.data || error;
  }
}

// Update a tax
export async function updateTax(id: number, taxData: UpdateTaxRequest) {
  try {
    const response = await api(`${API_ENDPOINTS.TAXES.BASE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(taxData),
      headers: { 'Content-Type': 'application/json' },
    });
    return response; // { message, data }
  } catch (error: any) {
    throw error.response?.data || error;
  }
}

// Delete a tax
export async function deleteTax(id: number) {
  try {
    const response = await api(`${API_ENDPOINTS.TAXES.BASE}/${id}`, {
      method: 'DELETE',
    });
    return response; // { message }
  } catch (error: any) {
    throw error.response?.data || error;
  }
}

export const taxService = {
  fetchTaxes,
  fetchTax,
  createTax,
  updateTax,
  deleteTax,
};