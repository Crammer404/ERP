import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { tenantContextService } from '@/services/tenant/tenantContextService';

export interface Customer {
  id: number;
  branch: {
    id: number;
    name: string;
  };
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  tin: string;
  address: {
    id: number;
    country: string;
    postal_code: string;
    region: string;
    province: string;
    city: string;
    block_lot: string;
    barangay: string;
    street: string;
  };
}

export interface CustomersResponse {
  message: string;
  data: Customer[];
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current branch context
      const branchContext = tenantContextService.getStoredBranchContext();
      if (!branchContext) {
        setError('No branch context available');
        return;
      }

      // Fetch customers filtered by branch
      const response: CustomersResponse = await api('/customers');
      setCustomers(response.data);
    } catch (err: any) {
      console.error('Failed to fetch customers:', err);
      setError(err.message || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Listen for branch changes
  useEffect(() => {
    const handleBranchChange = () => {
      fetchCustomers();
    };

    window.addEventListener('branchChanged', handleBranchChange);
    return () => window.removeEventListener('branchChanged', handleBranchChange);
  }, []);

  return {
    customers,
    loading,
    error,
    refetch: fetchCustomers,
  };
}