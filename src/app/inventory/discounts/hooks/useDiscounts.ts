'use client';

import { useState, useEffect } from 'react';
import { fetchDiscounts, createDiscount, updateDiscount, deleteDiscount, Discount } from '../services/discountService';
import { toast } from "@/hooks/use-toast";
import { tenantContextService } from '@/services/tenant/tenantContextService';
import { invalidateActivityLogsCache } from '../../../settings/activity-logs/hooks/useActivityLogs';

// Global cache for discounts data
let discountsCache: Discount[] | null = null;
let discountsCacheTimestamp: number | null = null;
let discountsCacheBranchId: number | null = null;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes in milliseconds

export function useDiscounts() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
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

  const loadDiscounts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we have valid cached data
      const now = Date.now();
      const currentBranch = tenantContextService.getStoredBranchContext();
      const currentBranchId = currentBranch?.id || null;

      if (discountsCache && discountsCacheTimestamp && discountsCacheBranchId === currentBranchId && (now - discountsCacheTimestamp) < CACHE_DURATION) {
        console.log('Using cached discounts data for branch:', currentBranchId);
        setDiscounts(discountsCache || []);
        setLoading(false);
        return;
      }

      const response = await fetchDiscounts();
      console.log('Fetch discounts response:', response);

      // Cache the data
      const data = response.data;
      const freshData = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      console.log('Fresh data:', freshData);
      discountsCache = freshData;
      discountsCacheTimestamp = now;
      discountsCacheBranchId = currentBranchId;

      setDiscounts(freshData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch discounts');
    } finally {
      setLoading(false);
    }
  };

  const refreshDiscounts = async () => {
    // Invalidate cache and reload
    discountsCache = null;
    discountsCacheTimestamp = null;
    await loadDiscounts();
  };

  const handleCreate = async (formData: any) => {
    try {
      await createDiscount(formData);
      await refreshDiscounts();
      invalidateActivityLogsCache();
      showToast("success", "Discount Created", "The discount has been successfully created.");
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const apiErrors: Record<string, string> = {};
        for (const key in err.response.data.errors) {
          apiErrors[key] = err.response.data.errors[key][0];
        }
        throw apiErrors;
      } else {
        const message = err.response?.data?.message || "Failed to create discount.";
        throw { general: message };
      }
    }
  };

  const handleUpdate = async (id: number, formData: any) => {
    try {
      await updateDiscount(id, formData);
      await refreshDiscounts();
      invalidateActivityLogsCache();
      showToast("success", "Discount Updated", "The discount details were successfully updated.");
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const apiErrors: Record<string, string> = {};
        for (const key in err.response.data.errors) {
          apiErrors[key] = err.response.data.errors[key][0];
        }
        throw apiErrors;
      } else {
        const message = err.response?.data?.message || "Failed to update discount.";
        throw { general: message };
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteDiscount(id);
      await refreshDiscounts();
      invalidateActivityLogsCache();
      showToast("success", "Discount Deleted", "The discount was successfully deleted.");
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to delete discount.";
      throw message;
    }
  };

  useEffect(() => {
    loadDiscounts();
  }, []);

  // Listen for branch change events
  useEffect(() => {
    const handleBranchChange = (event: CustomEvent) => {
      console.log('Branch changed, refreshing discounts data...', event.detail);
      // Clear cache and refresh data
      invalidateDiscountsCache();
      loadDiscounts();
    };

    window.addEventListener('branchChanged', handleBranchChange as EventListener);

    return () => {
      window.removeEventListener('branchChanged', handleBranchChange as EventListener);
    };
  }, []);

  return {
    discounts,
    loading,
    error,
    refreshDiscounts,
    handleCreate,
    handleUpdate,
    handleDelete
  };
}

// Function to invalidate discounts cache (call this after creating new discounts)
export function invalidateDiscountsCache() {
  discountsCache = null;
  discountsCacheTimestamp = null;
  discountsCacheBranchId = null;
  console.log('Discounts cache invalidated');
}