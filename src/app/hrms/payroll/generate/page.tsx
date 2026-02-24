'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Printer, Trash2, Search, RefreshCw } from 'lucide-react';
import GeneratePayrollDialog from './component/generate-payroll';
import { payrollService, PayrollReport as ServicePayrollReport } from '@/services/payroll/payrollService';
import { useToast } from '@/hooks/use-toast';
import { EmptyStates } from '@/components/ui/empty-state';
import { Loader } from '@/components/ui/loader';
import { PaginationInfos } from '@/components/ui/pagination-info';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import { PayslipTemplate, type PayslipData as PayslipTemplateData } from '@/components/forms/payslip/payslip-template';

// Frontend interface matching the table display
interface PayrollReport {
  id: number;
  dateRange: string;
  payrollType: string;
  employeeCount: number;
  totalBasicPay: number;
  totalNightDiff: number;
  totalOvertime: number;
  totalOtherEarnings: number;
  totalOtherDeductions: number;
  totalSSS: number;
  totalPhilHealth: number;
  totalPagIBIG: number;
  totalIncomeTax: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  generatedBy: string;
}

// Map backend response to frontend interface
const mapBackendToFrontend = (backend: ServicePayrollReport): PayrollReport => {
  return {
    id: backend.id,
    dateRange: backend.date_range,
    payrollType: backend.payroll_type,
    employeeCount: backend.total_employees,
    totalBasicPay: backend.total_basic_pay,
    totalNightDiff: backend.total_night_differential,
    totalOvertime: backend.total_overtime,
    totalOtherEarnings: backend.total_other_earnings,
    totalOtherDeductions: backend.total_other_deductions,
    totalSSS: backend.total_sss,
    totalPhilHealth: backend.total_philhealth,
    totalPagIBIG: backend.total_pagibig,
    totalIncomeTax: backend.total_income_tax,
    totalGrossPay: backend.total_gross,
    totalDeductions: backend.total_deductions,
    totalNetPay: backend.total_net,
    generatedBy: backend.generated_by,
  };
};

