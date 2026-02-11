'use client';

import { useState, useEffect } from 'react';
import {
  fetchIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  Ingredient,
} from '../services/ingredient-service';
import { useToast } from '@/hooks/use-toast';
import { tenantContextService } from '@/services/tenant/tenantContextService';

// Global cache for ingredients data
let ingredientsCache: Ingredient[] | null = null;
let ingredientsCacheTimestamp: number | null = null;
let ingredientsCacheBranchId: number | null = null;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes in milliseconds

export function useIngredients() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  } | null>(null);

  const { toast } = useToast();

  const showToast = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string
  ) => {
    toast({
      title,
      description: message,
      variant:
        type === 'error' ? 'destructive' : type === 'success' ? 'success' : 'default',
    });
  };

  const loadIngredients = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      // Check if we have valid cached data
      const now = Date.now();
      const currentBranch = tenantContextService.getStoredBranchContext();
      const currentBranchId = currentBranch?.id || null;

      if (
        ingredientsCache &&
        ingredientsCacheTimestamp &&
        ingredientsCacheBranchId === currentBranchId &&
        (now - ingredientsCacheTimestamp) < CACHE_DURATION
      ) {
        console.log('Using cached ingredients data for branch:', currentBranchId);
        setIngredients(ingredientsCache || []);
        setLoading(false);
        return;
      }

      const response = await fetchIngredients({ page });
      console.log('Fetch ingredients response:', response);

      // Cache the data
      const freshData = Array.isArray(response.data)
        ? response.data
        : (Array.isArray((response.data as any)?.data) ? (response.data as any).data : []);
      console.log('Fresh data:', freshData);
      ingredientsCache = freshData;
      ingredientsCacheTimestamp = now;
      ingredientsCacheBranchId = currentBranchId;

      setIngredients(freshData);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch ingredients');
    } finally {
      setLoading(false);
    }
  };

  const refreshIngredients = async (page: number = 1) => {
    // Invalidate cache and reload
    ingredientsCache = null;
    ingredientsCacheTimestamp = null;
    await loadIngredients(page);
  };

  const handleCreate = async (formData: any) => {
    try {
      await createIngredient(formData);
      await refreshIngredients();
      showToast('success', 'Ingredient Created', 'The ingredient has been successfully created.');
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const apiErrors: Record<string, string> = {};
        for (const key in err.response.data.errors) {
          apiErrors[key] = err.response.data.errors[key][0];
        }
        throw apiErrors;
      } else {
        const message = err.response?.data?.message || 'Failed to create ingredient.';
        throw { general: message };
      }
    }
  };

  const handleUpdate = async (id: number, formData: any) => {
    try {
      await updateIngredient(id, formData);
      await refreshIngredients();
      showToast('success', 'Ingredient Updated', 'The ingredient details were successfully updated.');
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const apiErrors: Record<string, string> = {};
        for (const key in err.response.data.errors) {
          apiErrors[key] = err.response.data.errors[key][0];
        }
        throw apiErrors;
      } else {
        const message = err.response?.data?.message || 'Failed to update ingredient.';
        throw { general: message };
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteIngredient(id);
      await refreshIngredients();
      showToast('success', 'Ingredient Deleted', 'The ingredient was successfully deleted.');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to delete ingredient.';
      throw message;
    }
  };

  useEffect(() => {
    loadIngredients();
  }, []);

  // Listen for branch change events
  useEffect(() => {
    const handleBranchChange = (event: CustomEvent) => {
      console.log('Branch changed, refreshing ingredients data...', event.detail);
      // Clear cache and refresh data
      invalidateIngredientsCache();
      loadIngredients();
    };

    window.addEventListener('branchChanged', handleBranchChange as EventListener);

    return () => {
      window.removeEventListener('branchChanged', handleBranchChange as EventListener);
    };
  }, []);

  return {
    ingredients,
    loading,
    error,
    pagination,
    refreshIngredients,
    loadIngredients,
    handleCreate,
    handleUpdate,
    handleDelete,
  };
}

// Function to invalidate ingredients cache
export function invalidateIngredientsCache() {
  ingredientsCache = null;
  ingredientsCacheTimestamp = null;
  ingredientsCacheBranchId = null;
  console.log('Ingredients cache invalidated');
}
