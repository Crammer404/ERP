'use client';

import { useState, useEffect } from 'react';
import { fetchTaxes, createTax, updateTax, deleteTax, Tax } from '../services/taxService';
import { toast } from "@/hooks/use-toast";
import { tenantContextService } from '@/services/tenant/tenantContextService';

// Global cache for taxes data
let taxesCache: Tax[] | null = null;
let taxesCacheTimestamp: number | null = null;
let taxesCacheBranchId: number | null = null;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes in milliseconds

export function useTaxes() {
  const [taxes, setTaxes] = useState<Tax[]>([]);
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

  const loadTaxes = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we have valid cached data
      const now = Date.now();
      const currentBranch = tenantContextService.getStoredBranchContext();
      const currentBranchId = currentBranch?.id || null;

      if (taxesCache && taxesCacheTimestamp && taxesCacheBranchId === currentBranchId && (now - taxesCacheTimestamp) < CACHE_DURATION) {
        console.log('Using cached taxes data for branch:', currentBranchId);
        setTaxes(taxesCache || []);
        setLoading(false);
        return;
      }

      const response = await fetchTaxes();
      console.log('Fetch taxes response:', response);

      // Cache the data
      const data = response.data;
      const freshData = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      console.log('Fresh data:', freshData);
      taxesCache = freshData;
      taxesCacheTimestamp = now;
      taxesCacheBranchId = currentBranchId;

      setTaxes(freshData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch taxes');
    } finally {
      setLoading(false);
    }
  };

  const refreshTaxes = async () => {
    // Invalidate cache and reload
    taxesCache = null;
    taxesCacheTimestamp = null;
    await loadTaxes();
  };

  const handleCreate = async (formData: any) => {
    try {
      await createTax(formData);
      await refreshTaxes();
      showToast("success", "Tax Created", "The tax has been successfully created.");
    } 
    catch (err: any) {
      if (err.response?.data?.errors) {
        const apiErrors: Record<string, string> = {};
        for (const key in err.response.data.errors) {
          apiErrors[key] = err.response.data.errors[key][0];
        }
        throw apiErrors;
      } 
      else {
        const message = err.response?.data?.message || err.message || "An unexpected error occurred.";
        throw { general: message };
      }
    }
  };

  const handleUpdate = async (id: number, formData: any) => {
    try {
      await updateTax(id, formData);
      await refreshTaxes();
      showToast("success", "Tax Updated", "The tax details were successfully updated.");
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const apiErrors: Record<string, string> = {};
        for (const key in err.response.data.errors) {
          apiErrors[key] = err.response.data.errors[key][0];
        }
        throw apiErrors;
      } else {
        const message = err.response?.data?.message || err.message || "An unexpected error occurred.";
        throw { general: message };
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTax(id);
      await refreshTaxes();
      showToast("success", "Tax Deleted", "The tax was successfully deleted.");
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "An unexpected error occurred.";
      throw message;
    }
  };

  useEffect(() => {
    loadTaxes();
  }, []);

  // Listen for branch change events
  useEffect(() => {
    const handleBranchChange = (event: CustomEvent) => {
      console.log('Branch changed, refreshing taxes data...', event.detail);
      // Clear cache and refresh data
      invalidateTaxesCache();
      loadTaxes();
    };

    window.addEventListener('branchChanged', handleBranchChange as EventListener);

    return () => {
      window.removeEventListener('branchChanged', handleBranchChange as EventListener);
    };
  }, []);

  return {
    taxes,
    loading,
    error,
    refreshTaxes,
    handleCreate,
    handleUpdate,
    handleDelete
  };
}

// Function to invalidate taxes cache (call this after creating new taxes)
export function invalidateTaxesCache() {
  taxesCache = null;
  taxesCacheTimestamp = null;
  taxesCacheBranchId = null;
  console.log('Taxes cache invalidated');
}