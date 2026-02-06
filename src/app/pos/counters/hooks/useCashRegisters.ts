import { useState, useEffect } from 'react';
import {
  fetchCashRegisters,
  fetchAvailableCashRegisters,
  type CashRegister,
} from '../service/cashRegisterService';
import { tenantContextService } from '@/services/tenant/tenantContextService';

export function useCashRegisters() {
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadCashRegisters = async () => {
    const branchContext = tenantContextService.getStoredBranchContext();
    
    // console.log('[useCashRegisters] Loading cash registers...', {
    //   branchId: branchContext?.id,
    //   branchName: branchContext?.name,
    //   hasBranchContext: !!branchContext,
    //   timestamp: new Date().toISOString(),
    // });
    
    try {
      setLoading(true);
      setError(null);

      // console.log('[useCashRegisters] Calling fetchCashRegisters...');
      const response = await fetchCashRegisters();
      
      // console.log('[useCashRegisters] Response received:', {
      //   hasResponse: !!response,
      //   hasData: !!response?.data,
      //   dataIsArray: Array.isArray(response?.data),
      //   dataLength: Array.isArray(response?.data) ? response.data.length : 'N/A',
      //   responseMessage: response?.message,
      //   fullResponse: response,
      // });
      
      const registers = response.data || [];
      
      // Log branch_id mismatch if any
      // if (registers.length > 0 && branchContext?.id) {
      //   const mismatchedBranches = registers.filter(r => r.branch_id !== branchContext.id);
      //   if (mismatchedBranches.length > 0) {
      //     console.warn('[useCashRegisters] Found cash registers with different branch_id:', {
      //       expectedBranchId: branchContext.id,
      //       mismatchedRegisters: mismatchedBranches.map(r => ({
      //         id: r.id,
      //         name: r.name,
      //         branch_id: r.branch_id,
      //       })),
      //     });
      //   }
      // }
      
      // console.log('[useCashRegisters] Setting cash registers:', {
      //   count: registers.length,
      //   expectedBranchId: branchContext?.id,
      //   registers: registers.map(r => ({ 
      //     id: r.id, 
      //     name: r.name, 
      //     branch_id: r.branch_id,
      //     matchesBranch: r.branch_id === branchContext?.id,
      //   })),
      // });
      
      setCashRegisters(registers);
      
      // if (registers.length === 0) {
      //   console.warn('[useCashRegisters] No cash registers returned from API', {
      //     branchId: branchContext?.id,
      //     branchName: branchContext?.name,
      //   });
      // }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to fetch cash registers';
      // const errorDetails = {
      //   error,
      //   errorMessage,
      //   errorResponse: err?.response,
      //   errorResponseData: err?.response?.data,
      //   errorResponseStatus: err?.response?.status,
      //   branchContext: branchContext,
      //   stack: err?.stack,
      // };
      
      // console.error('[useCashRegisters] Failed to fetch cash registers:', errorDetails);
      
      setError(errorMessage);
      setCashRegisters([]);
    } finally {
      setLoading(false);
      // console.log('[useCashRegisters] Loading completed');
    }
  };

  useEffect(() => {
    loadCashRegisters();

    // Listen for branch change events
    const handleBranchChange = () => {
      loadCashRegisters();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('branch-changed', handleBranchChange);
      return () => {
        window.removeEventListener('branch-changed', handleBranchChange);
      };
    }
  }, []);

  return {
    cashRegisters,
    loading,
    error,
    refetch: loadCashRegisters,
  };
}

export function useAvailableCashRegisters() {
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadAvailableCashRegisters = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchAvailableCashRegisters();
      setCashRegisters(response.data || []);
    } catch (err: any) {
      // console.error('Failed to fetch available cash registers:', err);
      setError(err.message || 'Failed to fetch available cash registers');
      setCashRegisters([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvailableCashRegisters();

    // Listen for branch change events
    const handleBranchChange = () => {
      loadAvailableCashRegisters();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('branch-changed', handleBranchChange);
      return () => {
        window.removeEventListener('branch-changed', handleBranchChange);
      };
    }
  }, []);

  return {
    cashRegisters,
    loading,
    error,
    refetch: loadAvailableCashRegisters,
  };
}
