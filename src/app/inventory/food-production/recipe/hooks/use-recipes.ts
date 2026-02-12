'use client';

import { useState, useEffect } from 'react';
import {
  fetchRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  Recipe,
} from '../services/recipe-service';
import { useToast } from '@/hooks/use-toast';
import { tenantContextService } from '@/services/tenant/tenantContextService';

let recipesCache: Recipe[] | null = null;
let recipesCacheTimestamp: number | null = null;
let recipesCacheBranchId: number | null = null;
const CACHE_DURATION = 2 * 60 * 1000;

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
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

  const loadRecipes = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const now = Date.now();
      const currentBranch = tenantContextService.getStoredBranchContext();
      const currentBranchId = currentBranch?.id || null;

      if (
        recipesCache &&
        recipesCacheTimestamp &&
        recipesCacheBranchId === currentBranchId &&
        (now - recipesCacheTimestamp) < CACHE_DURATION
      ) {
        setRecipes(recipesCache || []);
        setLoading(false);
        return;
      }

      const response = await fetchRecipes({ page });
      const freshData = Array.isArray(response.data)
        ? response.data
        : (Array.isArray((response.data as any)?.data) ? (response.data as any).data : []);

      recipesCache = freshData;
      recipesCacheTimestamp = now;
      recipesCacheBranchId = currentBranchId;

      setRecipes(freshData);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch recipes');
    } finally {
      setLoading(false);
    }
  };

  const refreshRecipes = async (page: number = 1) => {
    recipesCache = null;
    recipesCacheTimestamp = null;
    await loadRecipes(page);
  };

  const handleCreate = async (formData: any) => {
    try {
      await createRecipe(formData);
      await refreshRecipes();
      showToast('success', 'Recipe Created', 'The recipe has been successfully created.');
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const apiErrors: Record<string, string> = {};
        for (const key in err.response.data.errors) {
          apiErrors[key] = err.response.data.errors[key][0];
        }
        throw apiErrors;
      } else {
        const message = err.response?.data?.message || 'Failed to create recipe.';
        throw { general: message };
      }
    }
  };

  const handleUpdate = async (id: number, formData: any) => {
    try {
      await updateRecipe(id, formData);
      await refreshRecipes();
      showToast('success', 'Recipe Updated', 'The recipe details were successfully updated.');
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const apiErrors: Record<string, string> = {};
        for (const key in err.response.data.errors) {
          apiErrors[key] = err.response.data.errors[key][0];
        }
        throw apiErrors;
      } else {
        const message = err.response?.data?.message || 'Failed to update recipe.';
        throw { general: message };
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteRecipe(id);
      await refreshRecipes();
      showToast('success', 'Recipe Deleted', 'The recipe was successfully deleted.');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to delete recipe.';
      throw message;
    }
  };

  useEffect(() => {
    loadRecipes();
  }, []);

  useEffect(() => {
    const handleBranchChange = (event: CustomEvent) => {
      invalidateRecipesCache();
      loadRecipes();
    };

    window.addEventListener('branchChanged', handleBranchChange as EventListener);

    return () => {
      window.removeEventListener('branchChanged', handleBranchChange as EventListener);
    };
  }, []);

  return {
    recipes,
    loading,
    error,
    pagination,
    refreshRecipes,
    loadRecipes,
    handleCreate,
    handleUpdate,
    handleDelete,
  };
}

export function invalidateRecipesCache() {
  recipesCache = null;
  recipesCacheTimestamp = null;
  recipesCacheBranchId = null;
}
