'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { API_ENDPOINTS } from '../../../config/api.config';

export interface SupplierCategory {
  id: number;
  name: string;
}

export function useSupplierCategories() {
  const [categories, setCategories] = useState<SupplierCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api(`${API_ENDPOINTS.SUPPLIERS.BASE}/supplier-categories`);
      setCategories(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch supplier categories');
      console.error('Failed to fetch supplier categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    isLoading,
    error,
    refetch: fetchCategories,
  };
}