import { useEffect, useMemo, useState } from 'react';
import { generateService } from '../services/generate-service';
import { mapBackendToFrontend, type PayrollReport } from '../types';
import { formatReportDateRange } from '../utils/payroll-view-helpers';

interface UsePayrollReportsOptions {
  onError: (message: string) => void;
}

export function usePayrollReports({ onError }: UsePayrollReportsOptions) {
  const [reports, setReports] = useState<PayrollReport[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const hasTenantWithoutBranchContext = () => {
    if (typeof window === 'undefined') return false;
    try {
      const tenantId = JSON.parse(localStorage.getItem('tenant_context') || '{}')?.id;
      const branchId = JSON.parse(localStorage.getItem('branch_context') || '{}')?.id;
      return Boolean(tenantId) && !Boolean(branchId);
    } catch {
      return false;
    }
  };

  const hasBranchContext = () => {
    if (typeof window === 'undefined') return false;
    try {
      const branchId = JSON.parse(localStorage.getItem('branch_context') || '{}')?.id;
      return Boolean(branchId);
    } catch {
      return false;
    }
  };

  const waitForBranchContext = async (timeoutMs = 6000): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    if (hasBranchContext()) return true;

    return await new Promise((resolve) => {
      let settled = false;

      const cleanup = () => {
        window.removeEventListener('branchChanged', onBranchChanged as EventListener);
        window.removeEventListener('storage', onStorage);
      };

      const finish = (value: boolean) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(value);
      };

      const onBranchChanged = () => {
        finish(hasBranchContext());
      };

      const onStorage = (event: StorageEvent) => {
        if (event.key !== 'branch_context') return;
        finish(hasBranchContext());
      };

      window.addEventListener('branchChanged', onBranchChanged as EventListener);
      window.addEventListener('storage', onStorage);

      setTimeout(() => {
        finish(hasBranchContext());
      }, timeoutMs);
    });
  };

  const fetchReports = async (retryOnContextReady = true) => {
    try {
      setLoading(true);
      setError(null);

      // Tenant switching can briefly clear branch context; wait before requesting reports.
      if (hasTenantWithoutBranchContext()) {
        const ready = await waitForBranchContext();
        if (!ready) {
          setLoading(false);
          return;
        }
      }

      const data = await generateService.getReports();
      if (!Array.isArray(data)) {
        setError('Invalid response format from server');
        setReports([]);
        return;
      }

      if (data.length === 0) {
        setReports([]);
        return;
      }

      setReports(data.map((item) => mapBackendToFrontend(item, formatReportDateRange)));
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to load payroll reports';
      const isMissingBranchContext =
        String(message).toLowerCase().includes('branch context required');

      if (retryOnContextReady && isMissingBranchContext) {
        const ready = await waitForBranchContext();
        if (ready) {
          await fetchReports(false);
          return;
        }
      }

      setError(message);
      setReports([]);
      onError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleContextChange = () => {
      setCurrentPage(1);
      fetchReports();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'branch_context' || e.key === 'tenant_context') {
        handleContextChange();
      }
    };

    window.addEventListener('branchChanged', handleContextChange);
    window.addEventListener('tenantChanged', handleContextChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('branchChanged', handleContextChange);
      window.removeEventListener('tenantChanged', handleContextChange);
      window.removeEventListener('storage', handleStorageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredReports = useMemo(() => {
    if (!searchTerm.trim()) return reports;
    const q = searchTerm.toLowerCase();
    return reports.filter((r) =>
      r.dateRange.toLowerCase().includes(q) ||
      r.payrollType.toLowerCase().includes(q) ||
      r.generatedBy.toLowerCase().includes(q)
    );
  }, [reports, searchTerm]);

  const totalItems = filteredReports.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const from = totalItems ? (currentPage - 1) * itemsPerPage + 1 : null;
  const to = totalItems ? Math.min(currentPage * itemsPerPage, totalItems) : null;
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (value: string) => {
    const per = parseInt(value, 10);
    const safe = Number.isFinite(per) && per > 0 ? per : 10;
    setItemsPerPage(safe);
    setCurrentPage(1);
  };

  const refresh = () => {
    fetchReports();
  };

  return {
    reports,
    currentPage,
    setCurrentPage,
    loading,
    error,
    searchTerm,
    itemsPerPage,
    filteredReports,
    totalItems,
    totalPages,
    from,
    to,
    paginatedReports,
    fetchReports,
    handleSearchChange,
    handleItemsPerPageChange,
    refresh,
  };
}
