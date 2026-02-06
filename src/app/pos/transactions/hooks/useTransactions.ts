import { useState, useEffect } from 'react';
import { fetchTransactions } from '../services/transactionsService';
import type { BackendTransaction } from '@/lib/types';
import { tenantContextService } from '@/services/tenant/tenantContextService';

// Global cache for transactions data
let transactionsCache: BackendTransaction[] | null = null;
let transactionsCacheTimestamp: number | null = null;
let transactionsCacheBranchId: number | null = null;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes in milliseconds (shorter for transactions as they change more frequently)

export function useTransactions() {
  const [isMounted, setIsMounted] = useState(false);
  const [transactions, setTransactions] = useState<BackendTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔹 pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setIsMounted(true);

    async function loadTransactions() {
      try {
        setLoading(true);
        setError(null);

        // Check if we have valid cached data
        const now = Date.now();
        const currentBranch = tenantContextService.getStoredBranchContext();
        const currentBranchId = currentBranch?.id || null;

        if (transactionsCache && transactionsCacheTimestamp && transactionsCacheBranchId === currentBranchId && (now - transactionsCacheTimestamp) < CACHE_DURATION) {
          console.log('Using cached transactions data for branch:', currentBranchId);
          setTransactions(transactionsCache);
          setLoading(false);
          return;
        }

        console.log('Fetching fresh transactions data from API');
        const response = await fetchTransactions();

        // Cache the data
        const freshData = response.data || [];
        transactionsCache = freshData;
        transactionsCacheTimestamp = now;
        transactionsCacheBranchId = currentBranchId;

        setTransactions(freshData);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch transactions');
      } finally {
        setLoading(false);
      }
    }

    loadTransactions();
  }, []);

  // Refresh on branch change
  useEffect(() => {
    const handleBranchChange = async (event: CustomEvent) => {
      console.log('Branch changed, refreshing transactions...', event.detail);
      // Invalidate cache
      transactionsCache = null;
      transactionsCacheTimestamp = null;
      transactionsCacheBranchId = null;
      // Reload
      try {
        const response = await fetchTransactions();
        const freshData = response.data || [];
        const currentBranch = tenantContextService.getStoredBranchContext();
        const currentBranchId = currentBranch?.id || null;
        transactionsCache = freshData;
        transactionsCacheTimestamp = Date.now();
        transactionsCacheBranchId = currentBranchId;
        setTransactions(freshData);
      } catch (e) {
        console.error('Failed to refresh transactions on branch change:', e);
      }
    };

    window.addEventListener('branchChanged', handleBranchChange as any);
    return () => window.removeEventListener('branchChanged', handleBranchChange as any);
  }, []);

  // Function to invalidate transactions cache (call this after creating new transactions)
  const invalidateCache = () => {
    transactionsCache = null;
    transactionsCacheTimestamp = null;
    transactionsCacheBranchId = null;
    console.log('Transactions cache invalidated');
  };

  return {
    isMounted,
    transactions,
    loading,
    error,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    invalidateCache,
  };
}

// Export the invalidate function for external use
export const invalidateTransactionsCache = () => {
  transactionsCache = null;
  transactionsCacheTimestamp = null;
  console.log('Transactions cache invalidated');
};