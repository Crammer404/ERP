'use client';

import { useState, useEffect } from 'react';
import { fetchPurchasesBySupplier, Purchase } from '../services/purchaseService';

export function useSupplierPurchases(supplierId: number | null) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPurchases = async () => {
    if (!supplierId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await fetchPurchasesBySupplier(supplierId);
      setPurchases(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch purchases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchases();
  }, [supplierId]);

  return {
    purchases,
    loading,
    error,
    refreshPurchases: loadPurchases,
  };
}