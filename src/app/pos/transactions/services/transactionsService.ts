// src/services/transactionsService.ts
import axios from "axios";
import { API_CONFIG, API_ENDPOINTS } from "@/config/api.config";
import { tenantContextService } from "@/services/tenant/tenantContextService";

// ✅ Create axios instance
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.DEFAULT_HEADERS,
});

// ✅ Add interceptor to inject Bearer token automatically
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        if (config.headers) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Fetch all transactions
export async function fetchTransactions() {
  try {
    // Get selected branch from tenant context service
    const selectedBranch = tenantContextService.getStoredBranchContext();
    let url = API_ENDPOINTS.TRANSACTIONS.BASE;
    if (selectedBranch && selectedBranch.id) {
      url += `?branch_id=${selectedBranch.id}`;
    }
    const response = await api.get(url);
    return response.data; // { message, data }
  } catch (error: any) {
    console.error("Failed to fetch transactions:", error);
    throw error.response?.data || error;
  }
}

// Fetch a single transaction by ID
export async function fetchTransaction(id: number) {
  try {
    const response = await api.get(`${API_ENDPOINTS.TRANSACTIONS.BASE}/${id}`);
    return response.data; // { message, data }
  } catch (error: any) {
    console.error("Failed to fetch transaction:", error);
    throw error.response?.data || error;
  }
}

// Fetch transactions by customer ID
export async function fetchTransactionsByCustomer(customerId: number) {
  try {
    // Get selected branch from tenant context service
    const selectedBranch = tenantContextService.getStoredBranchContext();
    let url = `${API_ENDPOINTS.TRANSACTIONS.BASE}?customer_id=${customerId}`;
    if (selectedBranch && selectedBranch.id) {
      url += `&branch_id=${selectedBranch.id}`;
    }
    const response = await api.get(url);
    return response.data; // { message, data }
  } catch (error: any) {
    console.error("Failed to fetch transactions by customer:", error);
    throw error.response?.data || error;
  }
}
