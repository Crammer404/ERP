'use client';

import { useState, useEffect } from 'react';
import { fetchCurrencies, createCurrency, updateCurrency, deleteCurrency, Currency } from '../services/currencyService';
import { toast } from "@/hooks/use-toast";

// Global cache for currencies data
let currenciesCache: Currency[] | null = null;
let currenciesCacheTimestamp: number | null = null;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes in milliseconds

export function useCurrencies() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const showToast = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string
  ) => {
    toast({
      title,
      description: message,
      variant:
        type === "error" ? "destructive" : type === "success" ? "success" : "default",
    });
  };

  const loadCurrencies = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we have valid cached data
      const now = Date.now();
      if (currenciesCache && currenciesCacheTimestamp && (now - currenciesCacheTimestamp) < CACHE_DURATION) {
        console.log('Using cached currencies data');
        setCurrencies(currenciesCache || []);
        setLoading(false);
        return;
      }

      const response = await fetchCurrencies();
      console.log('Fetch currencies response:', response);

      // Cache the data
      const data = response.data;
      const freshData = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      console.log('Fresh data:', freshData);
      currenciesCache = freshData;
      currenciesCacheTimestamp = now;

      setCurrencies(freshData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch currencies');
    } finally {
      setLoading(false);
    }
  };

  const refreshCurrencies = async () => {
    // Invalidate cache and reload
    currenciesCache = null;
    currenciesCacheTimestamp = null;
    await loadCurrencies();
  };

  const handleCreate = async (formData: any) => {
    try {
      await createCurrency(formData);
      await refreshCurrencies();
      showToast("success", "Currency Created", "The currency has been successfully created.");
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const apiErrors: Record<string, string> = {};
        for (const key in err.response.data.errors) {
          apiErrors[key] = err.response.data.errors[key][0];
        }
        throw apiErrors;
      } else {
        const message = err.response?.data?.message || "Failed to create currency.";
        throw { general: message };
      }
    }
  };

  const handleUpdate = async (id: number, formData: any) => {
    try {
      await updateCurrency(id, formData);
      await refreshCurrencies();
      showToast("success", "Currency Updated", "The currency details were successfully updated.");
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const apiErrors: Record<string, string> = {};
        for (const key in err.response.data.errors) {
          apiErrors[key] = err.response.data.errors[key][0];
        }
        throw apiErrors;
      } else {
        const message = err.response?.data?.message || "Failed to update currency.";
        throw { general: message };
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCurrency(id);
      await refreshCurrencies();
      showToast("success", "Currency Deleted", "The currency was successfully deleted.");
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to delete currency.";
      throw message;
    }
  };

  useEffect(() => {
    loadCurrencies();
  }, []);

  return {
    currencies,
    loading,
    error,
    refreshCurrencies,
    handleCreate,
    handleUpdate,
    handleDelete
  };
}

// Function to invalidate currencies cache (call this after creating new currencies)
export function invalidateCurrenciesCache() {
  currenciesCache = null;
  currenciesCacheTimestamp = null;
  console.log('Currencies cache invalidated');
}