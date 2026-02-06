'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { MoreVertical, Eye, Download, Trash2 } from 'lucide-react';
import GeneratePayrollDialog from './component/generate-payroll';
import { payrollService, PayrollReport as ServicePayrollReport } from '@/services/payroll/payrollService';
import { useToast } from '@/hooks/use-toast';
import { EmptyStates } from '@/components/ui/empty-state';
import { Loader } from '@/components/ui/loader';

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
  const itemsPerPage = 10;
  const { toast } = useToast();
  
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

  // Pagination
  const totalPages = Math.ceil(reports.length / itemsPerPage);
  const paginatedReports = reports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatCurrency = (amount: number) => {
    return `₱ ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleView = async (report: PayrollReport) => {
    try {
      const payslipsData = await payrollService.viewPayslips(report.id);
      // TODO: Open a modal or navigate to a view page with payslipsData
      console.log('View report payslips:', payslipsData);
      toast({
        title: 'View Report',
        description: `Loaded ${payslipsData.payslips.length} payslips for this report`,
      });
    } catch (err: any) {
      console.error('Failed to view report:', err);
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to load report details',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = async (report: PayrollReport) => {
    try {
      const payslipsData = await payrollService.viewPayslips(report.id);
      // TODO: Generate and download PDF/Excel file
      console.log('Download report:', report, payslipsData);
      toast({
        title: 'Download',
        description: 'Download functionality will be implemented soon',
      });
    } catch (err: any) {
      console.error('Failed to download report:', err);
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to download report',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (report: PayrollReport) => {
    if (!confirm(`Are you sure you want to delete this payroll report? This action cannot be undone.`)) {
      return;
    }

    try {
      await payrollService.deleteReport(report.id);
      toast({
        title: 'Success',
        description: 'Payroll report deleted successfully',
      });
      // Refresh the reports list
      fetchReports();
    } catch (err: any) {
      console.error('Failed to delete report:', err);
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to delete report',
        variant: 'destructive',
      });
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

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Reports</h1>
      </div>

       <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Item count */}
            {!loading && reports.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, reports.length)} of {reports.length} items
              </p>
            )}
            {loading && (
              <Loader size="sm" />
            )}

            {/* Generate Payroll Button */}
            <GeneratePayrollDialog
              onGenerate={handleGenerate}
            />
          </div>
        </CardHeader>

        <CardContent>
          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
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
                              <DropdownMenuItem onClick={() => handleView(report)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownload(report)}>
                                <Download className="mr-2 h-4 w-4" />
                                Download
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
                        <EmptyStates.PayrollReports 
                          action={
                            <GeneratePayrollDialog
                              onGenerate={handleGenerate}
                            />
                          }
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && reports.length > 0 && (
            <div className="flex justify-end mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>

                  {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage === 1) {
                      pageNum = i + 1;
                    } else if (currentPage === totalPages) {
                      pageNum = totalPages - 2 + i;
                    } else {
                      pageNum = currentPage - 1 + i;
                    }
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNum)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
