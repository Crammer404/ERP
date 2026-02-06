import { useState, useEffect } from 'react';
import { fetchCustomer } from '../services/customerService';
import { Customer } from '../services/customerService';

export function useCustomer(customerId: number | null) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) return;

    async function loadCustomer() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchCustomer(customerId!);
        setCustomer(response.customer || null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch customer');
      } finally {
        setLoading(false);
      }
    }

    loadCustomer();
  }, [customerId]);

  return {
    customer,
    loading,
    error,
  };
}