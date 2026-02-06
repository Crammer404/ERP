// src/app/suppliers/services/supplierService.ts
import { api } from "../../../services/api";
import { API_ENDPOINTS } from "../../../config/api.config";

export interface Address {
  id?: number;
  country: string;
  postal_code?: string;
  region: string;
  province: string;
  city: string;
  barangay?: string;
  street?: string;
  block_lot?: string;
}

export interface Supplier {
  id: number;
  branch?: {
    id: number;
    name: string;
    email: string;
    contact_no: string;
  };
  supplier_category?: {
    id: number;
    name: string;
  };
  name: string;
  email: string;
  phone_number: string;
  description?: string;
  address: Address;
  created_at: string;
  updated_at: string;
}

export interface CreateSupplierRequest {
  name: string;
  email: string;
  phone_number: string;
  description?: string;
  supplier_category_id?: number;
  branch_id?: number;
  address: Address;
}

export interface UpdateSupplierRequest {
  name?: string;
  email?: string;
  phone_number?: string;
  description?: string;
  supplier_category_id?: number;
  branch_id?: number;
  address?: Address;
}

// Fetch all suppliers
export async function fetchSuppliers(search?: string, page?: number, perPage?: number) {
  try {
    const params: any = {};
    if (search) params.search = search;
    if (page) params.page = page;
    if (perPage) params.per_page = perPage;

    const queryString = new URLSearchParams(params).toString();
    const endpoint = `${API_ENDPOINTS.SUPPLIERS.BASE}${queryString ? '?' + queryString : ''}`;
    
    const response = await api(endpoint);
    return response; // { message, suppliers, pagination, context }
  } catch (error: any) {
    console.error("Failed to fetch suppliers:", error);
    throw error;
  }
}

// Fetch a single supplier by ID
export async function fetchSupplier(id: number) {
  try {
    const response = await api(`${API_ENDPOINTS.SUPPLIERS.BASE}/${id}`);
    return response; // { message, supplier, context }
  } catch (error: any) {
    console.error("Failed to fetch supplier:", error);
    throw error;
  }
}

// Create a new supplier
export async function createSupplier(supplierData: CreateSupplierRequest) {
  try {
    const response = await api(API_ENDPOINTS.SUPPLIERS.BASE, {
      method: "POST",
      body: JSON.stringify(supplierData),
      headers: { "Content-Type": "application/json" },
    });
    return response; // { message, supplier }
  } catch (error: any) {
    console.error("Failed to create supplier:", error);
    throw error;
  }
}

// Update a supplier
export async function updateSupplier(id: number, supplierData: UpdateSupplierRequest) {
  try {
    const response = await api(`${API_ENDPOINTS.SUPPLIERS.BASE}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(supplierData),
      headers: { "Content-Type": "application/json" },
    });
    return response; // { message, supplier }
  } catch (error: any) {
    console.error("Failed to update supplier:", error);
    throw error;
  }
}

// Delete a supplier
export async function deleteSupplier(id: number) {
  try {
    const response = await api(`${API_ENDPOINTS.SUPPLIERS.BASE}/${id}`, {
      method: "DELETE",
    });
    return response; // { message }
  } catch (error: any) {
    console.error("Failed to delete supplier:", error);
    throw error;
  }
}

export const supplierService = {
  fetchSuppliers,
  fetchSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};