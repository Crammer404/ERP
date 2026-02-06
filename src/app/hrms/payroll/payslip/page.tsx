'use client';

import { useState, useEffect } from 'react';
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
  SelectValue 
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
import { useAuth } from '@/components/providers/auth-provider';
import { User, MoreVertical, Eye, Download } from 'lucide-react';
import { EmptyStates } from '@/components/ui/empty-state';
import { payrollService, PayslipData } from '@/services/payroll/payrollService';
import { Loader } from '@/components/ui/loader';

// Frontend payslip record interface
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
  payslipData?: PayslipData; // Store full data for view/download
}

export default function PayslipPage() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [payslips, setPayslips] = useState<PayslipRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch payslips from API
  useEffect(() => {
    const fetchPayslips = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await payrollService.getEmployeePayslips();
        
        // Map backend response to frontend format
        const mappedPayslips: PayslipRecord[] = response.payslips.map((payslip, index) => {
          // Calculate total deductions from deductions array
          const totalDeductions = payslip.deductions?.reduce((sum, d) => sum + (d.total || 0), 0) || 0;
          
          return {
            id: index + 1, // Use index as ID since backend doesn't return payslip ID
            dateRange: payslip.date_range,
            payrollType: payslip.payroll_type,
            basicPay: payslip.basic_pay || 0,
            overtimePay: payslip.overtime_pay || 0,
            nightDifferential: payslip.night_diff || 0,
            totalAllowance: payslip.total_allowance || 0,
            totalDeductions: totalDeductions,
            grossPay: payslip.gross || 0,
            netPay: payslip.net || 0,
            payslipData: payslip, // Store full data for view/download
          };
        });
        
        setPayslips(mappedPayslips);
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

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const getUserDisplayName = () => {
    if (!user) return 'Loading...';
    return user.name || user.email || 'User';
  };

  const getUserRole = () => {
    if (!user) return '';
    return user.role_name || '(Employee)';
  };

  const formatCurrency = (amount: number) => {
    return `₱ ${amount.toFixed(2)}`;
  };

  const handleView = (payslip: PayslipRecord) => {
    // TODO: Implement view payslip functionality (open modal or navigate to detail page)
    console.log('View payslip:', payslip);
    if (payslip.payslipData) {
      // You can open a modal or navigate to a detail page here
      // For now, just log the full payslip data
      console.log('Full payslip data:', payslip.payslipData);
    }
  };

  const handleDownload = (payslip: PayslipRecord) => {
    // TODO: Implement download payslip functionality (generate PDF)
    console.log('Download payslip:', payslip);
    if (payslip.payslipData) {
      // You can implement PDF generation here
      // For now, just log the full payslip data
      console.log('Full payslip data for download:', payslip.payslipData);
    }
  };

  // Pagination
  const totalPages = Math.ceil(payslips.length / itemsPerPage);
  const paginatedPayslips = payslips.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6">Payslip</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Section: Employee Profile */}
        <div className="lg:col-span-1">
          <Card className="h-fit max-w-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Employee Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Profile Picture */}
              <div className="flex flex-col items-center">
                <Avatar className="w-20 h-20 mb-2">
                  <AvatarFallback className="text-lg bg-muted">
                    <User className="w-10 h-10 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                
                {/* Employee Name and Role */}
                <div className="text-center">
                  <h3 className="text-sm font-semibold">{getUserDisplayName()}</h3>
                  <p className="text-xs text-muted-foreground">{getUserRole()}</p>
                </div>
              </div>
              
              {/* Current Date and Time */}
              <div className="pt-2 border-t">
                <p className="text-xs font-medium text-center">
                  Today: {formatDateTime(currentTime)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Section: Payslip Records */}
        <div className="lg:col-span-3">
       <Card>
        <CardHeader>
              <div className="space-y-4">
                {/* Records Count */}
                {!loading && (
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, payslips.length)} of {payslips.length} records
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
                <>
                  {/* Table */}
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
                                    <DropdownMenuItem onClick={() => handleDownload(payslip)}>
                                      <Download className="mr-2 h-4 w-4" />
                                      Download
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
                </>
              )}

              {/* Pagination */}
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
      </div>
    </div>
  );
}
