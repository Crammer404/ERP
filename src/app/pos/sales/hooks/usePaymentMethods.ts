// src/hooks/usePaymentMethods.ts
'use client';

import { useEffect, useState } from 'react';
import { fetchActivePaymentMethods } from '../services/salesService';
import { tenantContextService } from '@/services/tenant/tenantContextService';

// Global cache for payment methods data
let paymentMethodsCache: PaymentMethod[] | null = null;
let paymentMethodsCacheTimestamp: number | null = null;
let paymentMethodsCacheBranchId: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// ✅ Define PaymentMethod shape
export interface PaymentMethod {
  id: number;
  tenantId: number;
  name: string;
  slug: string;
  isActive: boolean;
}

export function usePaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);

      // Check if we have valid cached data
      const now = Date.now();
      const currentBranch = tenantContextService.getStoredBranchContext();
      const currentBranchId = currentBranch?.id || null;

      if (paymentMethodsCache && paymentMethodsCacheTimestamp && paymentMethodsCacheBranchId === currentBranchId && (now - paymentMethodsCacheTimestamp) < CACHE_DURATION) {
        console.log('Using cached payment methods data for branch:', currentBranchId);
        setPaymentMethods(paymentMethodsCache);
        setLoading(false);
        return;
      }

      console.log('Fetching fresh payment methods data from API');
      const response = await fetchActivePaymentMethods(); // API call
      console.log('API raw payment methods:', response);

      // ✅ Map backend → frontend PaymentMethod type
      const mappedPaymentMethods: PaymentMethod[] = (response.data || []).map((pm: any) => ({
        id: pm.id,
        tenantId: pm.tenant_id,
        name: pm.name,
        slug: pm.slug,
        isActive: Boolean(pm.is_active),
      }));

      console.log('Mapped payment methods:', mappedPaymentMethods);

      // Cache the data
      paymentMethodsCache = mappedPaymentMethods;
      paymentMethodsCacheTimestamp = now;
      paymentMethodsCacheBranchId = currentBranchId;

      setPaymentMethods(mappedPaymentMethods);
    } catch (err: any) {
      console.error('Failed to fetch payment methods:', err);
      setError(err.message || 'Failed to fetch payment methods');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  // Listen for branch change events
  useEffect(() => {
    const handleBranchChange = (event: CustomEvent) => {
      console.log('Branch changed, refreshing payment methods data...', event.detail);
      // Clear cache and refresh data
      invalidatePaymentMethodsCache();
      loadPaymentMethods();
    };

    window.addEventListener('branchChanged', handleBranchChange as EventListener);

    return () => {
      window.removeEventListener('branchChanged', handleBranchChange as EventListener);
    };
  }, []);

  return { paymentMethods, loading, error };
}

// Function to invalidate payment methods cache (call this after creating/updating payment methods)
export function invalidatePaymentMethodsCache() {
  paymentMethodsCache = null;
  paymentMethodsCacheTimestamp = null;
  paymentMethodsCacheBranchId = null;
  console.log('Payment methods cache invalidated');
}
