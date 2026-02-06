// src/services/currencyService.ts
import axios from "axios";
import { API_CONFIG, API_ENDPOINTS } from "../../../../config/api.config";

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

export interface Currency {
  id: number;
  name: string;
  symbol: string;
}

export interface CreateCurrencyRequest {
  name: string;
  symbol: string;
}

export interface UpdateCurrencyRequest {
  name?: string;
  symbol?: string;
}

// Fetch all currencies
export async function fetchCurrencies() {
  try {
    const response = await api.get(API_ENDPOINTS.CURRENCIES.BASE);
    return response.data; // { message, data }
  } catch (error: any) {
    console.error("Failed to fetch currencies:", error);
    throw error.response?.data || error;
  }
}

// Fetch a single currency by ID
export async function fetchCurrency(id: number) {
  try {
    const response = await api.get(`${API_ENDPOINTS.CURRENCIES.BASE}/${id}`);
    return response.data; // { message, data }
  } catch (error: any) {
    console.error("Failed to fetch currency:", error);
    throw error.response?.data || error;
  }
}

// Create a new currency
export async function createCurrency(currencyData: CreateCurrencyRequest) {
  try {
    const response = await api.post(API_ENDPOINTS.CURRENCIES.BASE, currencyData);
    return response.data; // { message, data }
  } catch (error: any) {
    console.error("Failed to create currency:", error);
    throw error.response?.data || error;
  }
}

// Update a currency
export async function updateCurrency(id: number, currencyData: UpdateCurrencyRequest) {
  try {
    const response = await api.patch(`${API_ENDPOINTS.CURRENCIES.BASE}/${id}`, currencyData);
    return response.data; // { message, data }
  } catch (error: any) {
    console.error("Failed to update currency:", error);
    throw error.response?.data || error;
  }
}

// Delete a currency
export async function deleteCurrency(id: number) {
  try {
    const response = await api.delete(`${API_ENDPOINTS.CURRENCIES.BASE}/${id}`);
    return response.data; // { message }
  } catch (error: any) {
    console.error("Failed to delete currency:", error);
    throw error.response?.data || error;
  }
}

export const currencyService = {
  fetchCurrencies,
  fetchCurrency,
  createCurrency,
  updateCurrency,
  deleteCurrency,
};