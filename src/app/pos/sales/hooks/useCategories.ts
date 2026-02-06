// src/hooks/useCategories.ts
'use client';

import { useEffect, useState } from 'react';
import { fetchCategories } from '../services/salesService';
import { tenantContextService } from '@/services/tenant/tenantContextService';

// Global cache for categories data
let categoriesCache: Category[] | null = null;
let categoriesCacheTimestamp: number | null = null;
let categoriesCacheBranchId: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// ✅ Define Category shape
export interface Category {
  id: number;
  name: string;
  tenant_id: number | null;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = async () => {
    try {
      setLoading(true);

      // Check if we have valid cached data
      const now = Date.now();
      const currentBranch = tenantContextService.getStoredBranchContext();
      const currentBranchId = currentBranch?.id || null;

      if (categoriesCache && categoriesCacheTimestamp && categoriesCacheBranchId === currentBranchId && (now - categoriesCacheTimestamp) < CACHE_DURATION) {
        console.log('Using cached categories data for branch:', currentBranchId);
        setCategories(categoriesCache);
        setLoading(false);
        return;
      }

      console.log('Fetching fresh categories data from API for branch:', currentBranchId);
      const response = await fetchCategories(currentBranchId || undefined); // API call with branch_id
      console.log('API raw categories:', response);

      // ✅ Map backend → frontend Category type
      const mappedCategories: Category[] = (response.data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        tenant_id: c.tenant_id,
      }));

      console.log('Mapped categories:', mappedCategories);

      // Cache the data
      categoriesCache = mappedCategories;
      categoriesCacheTimestamp = now;
      categoriesCacheBranchId = currentBranchId;

      setCategories(mappedCategories);
    } catch (err: any) {
      console.error('Failed to fetch categories:', err);
      setError(err.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Listen for branch change events
  useEffect(() => {
    const handleBranchChange = (event: CustomEvent) => {
      console.log('Branch changed, refreshing categories data...', event.detail);
      // Clear cache and refresh data
      invalidateCategoriesCache();
      loadCategories();
    };

    window.addEventListener('branchChanged', handleBranchChange as EventListener);

    return () => {
      window.removeEventListener('branchChanged', handleBranchChange as EventListener);
    };
  }, []);

  return { categories, loading, error };
}

// Function to invalidate categories cache (call this after creating/updating categories)
export function invalidateCategoriesCache() {
  categoriesCache = null;
  categoriesCacheTimestamp = null;
  categoriesCacheBranchId = null;
  console.log('Categories cache invalidated');
}