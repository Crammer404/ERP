// src/hooks/useTaxes.ts
'use client';

import { useEffect, useState } from 'react';
import { fetchActiveTaxes } from '../services/salesService';
import { tenantContextService } from '@/services/tenant/tenantContextService';

// Global cache for taxes data
let taxesCache: Tax[] | null = null;
let taxesCacheTimestamp: number | null = null;
let taxesCacheBranchId: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// ✅ Define Tax shape
export interface Tax {
  id: number;
  tenantId: number;
  name: string;
  percentage: number;
  isActive: boolean;
}

export function useTaxes() {
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTaxes = async () => {
      try {
        setLoading(true);

        // Check if we have valid cached data
        const now = Date.now();
        const currentBranch = tenantContextService.getStoredBranchContext();
        const currentBranchId = currentBranch?.id || null;

        if (taxesCache && taxesCacheTimestamp && taxesCacheBranchId === currentBranchId && (now - taxesCacheTimestamp) < CACHE_DURATION) {
          console.log('Using cached taxes data for branch:', currentBranchId);
          setTaxes(taxesCache);
          setLoading(false);
          return;
        }

        console.log('Fetching fresh taxes data from API');
        const response = await fetchActiveTaxes(); // API call
        console.log('API raw taxes:', response);

        // ✅ Map backend → frontend Tax type
        const mappedTaxes: Tax[] = (response.data || []).map((t: any) => ({
          id: t.id,
          tenantId: t.tenant_id,
          name: t.name,
          percentage: parseFloat(t.percentage),
          isActive: Boolean(t.is_active),
        }));

        console.log('Mapped taxes:', mappedTaxes);

        // Cache the data
        taxesCache = mappedTaxes;
        taxesCacheTimestamp = now;
        taxesCacheBranchId = currentBranchId;

        setTaxes(mappedTaxes);
      } catch (err: any) {
        console.error('Failed to fetch taxes:', err);
        setError(err.message || 'Failed to fetch taxes');
      } finally {
        setLoading(false);
      }
    };

    loadTaxes();
  }, []);

  // Listen for branch change events to refresh taxes
  useEffect(() => {
    const handleBranchChange = async (event: CustomEvent) => {
      console.log('Branch changed, refreshing taxes data...', event.detail);
      // Invalidate cache and reload
      invalidateTaxesCache();
      try {
        const response = await fetchActiveTaxes();
        const mappedTaxes: Tax[] = (response.data || []).map((t: any) => ({
          id: t.id,
          tenantId: t.tenant_id,
          name: t.name,
          percentage: parseFloat(t.percentage),
          isActive: Boolean(t.is_active),
        }));
        taxesCache = mappedTaxes;
        taxesCacheTimestamp = Date.now();
        setTaxes(mappedTaxes);
      } catch (e) {
        console.error('Failed to refresh taxes on branch change:', e);
      }
    };

    window.addEventListener('branchChanged', handleBranchChange as any);
    return () => window.removeEventListener('branchChanged', handleBranchChange as any);
  }, []);

  return { taxes, loading, error };
}

// Function to invalidate taxes cache (call this after creating/updating taxes)
export function invalidateTaxesCache() {
  taxesCache = null;
  taxesCacheTimestamp = null;
  taxesCacheBranchId = null;
  console.log('Taxes cache invalidated');
}