export default function GeneratePayrollPage() {
  // Initialize with empty array - NO dummy data
  const [reports, setReports] = useState<PayrollReport[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<PayrollReport | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteErrors, setDeleteErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const [payslipsToPrint, setPayslipsToPrint] = useState<PayslipTemplateData[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement | null>(null);
  
  // Ensure we never use dummy data - always start empty
  if (reports.length > 0 && !loading && reports.some(r => r.dateRange.includes('2025-02-31'))) {
    console.warn('⚠️ Invalid date detected in reports - this might be dummy data');
  }

  // Fetch reports from API - REAL DATA FROM DATABASE
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching payroll reports from API (REAL DATABASE DATA)...');
      console.log('API Endpoint:', '/hrms/payroll/reports/data');
      
      const data = await payrollService.getReports();
      console.log('✅ Raw API response from database:', data);
      console.log('📊 Number of records:', Array.isArray(data) ? data.length : 'Invalid format');
      
      if (!Array.isArray(data)) {
        console.error('❌ Invalid response format:', data);
        setError('Invalid response format from server');
        setReports([]);
        return;
      }
      
      if (data.length === 0) {
        console.log('ℹ️ No payroll reports found in database');
        setReports([]);
        return;
      }
      
      const mappedReports = data.map(mapBackendToFrontend);
      console.log('✅ Mapped reports from database:', mappedReports);
      console.log('📋 First report sample:', mappedReports[0]);
      setReports(mappedReports);
    } catch (err: any) {
      console.error('❌ Failed to fetch payroll reports from API:', err);
      console.error('Error details:', {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status,
      });
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to load payroll reports';
      setError(errorMessage);
      setReports([]); // Clear reports on error
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize data - fetch from API on mount
  useEffect(() => {
    // Always fetch from API, never use dummy data
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search + Pagination
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

  const formatCurrency = (amount: number) => {
    return `₱ ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    const per = parseInt(value, 10);
    const safe = Number.isFinite(per) && per > 0 ? per : 10;
    setItemsPerPage(safe);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    fetchReports();
  };

  const handlePrint = async (report: PayrollReport) => {
    try {
      setIsPrinting(false);
      setPayslipsToPrint([]);

      const response = await payrollService.viewPayslips(report.id);
      const companyName = response.company?.name || '';
      const logoUrl = response.company?.logo || undefined;

      const mapped: PayslipTemplateData[] = response.payslips.map((p) => {
        const otherEarnings = [
          ...(p.total_allowance
            ? [{ label: 'Allowance', amount: p.total_allowance }]
            : []),
          ...(p.earnings || []).map((e) => ({
            label: e.description,
            amount: e.total || 0,
          })),
        ];

        const otherDeductions = (p.deductions || []).map((d) => ({
          label: d.description,
          amount: d.total || 0,
        }));

        const totalEarnings = p.gross ?? 0;
        const totalDeductions =
          (p.income_tax || 0) +
          (p.sss || 0) +
          (p.pagibig || 0) +
          (p.philhealth || 0) +
          otherDeductions.reduce((sum, d) => sum + d.amount, 0);

        return {
          companyName,
          companyAddress: '',
          logoUrl,
          employeeName: p.employee_name,
          designation: p.role,
          branch: p.branch,
          payrollType: p.payroll_type,
          payPeriod: p.date_range,
          generatedDate: p.pay_date || p.date_end,
          basicPay: p.basic_pay || 0,
          overtimePay: p.overtime_pay || 0,
          nightDifferential: p.night_diff || 0,
          otherEarnings,
          incomeTax: p.income_tax || 0,
          sss: p.sss || 0,
          pagibig: p.pagibig || 0,
          philhealth: p.philhealth || 0,
          otherDeductions,
          totalEarnings,
          totalDeductions,
          netPay: p.net || totalEarnings - totalDeductions,
          currencySymbol: '₱',
          primaryColor: '#111827',
          showLogo: !!logoUrl,
        };
      });

      if (!mapped.length) {
        toast({
          title: 'No Payslips',
          description: 'No payslips were found for this payroll report.',
        });
        return;
      }

      setPayslipsToPrint(mapped);
      setIsPrinting(true);
    } catch (err: any) {
      console.error('Failed to load payslips for printing:', err);
      toast({
        title: 'Error',
        description:
          err?.response?.data?.message || 'Failed to load payslips for printing',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (report: PayrollReport) => {
    setDeleteErrors({});
    setDeleteTarget(report);
  };

  const handleCloseDeleteModal = () => {
    setDeleteTarget(null);
    setDeleteErrors({});
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleteLoading(true);
    setDeleteErrors({});

    try {
      await payrollService.deleteReport(deleteTarget.id);
      toast({
        title: 'Success',
        description: 'Payroll report deleted successfully',
      });
      handleCloseDeleteModal();
      fetchReports();
    } catch (err: any) {
      console.error('Failed to delete report:', err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to delete report';
      setDeleteErrors({ general: message });
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleGenerate = async (payload: {
    payrollType: string;
    payrollRange?: { from?: Date; to?: Date };
    userIds: number[];
    includeStatutoryDeductions: boolean;
  }) => {
    if (!payload.payrollRange?.from || !payload.payrollRange?.to) {
      toast({
        title: 'Validation Error',
        description: 'Please select a date range',
        variant: 'destructive',
      });
      return;
    }

    if (payload.userIds.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one employee',
        variant: 'destructive',
      });
      return;
    }

    try {
      const generatePayload = {
        user_ids: payload.userIds,
        start_date: payload.payrollRange.from.toISOString().split('T')[0],
        end_date: payload.payrollRange.to.toISOString().split('T')[0],
        payroll_type: payload.payrollType,
        statutory_include: payload.includeStatutoryDeductions ? 1 : 0,
      };

      console.log('🚀 Generating payroll with payload:', generatePayload);
      console.log('📡 API Endpoint:', '/hrms/payroll/reports/generate');

      const response = await payrollService.generatePayroll(generatePayload);
      console.log('✅ Payroll generation response:', response);

      const successMessage = 'message' in response ? response.message : 'Payroll generated successfully';
      toast({
        title: 'Success',
        description: successMessage,
      });
      // Refresh the reports list
      fetchReports();
    } catch (err: any) {
      console.error('❌ Failed to generate payroll:', err);
      console.error('Error details:', {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status,
      });
      
      const errorMessage = err?.response?.data?.message 
        || err?.response?.data?.errors 
        || err?.message 
        || 'Failed to generate payroll';
      
      toast({
        title: 'Error',
        description: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage),
        variant: 'destructive',
      });
    }
  };

  // Trigger browser print when payslipsToPrint is ready and ref is rendered
  useEffect(() => {
    if (!isPrinting || payslipsToPrint.length === 0 || !printRef.current) {
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setIsPrinting(false);
      return;
    }

    const html = printRef.current.innerHTML;
    printWindow.document.write(`
      <html>
        <head>
          <title>Payslips</title>
          <style>
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 24px; background: #f3f4f6; }
            .payslip-page { page-break-after: always; }
            @page { margin: 16px; }
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();

    setIsPrinting(false);
    setPayslipsToPrint([]);
  }, [isPrinting, payslipsToPrint]);

  return (
    <div>
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search payroll reports..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
              <Button
                onClick={handleRefresh}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              <GeneratePayrollDialog
                onGenerate={handleGenerate}
              />
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-8">
              <Loader size="md" />
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-8">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchReports} variant="outline">
                Retry
              </Button>
            </div>
          )}

          {/* Table - Shows real data from database via API */}
          {!loading && !error && (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Date Range</TableHead>
                    <TableHead className="whitespace-nowrap">Payroll Type</TableHead>
                    <TableHead className="whitespace-nowrap text-right">No. of Employee</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Total Basic Pay</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Total Night Diff. Pay</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Total Overtime</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Total Other Earnings</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Total Other Deductions</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Total SSS</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Total PhilHealth</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Total Pag-IBIG</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Total Income Tax</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Total Gross Pay</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Total Deductions</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Total Net Pay</TableHead>
                    <TableHead className="whitespace-nowrap">Generated by</TableHead>
                    <TableHead className="w-[70px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedReports.length > 0 ? (
                    paginatedReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="whitespace-nowrap">{report.dateRange}</TableCell>
                        <TableCell className="whitespace-nowrap">{report.payrollType}</TableCell>
                        <TableCell className="text-right">{report.employeeCount}</TableCell>
                        <TableCell className="text-right">{formatCurrency(report.totalBasicPay)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(report.totalNightDiff)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(report.totalOvertime)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(report.totalOtherEarnings)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(report.totalOtherDeductions)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(report.totalSSS)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(report.totalPhilHealth)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(report.totalPagIBIG)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(report.totalIncomeTax)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(report.totalGrossPay)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(report.totalDeductions)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(report.totalNetPay)}</TableCell>
                        <TableCell className="whitespace-nowrap">{report.generatedBy}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handlePrint(report)}>
                                <Printer className="mr-2 h-4 w-4" />
                                Print
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(report)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={17} className="p-0">
                        <EmptyStates.PayrollReports/>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && totalItems > 0 && (
            <div className="flex justify-between items-center mt-6">
              <PaginationInfos.Standard
                from={from}
                to={to}
                total={totalItems}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={handleItemsPerPageChange}
              />

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) =>
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    )
                    .map((page, idx, arr) => {
                      const prev = arr[idx - 1];
                      const showEllipsis = prev && page - prev > 1;
                      return (
                        <div key={page} className="flex items-center">
                          {showEllipsis && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        </div>
                      );
                    })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden container used for printing payslips */}
      {payslipsToPrint.length > 0 && (
        <div ref={printRef} className="hidden">
          {payslipsToPrint.map((payslip, idx) => (
            <div key={idx} className="payslip-page mb-4">
              <PayslipTemplate data={payslip} />
            </div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          isOpen={!!deleteTarget}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          loading={deleteLoading}
          title="Delete Payroll Report"
          itemName={deleteTarget.dateRange}
          errors={deleteErrors}
        />
      )}
    </div>
  );
}
