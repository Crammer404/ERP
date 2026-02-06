import { useState, useEffect } from 'react';
import { fetchTransactionsByCustomer } from '../services/transactionsService';
import type { BackendTransaction } from '@/lib/types';

export function useCustomerTransactions(customerId: number | null) {
  const [transactions, setTransactions] = useState<BackendTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔹 pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!customerId) return;

    async function loadTransactions() {
      try {
        setLoading(true);
        setError(null);
        setCurrentPage(1); // Reset to first page when customer changes

        const response = await fetchTransactionsByCustomer(customerId);
        setTransactions(response.data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch customer transactions');
      } finally {
        setLoading(false);
      }
    }

    loadTransactions();
  }, [customerId]);

  return {
    transactions,
    loading,
    error,
    currentPage,
    setCurrentPage,
    itemsPerPage,
  };
}