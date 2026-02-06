'use client';

import { useState, useEffect } from 'react';
import { fetchSuppliers, createSupplier, updateSupplier, deleteSupplier, Supplier } from '../services/supplierService';
import { toast } from "@/hooks/use-toast";
import { tenantContextService } from '@/services/tenant/tenantContextService';

// Global cache for suppliers data
let suppliersCache: Supplier[] | null = null;
let suppliersCacheTimestamp: number | null = null;
let suppliersCacheBranchId: number | null = null;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes in milliseconds

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we have valid cached data
      const now = Date.now();
      const currentBranch = tenantContextService.getStoredBranchContext();
      const currentBranchId = currentBranch?.id || null;

      if (suppliersCache && suppliersCacheTimestamp && suppliersCacheBranchId === currentBranchId && (now - suppliersCacheTimestamp) < CACHE_DURATION) {
        console.log('Using cached suppliers data for branch:', currentBranchId);
        setSuppliers(suppliersCache || []);
        setLoading(false);
        return;
      }

      const response = await fetchSuppliers();
      console.log('Fetch suppliers response:', response);

      // Cache the data
      const data = response.data || [];
      console.log('Fresh data:', data);
      suppliersCache = data;
      suppliersCacheTimestamp = now;
      suppliersCacheBranchId = currentBranchId;

      setSuppliers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  const refreshSuppliers = async () => {
    // Invalidate cache and reload
    suppliersCache = null;
    suppliersCacheTimestamp = null;
    await loadSuppliers();
  };

  const handleCreate = async (formData: any) => {
    try {
      await createSupplier(formData);
      await refreshSuppliers();
      showToast("success", "Supplier Created", "The supplier has been successfully created.");
    } catch (err: any) {
      console.error('Supplier creation error:', err.response?.data || err);
      if (err.response?.data?.errors) {
        const apiErrors: Record<string, string> = {};
        for (const key in err.response.data.errors) {
          apiErrors[key] = err.response.data.errors[key][0];
        }
        throw apiErrors;
      } else {
        const message = err.response?.data?.message || "Failed to create supplier.";
        throw { general: message };
      }
    }
  };

  const handleUpdate = async (id: number, formData: any) => {
    try {
      await updateSupplier(id, formData);
      await refreshSuppliers();
      showToast("success", "Supplier Updated", "The supplier details were successfully updated.");
    } catch (err: any) {
      console.error('Supplier update error:', err.response?.data || err);
      if (err.response?.data?.errors) {
        const apiErrors: Record<string, string> = {};
        for (const key in err.response.data.errors) {
          apiErrors[key] = err.response.data.errors[key][0];
        }
        throw apiErrors;
      } else {
        const message = err.response?.data?.message || "Failed to update supplier.";
        throw { general: message };
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSupplier(id);
      await refreshSuppliers();
      showToast("success", "Supplier Deleted", "The supplier was successfully deleted.");
    } catch (err: any) {
      console.error('Supplier deletion error:', err.response?.data || err);
      const message = err.response?.data?.message || "Failed to delete supplier.";
      throw message;
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  // Listen for branch change events
  useEffect(() => {
    const handleBranchChange = (event: CustomEvent) => {
      console.log('Branch changed, refreshing suppliers data...', event.detail);
      // Clear cache and refresh data
      invalidateSuppliersCache();
      loadSuppliers();
    };

    window.addEventListener('branchChanged', handleBranchChange as EventListener);

    return () => {
      window.removeEventListener('branchChanged', handleBranchChange as EventListener);
    };
  }, []);

  return {
    suppliers,
    loading,
    error,
    refreshSuppliers,
    handleCreate,
    handleUpdate,
    handleDelete
  };
}

// Function to invalidate suppliers cache (call this after creating new suppliers)
export function invalidateSuppliersCache() {
  suppliersCache = null;
  suppliersCacheTimestamp = null;
  suppliersCacheBranchId = null;
  console.log('Suppliers cache invalidated');
}