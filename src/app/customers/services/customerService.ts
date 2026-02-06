// src/app/customer/services/customerService.ts
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

export interface Customer {
  id: number;
  tenant?: {
    id: number;
    name: string;
    email: string;
  };
  branch?: {
    id: number;
    name: string;
    email: string;
    contact_no: string;
  };
  branch_id: number;
  first_name: string;
  last_name: string;
  email: string;
  fb_name: string | null;
  phone_number: string;
  tin: string | null;
  address: Address;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerRequest {
  first_name: string;
  last_name: string;
  email: string;
  fb_name?: string;
  phone_number: string;
  tin?: string;
  branch_id: number;
  address: Address;
}

export interface UpdateCustomerRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  fb_name?: string;
  phone_number?: string;
  tin?: string;
  branch_id?: number;
  address?: Address;
}

// Fetch all customers
export async function fetchCustomers(search?: string, page?: number, perPage?: number, branchId?: number) {
  try {
    const params: any = {};
    if (search) params.search = search;
    if (page) params.page = page;
    if (perPage) params.per_page = perPage;
    if (branchId) params.branch_id = branchId;

    const queryString = new URLSearchParams(params).toString();
    const endpoint = `${API_ENDPOINTS.CUSTOMERS.BASE}${queryString ? '?' + queryString : ''}`;

    const response = await api(endpoint);
    return response; // { message, data }
  } catch (error: any) {
    console.error("Failed to fetch customers:", error);
    throw error;
  }
}

// Fetch a single customer by ID
export async function fetchCustomer(id: number) {
  try {
    const response = await api(`${API_ENDPOINTS.CUSTOMERS.BASE}/${id}`);
    return response; // { message, customer, context }
  } catch (error: any) {
    console.error("Failed to fetch customer:", error);
    throw error;
  }
}

// Create a new customer
export async function createCustomer(customerData: CreateCustomerRequest) {
  try {
    const response = await api(API_ENDPOINTS.CUSTOMERS.BASE, {
      method: "POST",
      body: JSON.stringify(customerData),
      headers: { "Content-Type": "application/json" },
    });
    return response; // { message, customer }
  } catch (error: any) {
    console.error("Failed to create customer:", error);
    throw error;
  }
}

// Update a customer
export async function updateCustomer(id: number, customerData: UpdateCustomerRequest) {
  try {
    const response = await api(`${API_ENDPOINTS.CUSTOMERS.BASE}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(customerData),
      headers: { "Content-Type": "application/json" },
    });
    return response; // { message, customer }
  } catch (error: any) {
    console.error("Failed to update customer:", error);
    throw error;
  }
}

// Delete a customer
export async function deleteCustomer(id: number) {
  try {
    const response = await api(`${API_ENDPOINTS.CUSTOMERS.BASE}/${id}`, {
      method: "DELETE",
    });
    return response; // { message }
  } catch (error: any) {
    console.error("Failed to delete customer:", error);
    throw error;
  }
}

export const customerService = {
  fetchCustomers,
  fetchCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};