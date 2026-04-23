'use client';

import { Fragment, useState, useEffect, useMemo, useRef } from 'react';
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
import { MoreVertical, Printer, Trash2, Search, RefreshCw, FileSpreadsheet, ChevronDown, Pencil } from 'lucide-react';
import GeneratePayrollDialog from './components/generate-payroll';
import { generateService, type PayslipData } from './services/generate-service';
import { useToast } from '@/hooks/use-toast';
import { EmptyStates } from '@/components/ui/empty-state';
import { Loader } from '@/components/ui/loader';
import { PaginationInfos } from '@/components/ui/pagination-info';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import { PayslipTemplate, type PayslipData as PayslipTemplateData } from '@/components/forms/payslip/payslip-template';
import { useCurrency } from '@/contexts/CurrencyContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { PayslipDropdownTable } from './components/payslip-dropdown-table';
import { EditablePayslipFields, PayrollReport } from './types';
import { formatGeneratedDateTime, formatLocalDate } from './utils/payroll-view-helpers';
import { usePayrollReports } from './hooks/use-payroll-reports';


export default function GeneratePayrollPage() {
  const [deleteTarget, setDeleteTarget] = useState<PayrollReport | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteErrors, setDeleteErrors] = useState<Record<string, string>>({});
  const [exportingId, setExportingId] = useState<number | null>(null);
  const [exportProgressOpen, setExportProgressOpen] = useState(false);
  const [exportProgressPercent, setExportProgressPercent] = useState(0);
  const [exportProgressPhase, setExportProgressPhase] = useState<
    'preparing' | 'downloading' | 'saving'
  >('preparing');
  const [expandedReportId, setExpandedReportId] = useState<number | null>(null);
  const [payslipsByReportId, setPayslipsByReportId] = useState<Record<number, PayslipData[]>>({});
  const [payslipLoadingByReportId, setPayslipLoadingByReportId] = useState<Record<number, boolean>>({});
  const [payslipErrorByReportId, setPayslipErrorByReportId] = useState<Record<number, string | null>>({});
  const { toast } = useToast();
  const [payslipsToPrint, setPayslipsToPrint] = useState<PayslipTemplateData[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement | null>(null);
  const { defaultCurrency } = useCurrency();
  const [editingPayslip, setEditingPayslip] = useState<PayslipData | null>(null);
  const [editPayslipForm, setEditPayslipForm] = useState<EditablePayslipFields>({
    basic_pay: 0,
    overtime_pay: 0,
    night_diff: 0,
    income_tax: 0,
    sss: 0,
    pagibig: 0,
    philhealth: 0,
    gross: 0,
    net: 0,
  });
  const [savingPayslip, setSavingPayslip] = useState(false);
  const [deletePayslipTarget, setDeletePayslipTarget] = useState<{ reportId: number; payslip: PayslipData } | null>(null);
  const [deletePayslipLoading, setDeletePayslipLoading] = useState(false);
  const [deletePayslipErrors, setDeletePayslipErrors] = useState<Record<string, string>>({});
  const {
    currentPage,
    setCurrentPage,
    loading,
    error,
    searchTerm,
    itemsPerPage,
    totalItems,
    totalPages,
    from,
    to,
    paginatedReports,
    fetchReports,
    handleSearchChange,
    handleItemsPerPageChange,
    refresh,
  } = usePayrollReports({
    onError: (message) =>
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      }),
  });

  const formatCurrency = (amount: number) => {
    const symbol = defaultCurrency?.symbol || '₱';
    return `${symbol} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const loadPayslipsForReport = async (reportId: number, force = false) => {
    if (!force && payslipsByReportId[reportId]) return;

    setPayslipLoadingByReportId((prev) => ({ ...prev, [reportId]: true }));
    setPayslipErrorByReportId((prev) => ({ ...prev, [reportId]: null }));
    try {
      const response = await generateService.viewPayslips(reportId);
      setPayslipsByReportId((prev) => ({
        ...prev,
        [reportId]: response.payslips || [],
      }));
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load payslips for this payroll report.';
      setPayslipErrorByReportId((prev) => ({ ...prev, [reportId]: message }));
    } finally {
      setPayslipLoadingByReportId((prev) => ({ ...prev, [reportId]: false }));
    }
  };

  const handleToggleRow = async (reportId: number) => {
    if (expandedReportId === reportId) {
      setExpandedReportId(null);
      return;
    }

    setExpandedReportId(reportId);
    await loadPayslipsForReport(reportId);
  };

  const handlePrint = async (report: PayrollReport) => {
    try {
      setIsPrinting(false);
      setPayslipsToPrint([]);

      const response = await generateService.viewPayslips(report.id);
      const companyName = response.company?.name || '';
      const logoUrl = response.company?.logo || undefined;

      const pushRowIfNotZero = (
        rows: Array<{ leftLabel: string; leftValue: string; rightLabel: string; rightValue: string }>,
        leftLabel: string,
        leftValueNumber: number,
        leftValueDisplay: string,
        rightLabel: string,
        rightValueNumber: number,
        rightValueDisplay: string
      ) => {
        if (leftValueNumber === 0 && rightValueNumber === 0) {
          return;
        }
        rows.push({
          leftLabel,
          leftValue: leftValueDisplay,
          rightLabel,
          rightValue: rightValueDisplay,
        });
      };

      const mapped: PayslipTemplateData[] = response.payslips.map((p) => {
        const otherEarnings = (p.earnings || []).map((e) => ({
          label: e.description,
          amount: e.total || 0,
        }));

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

        const summaryRows: Array<{
          leftLabel: string;
          leftValue: string;
          rightLabel: string;
          rightValue: string;
        }> = [];

        const workedDays = Number(p.worked_days ?? 0);
        const regularHoursWorked = Number(p.regular_hours_worked ?? 0);
        const lateDays = Number(p.late_days ?? 0);
        const lateMinutes = Number(p.late_minutes ?? 0);
        const overtimeDays = Number(p.overtime_days ?? 0);
        const overtimeMinutes = Number(p.overtime_minutes ?? 0);
        const restdayDays = Number(p.restday_days ?? 0);
        const restdayHours = Number(p.restday_hours ?? 0);
        const holidayDays = Number(p.holiday_days ?? 0);
        const holidayHours = Number(p.holiday_hours ?? 0);

        pushRowIfNotZero(
          summaryRows,
          'Days worked',
          workedDays,
          String(workedDays),
          'Regular hours worked',
          regularHoursWorked,
          `${regularHoursWorked} hrs`
        );

        pushRowIfNotZero(
          summaryRows,
          'Days late',
          lateDays,
          String(lateDays),
          'Late minutes',
          lateMinutes,
          `${lateMinutes} min`
        );

        pushRowIfNotZero(
          summaryRows,
          'Days overtime',
          overtimeDays,
          String(overtimeDays),
          'Overtime minutes',
          overtimeMinutes,
          `${overtimeMinutes} min`
        );

        return {
          companyName,
          companyAddress: '',
          logoUrl,
          employeeName: p.employee_name,
          designation: p.position || 'N/A',
          branch: p.branch,
          payrollType: p.payroll_type,
          payPeriod: p.date_range,
          generatedDate: p.pay_date || p.date_end,
          daysWorked: workedDays,
          summaryRows,
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
          currencySymbol: defaultCurrency?.symbol || '₱',
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
      toast({
        title: 'Error',
        description:
          err?.response?.data?.message || 'Failed to load payslips for printing',
        variant: 'destructive',
      });
    }
  };

  const mapPayslipToTemplate = (p: PayslipData, companyName = '', logoUrl?: string): PayslipTemplateData => {
    const otherEarnings = (p.earnings || []).map((e) => ({
      label: e.description,
      amount: e.total || 0,
    }));

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

    const workedDays = Number(p.worked_days ?? 0);
    const regularHoursWorked = Number(p.regular_hours_worked ?? 0);
    const lateDays = Number(p.late_days ?? 0);
    const lateMinutes = Number(p.late_minutes ?? 0);
    const overtimeDays = Number(p.overtime_days ?? 0);
    const overtimeMinutes = Number(p.overtime_minutes ?? 0);

    const summaryRows: Array<{ leftLabel: string; leftValue: string; rightLabel: string; rightValue: string }> = [];
    if (workedDays !== 0 || regularHoursWorked !== 0) {
      summaryRows.push({
        leftLabel: 'Days worked',
        leftValue: String(workedDays),
        rightLabel: 'Regular hours worked',
        rightValue: `${regularHoursWorked} hrs`,
      });
    }
    if (lateDays !== 0 || lateMinutes !== 0) {
      summaryRows.push({
        leftLabel: 'Days late',
        leftValue: String(lateDays),
        rightLabel: 'Late minutes',
        rightValue: `${lateMinutes} min`,
      });
    }
    if (overtimeDays !== 0 || overtimeMinutes !== 0) {
      summaryRows.push({
        leftLabel: 'Days overtime',
        leftValue: String(overtimeDays),
        rightLabel: 'Overtime minutes',
        rightValue: `${overtimeMinutes} min`,
      });
    }

    return {
      companyName,
      companyAddress: '',
      logoUrl,
      employeeName: p.employee_name,
      designation: p.position || 'N/A',
      branch: p.branch,
      payrollType: p.payroll_type,
      payPeriod: p.date_range,
      generatedDate: p.pay_date || p.date_end,
      daysWorked: workedDays,
      summaryRows,
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
      currencySymbol: defaultCurrency?.symbol || '₱',
      primaryColor: '#111827',
      showLogo: !!logoUrl,
    };
  };

  const handlePrintSinglePayslip = async (reportId: number, payslipId: number) => {
    try {
      const response = await generateService.viewPayslips(reportId);
      const target = (response.payslips || []).find((p) => p.id === payslipId);
      if (!target) {
        toast({
          title: 'Not found',
          description: 'Selected payslip is no longer available.',
          variant: 'destructive',
        });
        return;
      }

      const single = mapPayslipToTemplate(target, response.company?.name || '', response.company?.logo || undefined);
      setPayslipsToPrint([single]);
      setIsPrinting(true);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to print payslip.',
        variant: 'destructive',
      });
    }
  };

  const openEditPayslipDialog = (payslip: PayslipData) => {
    setEditingPayslip(payslip);
    setEditPayslipForm({
      basic_pay: Number(payslip.basic_pay || 0),
      overtime_pay: Number(payslip.overtime_pay || 0),
      night_diff: Number(payslip.night_diff || 0),
      income_tax: Number(payslip.income_tax || 0),
      sss: Number(payslip.sss || 0),
      pagibig: Number(payslip.pagibig || 0),
      philhealth: Number(payslip.philhealth || 0),
      gross: Number(payslip.gross || 0),
      net: Number(payslip.net || 0),
    });
  };

  const handleSavePayslipEdit = async () => {
    if (!editingPayslip) return;

    try {
      setSavingPayslip(true);
      await generateService.updatePayslip({
        payslip_id: editingPayslip.id,
        ...editPayslipForm,
      });

      toast({
        title: 'Success',
        description: 'Payslip updated successfully.',
      });

      if (expandedReportId) {
        await loadPayslipsForReport(expandedReportId, true);
      }
      fetchReports();
      setEditingPayslip(null);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to update payslip.',
        variant: 'destructive',
      });
    } finally {
      setSavingPayslip(false);
    }
  };

  const handleDeleteSinglePayslip = async (reportId: number, payslipId: number) => {
    try {
      setDeletePayslipLoading(true);
      setDeletePayslipErrors({});
      await generateService.deletePayslip(payslipId);
      toast({
        title: 'Success',
        description: 'Payslip deleted successfully.',
      });

      if (expandedReportId === reportId) {
        await loadPayslipsForReport(reportId, true);
      }
      fetchReports();
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to delete payslip.';
      setDeletePayslipErrors({ general: message });
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setDeletePayslipLoading(false);
    }
  };

  const handleDelete = async (report: PayrollReport) => {
    setDeleteErrors({});
    setDeleteTarget(report);
  };

  const handleExportExcel = async (report: PayrollReport) => {
    setExportProgressOpen(true);
    setExportProgressPercent(0);
    setExportProgressPhase('preparing');
    setExportingId(report.id);
    try {
      await generateService.exportPayslipsExcel(report.id, {
        onProgress: ({ percent, phase }) => {
          setExportProgressPercent(percent);
          setExportProgressPhase(phase);
        },
      });
      await new Promise((resolve) => setTimeout(resolve, 400));
      toast({
        title: 'Success',
        description: 'Payslips exported to Excel successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to export payslips.',
        variant: 'destructive',
      });
    } finally {
      setExportProgressOpen(false);
      setExportingId(null);
    }
  };

  const exportPhaseLabel =
    exportProgressPhase === 'preparing'
      ? 'Preparing file on the server…'
      : exportProgressPhase === 'downloading'
        ? 'Downloading Excel…'
        : 'Saving to your device…';

  const handleCloseDeleteModal = () => {
    setDeleteTarget(null);
    setDeleteErrors({});
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleteLoading(true);
    setDeleteErrors({});

    try {
      await generateService.deleteReport(deleteTarget.id);
      toast({
        title: 'Success',
        description: 'Payroll report deleted successfully',
      });
      handleCloseDeleteModal();
      fetchReports();
    } catch (err: any) {
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
    includeCola: boolean;
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
        start_date: formatLocalDate(payload.payrollRange.from),
        end_date: formatLocalDate(payload.payrollRange.to),
        payroll_type: payload.payrollType,
        statutory_include: payload.includeStatutoryDeductions ? 1 : 0,
        include_cola: payload.includeCola ? 1 : 0,
      };

      const response = await generateService.generatePayroll(generatePayload);

      const successMessage =
        response.action === 'updated'
          ? `Payroll consolidated and updated (${response.merged_users_count ?? payload.userIds.length} employees).`
          : (response.message || 'Payroll generated successfully');
      toast({
        title: 'Success',
        description: successMessage,
      });
      // Refresh the reports list
      fetchReports();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message 
        || err?.response?.data?.errors 
        || err?.message 
        || 'Failed to generate payroll';

      const earlyOutGateMessage = String(errorMessage).toLowerCase();
      if (earlyOutGateMessage.includes('pending early clock-out requests')) {
        throw err;
      }
      
      toast({
        title: 'Error',
        description: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage),
        variant: 'destructive',
      });
      throw err;
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
                onClick={refresh}
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
                    <TableHead className="whitespace-nowrap text-right">Total SSS (Employee Share)</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Total PhilHealth</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Total Pag-IBIG</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Total Income Tax</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Total Gross Pay</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Total Deductions</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Total Net Pay</TableHead>
                    <TableHead className="whitespace-nowrap">Generated by</TableHead>
                    <TableHead className="whitespace-nowrap">Generated Date</TableHead>
                    <TableHead className="w-[70px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedReports.length > 0 ? (
                    paginatedReports.map((report) => {
                      const isExpanded = expandedReportId === report.id;
                      const isPayslipLoading = Boolean(payslipLoadingByReportId[report.id]);
                      const payslipError = payslipErrorByReportId[report.id];
                      const payslips = payslipsByReportId[report.id] || [];

                      return (
                        <Fragment key={`group-${report.id}`}>
                          <TableRow
                            className={cn('cursor-pointer', isExpanded ? 'bg-muted/40' : '')}
                            onClick={() => handleToggleRow(report.id)}
                          >
                            <TableCell className="whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <ChevronDown
                                  className={cn(
                                    'h-4 w-4 text-muted-foreground transition-transform',
                                    isExpanded ? 'rotate-180' : ''
                                  )}
                                />
                                <span>{report.dateRange}</span>
                              </div>
                            </TableCell>
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
                            <TableCell className="whitespace-nowrap">{formatGeneratedDateTime(report.generatedDate)}</TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleExportExcel(report)}
                                    disabled={exportingId !== null}
                                  >
                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                    {exportingId === report.id ? 'Exporting...' : 'Export Excel'}
                                  </DropdownMenuItem>
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

                          {isExpanded && (
                            <TableRow className="bg-muted/20">
                              <TableCell colSpan={18} className="px-2 py-2">
                                <div className="rounded-md border bg-background p-3">
                                  {isPayslipLoading && (
                                    <div className="py-4 flex justify-center">
                                      <Loader size="sm" />
                                    </div>
                                  )}

                                  {!isPayslipLoading && payslipError && (
                                    <p className="text-sm text-destructive">{payslipError}</p>
                                  )}

                                  {!isPayslipLoading && !payslipError && payslips.length === 0 && (
                                    <p className="text-sm text-muted-foreground">
                                      No payslips found for this payroll report.
                                    </p>
                                  )}

                                  {!isPayslipLoading && !payslipError && payslips.length > 0 && (
                                    <PayslipDropdownTable
                                      reportId={report.id}
                                      payslips={payslips}
                                      formatCurrency={formatCurrency}
                                      onPrint={handlePrintSinglePayslip}
                                      onEdit={openEditPayslipDialog}
                                      onDelete={(reportId, payslip) => {
                                        setDeletePayslipErrors({});
                                        setDeletePayslipTarget({ reportId, payslip });
                                      }}
                                    />
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={18} className="p-0">
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
          contentClassName="border-2 border-destructive/70"
        />
      )}

      <Dialog open={!!editingPayslip} onOpenChange={(open) => !open && setEditingPayslip(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Payslip</DialogTitle>
            <DialogDescription>
              Update selected payslip values for {editingPayslip?.employee_name || 'employee'}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            {([
              ['basic_pay', 'Basic Pay'],
              ['overtime_pay', 'Overtime Pay'],
              ['night_diff', 'Night Differential'],
              ['income_tax', 'Income Tax'],
              ['sss', 'SSS'],
              ['pagibig', 'Pagibig'],
              ['philhealth', 'PhilHealth'],
              ['gross', 'Gross'],
              ['net', 'Net'],
            ] as Array<[keyof EditablePayslipFields, string]>).map(([field, label]) => (
              <div key={field} className="space-y-1">
                <Label className="text-xs">{label}</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={String(editPayslipForm[field] ?? 0)}
                  onChange={(e) =>
                    setEditPayslipForm((prev) => ({
                      ...prev,
                      [field]: Number(e.target.value || 0),
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPayslip(null)} disabled={savingPayslip}>
              Cancel
            </Button>
            <Button onClick={handleSavePayslipEdit} disabled={savingPayslip}>
              {savingPayslip ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {deletePayslipTarget && (
        <DeleteConfirmModal
          isOpen={!!deletePayslipTarget}
          onClose={() => {
            if (deletePayslipLoading) return;
            setDeletePayslipTarget(null);
            setDeletePayslipErrors({});
          }}
          onConfirm={() => handleDeleteSinglePayslip(deletePayslipTarget.reportId, deletePayslipTarget.payslip.id)}
          loading={deletePayslipLoading}
          title="Delete Payslip"
          itemName={deletePayslipTarget.payslip.employee_name}
          errors={deletePayslipErrors}
          contentClassName="border-2 border-destructive/70"
        />
      )}

      <Dialog
        open={exportProgressOpen}
        onOpenChange={(open) => {
          if (!open && exportingId === null) {
            setExportProgressOpen(false);
          }
        }}
      >
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => exportingId !== null && e.preventDefault()}
          onEscapeKeyDown={(e) => exportingId !== null && e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Exporting payslips</DialogTitle>
            <DialogDescription>{exportPhaseLabel}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Progress value={exportProgressPercent} className="h-3" />
            <p className="text-sm text-muted-foreground text-center tabular-nums">
              {exportProgressPercent}%
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
