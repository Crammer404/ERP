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

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

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
