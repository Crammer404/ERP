'use client';

import { useState, useEffect } from 'react';
import { Customer, fetchCustomers, createCustomer, updateCustomer, deleteCustomer, CreateCustomerRequest, UpdateCustomerRequest } from '../services/customerService';
import { toast } from "@/hooks/use-toast";
import { tenantContextService } from '@/services/tenant/tenantContextService';
import { invalidateActivityLogsCache } from '../../settings/activity-logs/hooks/useActivityLogs';

// Global cache for customers data
let customersCache: Customer[] | null = null;
let customersCacheTimestamp: number | null = null;
let customersCacheBranchId: number | null = null;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes in milliseconds

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
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

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current branch context
      const currentBranch = tenantContextService.getStoredBranchContext();
      if (!currentBranch) {
        setError('No branch context available');
        setCustomers([]);
        setLoading(false);
        return;
      }

      const currentBranchId = currentBranch.id;

      // Check if we have valid cached data
      const now = Date.now();
      if (customersCache && customersCacheTimestamp && customersCacheBranchId === currentBranchId && (now - customersCacheTimestamp) < CACHE_DURATION) {
        console.log('Using cached customers data for branch:', currentBranchId);
        setCustomers(customersCache || []);
        setLoading(false);
        return;
      }

      const response = await fetchCustomers(undefined, undefined, undefined, currentBranchId);
      console.log('Fetch customers response:', response);

      // Cache the data
      const data = response.data || [];
      console.log('Fresh data:', data);
      customersCache = data;
      customersCacheTimestamp = now;
      customersCacheBranchId = currentBranchId;

      setCustomers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load customers');
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshCustomers = async () => {
    // Invalidate cache and reload
    customersCache = null;
    customersCacheTimestamp = null;
    await loadCustomers();
  };

  const handleCreate = async (customerData: CreateCustomerRequest) => {
    try {
      const response = await createCustomer(customerData);
      await refreshCustomers(); // Refresh to get updated data with proper filtering
      invalidateActivityLogsCache();
      showToast("success", "Customer Created", "The customer has been successfully created.");
      return response;
    } catch (err: any) {
      console.error('Error creating customer:', err);
      if (err.response?.data?.errors) {
        const apiErrors: Record<string, string> = {};
        for (const key in err.response.data.errors) {
          apiErrors[key] = err.response.data.errors[key][0];
        }
        throw apiErrors;
      } else {
        const message = err.response?.data?.message || "Failed to create customer.";
        throw { general: message };
      }
    }
  };

  const handleUpdate = async (id: number, customerData: UpdateCustomerRequest) => {
    try {
      const response = await updateCustomer(id, customerData);
      await refreshCustomers(); // Refresh to get updated data with proper filtering
      invalidateActivityLogsCache();
      showToast("success", "Customer Updated", "The customer details were successfully updated.");
      return response;
    } catch (err: any) {
      console.error('Error updating customer:', err);
      if (err.response?.data?.errors) {
        const apiErrors: Record<string, string> = {};
        for (const key in err.response.data.errors) {
          apiErrors[key] = err.response.data.errors[key][0];
        }
        throw apiErrors;
      } else {
        const message = err.response?.data?.message || "Failed to update customer.";
        throw { general: message };
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCustomer(id);
      await refreshCustomers(); // Refresh to get updated data with proper filtering
      invalidateActivityLogsCache();
      showToast("success", "Customer Deleted", "The customer was successfully deleted.");
    } catch (err: any) {
      console.error('Error deleting customer:', err);
      const message = err.response?.data?.message || "Failed to delete customer.";
      throw message;
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // Listen for branch change events
  useEffect(() => {
    const handleBranchChange = (event: CustomEvent) => {
      console.log('Branch changed, refreshing customers data...', event.detail);
      // Clear cache and refresh data
      invalidateCustomersCache();
      loadCustomers();
    };

    window.addEventListener('branchChanged', handleBranchChange as EventListener);

    return () => {
      window.removeEventListener('branchChanged', handleBranchChange as EventListener);
    };
  }, []);

  return {
    customers,
    loading,
    error,
    handleCreate,
    handleUpdate,
    handleDelete,
    refreshCustomers,
  };
};

// Function to invalidate customers cache (call this after creating new customers)
export function invalidateCustomersCache() {
  customersCache = null;
  customersCacheTimestamp = null;
  customersCacheBranchId = null;
  console.log('Customers cache invalidated');
}