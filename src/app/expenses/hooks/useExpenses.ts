'use client';

import { useState, useEffect } from 'react';
import { fetchExpenses, createExpense, updateExpense, deleteExpense, Expense } from '../services/expenseService';
import { toast } from "@/hooks/use-toast";
import { tenantContextService } from '@/services/tenant/tenantContextService';

// Global cache for expenses data
let expensesCache: Expense[] | null = null;
let expensesCacheTimestamp: number | null = null;
let expensesCacheBranchId: number | null = null;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes in milliseconds

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
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

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we have valid cached data
      const now = Date.now();
      const currentBranch = tenantContextService.getStoredBranchContext();
      const currentBranchId = currentBranch?.id || null;

      if (expensesCache && expensesCacheTimestamp && expensesCacheBranchId === currentBranchId && (now - expensesCacheTimestamp) < CACHE_DURATION) {
        console.log('Using cached expenses data for branch:', currentBranchId);
        setExpenses(expensesCache || []);
        setLoading(false);
        return;
      }

      const response = await fetchExpenses();
      console.log('Fetch expenses response:', response);

      // Cache the data
      const data = response.data;
      const freshData = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      console.log('Fresh data:', freshData);
      expensesCache = freshData;
      expensesCacheTimestamp = now;
      expensesCacheBranchId = currentBranchId;

      setExpenses(freshData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  const refreshExpenses = async () => {
    // Invalidate cache and reload
    expensesCache = null;
    expensesCacheTimestamp = null;
    await loadExpenses();
  };

  const handleCreate = async (formData: any) => {
    try {
      await createExpense(formData);
      await refreshExpenses();
      showToast("success", "Expense Created", "The expense has been successfully created.");
    } catch (err: any) {
      console.error('Expense creation error:', err.response?.data || err);
      if (err.response?.data?.errors) {
        const apiErrors: Record<string, string> = {};
        for (const key in err.response.data.errors) {
          apiErrors[key] = err.response.data.errors[key][0];
        }
        throw apiErrors;
      } else {
        const message = err.response?.data?.message || "Failed to create expense.";
        throw { general: message };
      }
    }
  };

  const handleUpdate = async (id: number, formData: any) => {
    try {
      await updateExpense(id, formData);
      await refreshExpenses();
      showToast("success", "Expense Updated", "The expense details were successfully updated.");
    } catch (err: any) {
      console.error('Expense update error:', err.response?.data || err);
      if (err.response?.data?.errors) {
        const apiErrors: Record<string, string> = {};
        for (const key in err.response.data.errors) {
          apiErrors[key] = err.response.data.errors[key][0];
        }
        throw apiErrors;
      } else {
        const message = err.response?.data?.message || "Failed to update expense.";
        throw { general: message };
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteExpense(id);
      await refreshExpenses();
      showToast("success", "Expense Deleted", "The expense was successfully deleted.");
    } catch (err: any) {
      console.error('Expense deletion error:', err.response?.data || err);
      const message = err.response?.data?.message || "Failed to delete expense.";
      throw message;
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  // Listen for branch change events
  useEffect(() => {
    const handleBranchChange = (event: CustomEvent) => {
      console.log('Branch changed, refreshing expenses data...', event.detail);
      // Clear cache and refresh data
      invalidateExpensesCache();
      loadExpenses();
    };

    window.addEventListener('branchChanged', handleBranchChange as EventListener);
    
    return () => {
      window.removeEventListener('branchChanged', handleBranchChange as EventListener);
    };
  }, []);

  return {
    expenses,
    loading,
    error,
    refreshExpenses,
    handleCreate,
    handleUpdate,
    handleDelete
  };
}

// Function to invalidate expenses cache (call this after creating new expenses)
export function invalidateExpensesCache() {
  expensesCache = null;
  expensesCacheTimestamp = null;
  expensesCacheBranchId = null;
  console.log('Expenses cache invalidated');
}