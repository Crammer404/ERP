// src/hooks/useFloatingOrders.ts
'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getFloatingOrders,
  getFloatingOrder,
  createFloatingOrder,
  updateFloatingOrder,
  addItemToFloatingOrder,
  updateFloatingOrderItem,
  removeItemFromFloatingOrder,
  addTaxesToFloatingOrder,
  billOutFloatingOrder,
  cancelFloatingOrder,
  type FloatingOrder,
  type CreateFloatingOrderPayload,
  type AddItemPayload,
  type BillOutPayload,
} from '../services/floatingOrderService';
import { tenantContextService } from '@/services/tenant/tenantContextService';

// Global cache for floating orders data
let floatingOrdersCache: FloatingOrder[] | null = null;
let floatingOrdersCacheTimestamp: number | null = null;
let floatingOrdersCacheBranchId: number | null = null;
const CACHE_DURATION = 1 * 60 * 1000; // 1 minute in milliseconds

export function useFloatingOrders() {
  const [floatingOrders, setFloatingOrders] = useState<FloatingOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadFloatingOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we have valid cached data
      const now = Date.now();
      const currentBranch = tenantContextService.getStoredBranchContext();
      const currentBranchId = currentBranch?.id || null;

      if (
        floatingOrdersCache &&
        floatingOrdersCacheTimestamp &&
        floatingOrdersCacheBranchId === currentBranchId &&
        (now - floatingOrdersCacheTimestamp) < CACHE_DURATION
      ) {
        console.log('Using cached floating orders data for branch:', currentBranchId);
        setFloatingOrders(floatingOrdersCache);
        setLoading(false);
        return;
      }

      console.log('Fetching fresh floating orders data from API', {
        branchId: currentBranchId,
        branchContext: currentBranch,
      });
      const response = await getFloatingOrders();
      console.log('Floating orders API response:', {
        message: response.message,
        dataLength: response.data?.length || 0,
        data: response.data,
      });
      const orders = response.data || [];

      // Cache the data
      floatingOrdersCache = orders;
      floatingOrdersCacheTimestamp = now;
      floatingOrdersCacheBranchId = currentBranchId;

      console.log('Setting floating orders:', orders.length);
      setFloatingOrders(orders);
    } catch (err: any) {
      console.error('Failed to fetch floating orders:', {
        error: err,
        message: err.message,
        response: err.response,
        stack: err.stack,
      });
      setError(err.message || 'Failed to fetch floating orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFloatingOrders();
  }, [loadFloatingOrders]);

  // Refresh floating orders when branch changes
  useEffect(() => {
    const handleBranchChange = (event: CustomEvent) => {
      console.log('Branch changed, refreshing floating orders...', event.detail);
      invalidateFloatingOrdersCache();
      loadFloatingOrders();
    };

    window.addEventListener('branchChanged', handleBranchChange as EventListener);
    return () => window.removeEventListener('branchChanged', handleBranchChange as EventListener);
  }, [loadFloatingOrders]);

  const createOrder = useCallback(async (payload: CreateFloatingOrderPayload) => {
    try {
      const response = await createFloatingOrder(payload);
      invalidateFloatingOrdersCache();
      await loadFloatingOrders();
      return response;
    } catch (err: any) {
      console.error('Failed to create floating order:', err);
      throw err;
    }
  }, [loadFloatingOrders]);

  const updateOrder = useCallback(async (id: number, payload: Partial<CreateFloatingOrderPayload>) => {
    try {
      const response = await updateFloatingOrder(id, payload);
      invalidateFloatingOrdersCache();
      await loadFloatingOrders();
      return response.data;
    } catch (err: any) {
      console.error('Failed to update floating order:', err);
      throw err;
    }
  }, [loadFloatingOrders]);

  const addItem = useCallback(async (orderId: number, item: AddItemPayload) => {
    try {
      const response = await addItemToFloatingOrder(orderId, item);
      invalidateFloatingOrdersCache();
      await loadFloatingOrders();
      return response.data;
    } catch (err: any) {
      console.error('Failed to add item to floating order:', err);
      throw err;
    }
  }, [loadFloatingOrders]);

  const updateItem = useCallback(async (orderId: number, itemId: number, quantity: number) => {
    try {
      const response = await updateFloatingOrderItem(orderId, itemId, quantity);
      invalidateFloatingOrdersCache();
      await loadFloatingOrders();
      return response.data;
    } catch (err: any) {
      console.error('Failed to update item in floating order:', err);
      throw err;
    }
  }, [loadFloatingOrders]);

  const removeItem = useCallback(async (orderId: number, itemId: number) => {
    try {
      const response = await removeItemFromFloatingOrder(orderId, itemId);
      invalidateFloatingOrdersCache();
      await loadFloatingOrders();
      return response.data;
    } catch (err: any) {
      console.error('Failed to remove item from floating order:', err);
      throw err;
    }
  }, [loadFloatingOrders]);

  const addTaxes = useCallback(async (orderId: number, taxIds: number[]) => {
    try {
      const response = await addTaxesToFloatingOrder(orderId, taxIds);
      invalidateFloatingOrdersCache();
      await loadFloatingOrders();
      return response.data;
    } catch (err: any) {
      console.error('Failed to add taxes to floating order:', err);
      throw err;
    }
  }, [loadFloatingOrders]);

  const billOut = useCallback(async (orderId: number, payload: BillOutPayload) => {
    try {
      const response = await billOutFloatingOrder(orderId, payload);
      invalidateFloatingOrdersCache();
      await loadFloatingOrders();
      return response.data;
    } catch (err: any) {
      console.error('Failed to bill out floating order:', err);
      throw err;
    }
  }, [loadFloatingOrders]);

  const cancelOrder = useCallback(async (id: number) => {
    try {
      await cancelFloatingOrder(id);
      invalidateFloatingOrdersCache();
      await loadFloatingOrders();
    } catch (err: any) {
      console.error('Failed to cancel floating order:', err);
      throw err;
    }
  }, [loadFloatingOrders]);

  const refreshOrder = useCallback(async (id: number) => {
    try {
      const response = await getFloatingOrder(id);
      // Update the specific order in cache
      if (floatingOrdersCache) {
        const index = floatingOrdersCache.findIndex(o => o.id === id);
        if (index !== -1) {
          floatingOrdersCache[index] = response.data;
        } else {
          floatingOrdersCache.push(response.data);
        }
        setFloatingOrders([...floatingOrdersCache]);
      }
      return response.data;
    } catch (err: any) {
      console.error('Failed to refresh floating order:', err);
      throw err;
    }
  }, []);

  return {
    floatingOrders,
    loading,
    error,
    createOrder,
    updateOrder,
    addItem,
    updateItem,
    removeItem,
    addTaxes,
    billOut,
    cancelOrder,
    refreshOrder,
    refresh: loadFloatingOrders,
  };
}

// Function to invalidate floating orders cache
export function invalidateFloatingOrdersCache() {
  floatingOrdersCache = null;
  floatingOrdersCacheTimestamp = null;
  floatingOrdersCacheBranchId = null;
  console.log('Floating orders cache invalidated');
}

