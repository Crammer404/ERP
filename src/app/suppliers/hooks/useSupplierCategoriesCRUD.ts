'use client';

import { useState, useEffect } from 'react';
import {
  fetchSupplierCategories,
  createSupplierCategory,
  updateSupplierCategory,
  deleteSupplierCategory,
  SupplierCategory
} from '../services/supplierCategoryService';
import { toast } from "@/hooks/use-toast";
import { tenantContextService } from '@/services/tenant/tenantContextService';

// Global cache for supplier categories data
let categoriesCache: SupplierCategory[] | null = null;
let categoriesCacheTimestamp: number | null = null;
let categoriesCacheBranchId: number | null = null;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes in milliseconds

export function useSupplierCategoriesCRUD() {
  const [categories, setCategories] = useState<SupplierCategory[]>([]);
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

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we have valid cached data
      const now = Date.now();
      const currentBranch = tenantContextService.getStoredBranchContext();
      const currentBranchId = currentBranch?.id || null;

      if (categoriesCache && categoriesCacheTimestamp && categoriesCacheBranchId === currentBranchId && (now - categoriesCacheTimestamp) < CACHE_DURATION) {
        console.log('Using cached supplier categories data for branch:', currentBranchId);
        setCategories(categoriesCache || []);
        setLoading(false);
        return;
      }

      const response = await fetchSupplierCategories();
      console.log('Fetch supplier categories response:', response);

      // Cache the data
      const data = response.data || [];
      console.log('Fresh supplier categories data:', data);
      categoriesCache = data;
      categoriesCacheTimestamp = now;
      categoriesCacheBranchId = currentBranchId;

      setCategories(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch supplier categories');
    } finally {
      setLoading(false);
    }
  };

  const refreshCategories = async () => {
    // Invalidate cache and reload
    categoriesCache = null;
    categoriesCacheTimestamp = null;
    await loadCategories();
  };

  const handleCreate = async (formData: any) => {
    try {
      await createSupplierCategory(formData);
      await refreshCategories();
      showToast("success", "Category Created", "The supplier category has been successfully created.");
    } catch (err: any) {
      console.error('Supplier category creation error:', err.response?.data || err);
      if (err.response?.data?.errors) {
        const apiErrors: Record<string, string> = {};
        for (const key in err.response.data.errors) {
          apiErrors[key] = err.response.data.errors[key][0];
        }
        throw apiErrors;
      } else {
        const message = err.response?.data?.message || "Failed to create supplier category.";
        throw { general: message };
      }
    }
  };

  const handleUpdate = async (id: number, formData: any) => {
    try {
      await updateSupplierCategory(id, formData);
      await refreshCategories();
      showToast("success", "Category Updated", "The supplier category details were successfully updated.");
    } catch (err: any) {
      console.error('Supplier category update error:', err.response?.data || err);
      if (err.response?.data?.errors) {
        const apiErrors: Record<string, string> = {};
        for (const key in err.response.data.errors) {
          apiErrors[key] = err.response.data.errors[key][0];
        }
        throw apiErrors;
      } else {
        const message = err.response?.data?.message || "Failed to update supplier category.";
        throw { general: message };
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSupplierCategory(id);
      await refreshCategories();
      showToast("success", "Category Deleted", "The supplier category was successfully deleted.");
    } catch (err: any) {
      console.error('Supplier category deletion error:', err.response?.data || err);
      const message = err.response?.data?.message || "Failed to delete supplier category.";
      throw message;
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Listen for branch change events
  useEffect(() => {
    const handleBranchChange = (event: CustomEvent) => {
      console.log('Branch changed, refreshing supplier categories data...', event.detail);
      // Clear cache and refresh data
      invalidateCategoriesCache();
      loadCategories();
    };

    window.addEventListener('branchChanged', handleBranchChange as EventListener);

    return () => {
      window.removeEventListener('branchChanged', handleBranchChange as EventListener);
    };
  }, []);

  return {
    categories,
    loading,
    error,
    refreshCategories,
    handleCreate,
    handleUpdate,
    handleDelete
  };
}

// Function to invalidate supplier categories cache
export function invalidateCategoriesCache() {
  categoriesCache = null;
  categoriesCacheTimestamp = null;
  categoriesCacheBranchId = null;
  console.log('Supplier categories cache invalidated');
}