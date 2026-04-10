'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { User, MoreVertical, Eye, Download } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { EmptyStates } from '@/components/ui/empty-state';
import { Loader } from '@/components/ui/loader';
import { payslipService, type PayslipData as ApiPayslipData } from '@/app/hrms/payroll/payslip/services/payslip-services';
import { PayslipTemplate, type PayslipData as PayslipTemplateData } from '@/components/forms/payslip/payslip-template';
import { useCurrency } from '@/contexts/CurrencyContext';

interface PayslipRecord {
  id: number;
  dateRange: string;
  payrollType: string;
  basicPay: number;
  overtimePay: number;
  nightDifferential: number;
  totalAllowance: number;
  totalDeductions: number;
  grossPay: number;
  netPay: number;
  payslipData: ApiPayslipData;
}

interface CompanyInfo {
  name: string;
  logo: string | null;
}

export default function PayslipPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [payslips, setPayslips] = useState<PayslipRecord[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({ name: '', logo: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPayslip, setSelectedPayslip] = useState<PayslipRecord | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const [payslipToDownload, setPayslipToDownload] = useState<PayslipRecord | null>(null);
  const [downloading, setDownloading] = useState(false);
  const downloadRef = useRef<HTMLDivElement | null>(null);
  const { defaultCurrency } = useCurrency();
  const [currentPosition, setCurrentPosition] = useState<string>('');

  useEffect(() => {
    const fetchPayslips = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await payslipService.getEmployeePayslips();
        setCompanyInfo({
          name: response.company?.name || '',
          logo: response.company?.logo || null,
        });

        const mappedPayslips: PayslipRecord[] = response.payslips.map((payslip, index) => {
          const otherDeductionsTotal =
            payslip.deductions?.reduce((sum, deduction) => sum + (deduction.total || 0), 0) || 0;
          const statutoryTotal =
            (payslip.income_tax || 0) +
            (payslip.sss || 0) +
            (payslip.pagibig || 0) +
            (payslip.philhealth || 0);

          return {
            id: index + 1,
            dateRange: payslip.date_range,
            payrollType: payslip.payroll_type,
            basicPay: payslip.basic_pay || 0,
            overtimePay: payslip.overtime_pay || 0,
            nightDifferential: payslip.night_diff || 0,
            totalAllowance: payslip.total_allowance || 0,
            totalDeductions: statutoryTotal + otherDeductionsTotal,
            grossPay: payslip.gross || 0,
            netPay: payslip.net || 0,
            payslipData: payslip,
          };
        });

        setPayslips(mappedPayslips);
        // Use the position from the latest payslip as the current employee position
        if (response.payslips.length > 0) {
          setCurrentPosition(response.payslips[0].role || '');
        } else {
          setCurrentPosition('');
        }
      } catch (err) {
        console.error('Error fetching payslips:', err);
        setError('Failed to load payslips. Please try again later.');
        setPayslips([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPayslips();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const mapToTemplateData = (payslip: ApiPayslipData): PayslipTemplateData => {
    const otherEarnings = [
      ...(payslip.earnings || []).map((earning) => ({
        label: earning.description,
        amount: earning.total || 0,
      })),
    ];

    const otherDeductions = (payslip.deductions || []).map((deduction) => ({
      label: deduction.description,
      amount: deduction.total || 0,
    }));

    const totalEarnings = payslip.gross ?? 0;
    const totalDeductions =
      (payslip.income_tax || 0) +
      (payslip.sss || 0) +
      (payslip.pagibig || 0) +
      (payslip.philhealth || 0) +
      otherDeductions.reduce((sum, d) => sum + d.amount, 0);

    const currencySymbol = defaultCurrency?.symbol || 'PHP';
    const summaryRows: Array<{ leftLabel: string; leftValue: string; rightLabel: string; rightValue: string }> = [];

    const pushRowIfNotZero = (
      leftLabel: string,
      leftValue: number,
      leftSuffix: string,
      rightLabel: string,
      rightValue: number,
      rightSuffix: string
    ) => {
      const left = Number(leftValue || 0);
      const right = Number(rightValue || 0);
      if (left === 0 && right === 0) return;
      summaryRows.push({
        leftLabel,
        leftValue: `${left}${leftSuffix}`,
        rightLabel,
        rightValue: `${right}${rightSuffix}`,
      });
    };

    pushRowIfNotZero(
      'Days worked',
      payslip.worked_days || 0,
      '',
      'Regular hours work',
      payslip.regular_hours_worked || 0,
      'h'
    );
    pushRowIfNotZero(
      'Days late',
      payslip.late_days || 0,
      '',
      'Late minutes',
      payslip.late_minutes || 0,
      'min'
    );
    pushRowIfNotZero(
      'Days overtime',
      payslip.overtime_days || 0,
      '',
      'Overtime minutes',
      payslip.overtime_minutes || 0,
      'min'
    );

    return {
      companyName: companyInfo.name || 'Company',
      companyAddress: '',
      logoUrl: companyInfo.logo || undefined,
      employeeName: payslip.employee_name || 'N/A',
      designation: payslip.role || 'N/A',
      branch: payslip.branch || 'N/A',
      payrollType: payslip.payroll_type || 'N/A',
      payPeriod: payslip.date_range || 'N/A',
      generatedDate: payslip.pay_date || payslip.date_end || 'N/A',
      daysWorked: typeof payslip.worked_days === 'number' ? payslip.worked_days : undefined,
      summaryRows,
      basicPay: payslip.basic_pay || 0,
      overtimePay: payslip.overtime_pay || 0,
      nightDifferential: payslip.night_diff || 0,
      otherEarnings,
      incomeTax: payslip.income_tax || 0,
      sss: payslip.sss || 0,
      pagibig: payslip.pagibig || 0,
      philhealth: payslip.philhealth || 0,
      otherDeductions,
      totalEarnings,
      totalDeductions,
      netPay: payslip.net || totalEarnings - totalDeductions,
      currencySymbol,
      primaryColor: '#111827',
      showLogo: !!companyInfo.logo,
    };
  };

  const selectedTemplateData = useMemo(() => {
    if (!selectedPayslip) return null;
    return mapToTemplateData(selectedPayslip.payslipData);
  }, [selectedPayslip, companyInfo]);

  const downloadTemplateData = useMemo(() => {
    if (!payslipToDownload) return null;
    return mapToTemplateData(payslipToDownload.payslipData);
  }, [payslipToDownload, companyInfo]);

  useEffect(() => {
    if (!downloadTemplateData || !downloadRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: 'Download Failed',
        description: 'Please allow pop-ups to download payslip PDF.',
        variant: 'destructive',
      });
      setPayslipToDownload(null);
      return;
    }

    const html = downloadRef.current.innerHTML;
    const safeEmployeeName = (downloadTemplateData.employeeName || 'employee').replace(/\s+/g, '_');
    const title = `payslip_${safeEmployeeName}_${new Date().toISOString().slice(0, 10)}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: Inter, "Segoe UI", Tahoma, Arial, sans-serif;
              margin: 0;
              padding: 16px;
              background: #f3f4f6;
            }
            .payslip-page { page-break-after: always; }
            @page { size: A4; margin: 12mm; }
          </style>
        </head>
        <body>
          <div class="payslip-page">${html}</div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }, 200);
    };

    setPayslipToDownload(null);
  }, [downloadTemplateData, toast]);

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const getUserDisplayName = () => {
    if (!user) return 'Loading...';
    return user.name || user.email || 'User';
  };

  const getUserPosition = () => currentPosition || '';

  const formatCurrency = (amount: number) => {
    const symbol = defaultCurrency?.symbol || 'PHP';
    return `${symbol} ${amount.toFixed(2)}`;
  };

  const handleView = (payslip: PayslipRecord) => {
    setSelectedPayslip(payslip);
    setIsViewDialogOpen(true);
  };

  const handleDownload = async (payslip: PayslipRecord) => {
    if (downloading) return;

    try {
      setDownloading(true);
      const response = await payslipService.getEmployeePayslips();
      const latest = response.payslips || [];

      const match = latest.find((p) =>
        p.date_start === payslip.payslipData.date_start &&
        p.date_end === payslip.payslipData.date_end &&
        p.pay_date === payslip.payslipData.pay_date
      );

      setPayslipToDownload({
        ...payslip,
        payslipData: match || payslip.payslipData,
      });
    } catch (err) {
      console.error('Failed to refresh payslip before download:', err);
      toast({
        title: 'Download Failed',
        description: 'Failed to refresh payslip data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  const totalPages = Math.ceil(payslips.length / itemsPerPage);
  const paginatedPayslips = payslips.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value, 10));
    setCurrentPage(1);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">
        <Card className="h-fit max-w-xs">
          <CardContent className="space-y-3 pt-5">
            <div className="flex flex-col items-center pt-5">
              <Avatar className="w-20 h-20 mb-2">
                <AvatarFallback className="text-lg bg-muted">
                  <User className="w-10 h-10 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>

              <div className="text-center">
                <h3 className="text-sm font-semibold">{getUserDisplayName()}</h3>
                <p className="text-xs text-muted-foreground">{getUserPosition()}</p>
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs font-medium text-center">
                Today: {formatDateTime(currentTime)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <div className="space-y-4">
              {!loading && (
                <p className="text-sm text-muted-foreground">
                  {payslips.length > 0
                    ? `Showing ${(currentPage - 1) * itemsPerPage + 1} to ${Math.min(currentPage * itemsPerPage, payslips.length)} of ${payslips.length} records`
                    : 'No payslips found'}
                </p>
              )}
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader />
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Date Range</TableHead>
                      <TableHead className="whitespace-nowrap">Payroll Type</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Basic Pay</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Overtime Pay</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Night Differential</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Total Allowance</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Total Deductions</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Gross Pay</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Net Pay</TableHead>
                      <TableHead className="w-[70px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPayslips.length > 0 ? (
                      paginatedPayslips.map((payslip) => (
                        <TableRow key={payslip.id}>
                          <TableCell className="whitespace-nowrap">{payslip.dateRange}</TableCell>
                          <TableCell className="whitespace-nowrap">{payslip.payrollType}</TableCell>
                          <TableCell className="text-right">{formatCurrency(payslip.basicPay)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(payslip.overtimePay)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(payslip.nightDifferential)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(payslip.totalAllowance)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(payslip.totalDeductions)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(payslip.grossPay)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(payslip.netPay)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleView(payslip)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDownload(payslip)}
                                  disabled={downloading}
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  Download PDF
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={10} className="p-0">
                          <EmptyStates.Payslips />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {!loading && payslips.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rows per page:</span>
                  <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payslip Preview</DialogTitle>
          </DialogHeader>
          {selectedTemplateData ? (
            <PayslipTemplate data={selectedTemplateData} className="shadow-none" />
          ) : (
            <div className="py-8 text-center text-muted-foreground">No payslip selected.</div>
          )}
        </DialogContent>
      </Dialog>

      {downloadTemplateData && (
        <div ref={downloadRef} className="hidden">
          <PayslipTemplate data={downloadTemplateData} className="shadow-none" />
        </div>
      )}
    </div>
  );
}
