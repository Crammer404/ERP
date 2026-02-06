'use client';

import { useState, useEffect, useMemo } from 'react';
import { Accordion } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { History } from 'lucide-react';
import { TransactionItem, TransactionFilters, type PeriodFilter } from './components';
import { useTransactions } from './hooks';
import { useCurrency } from '@/contexts/CurrencyContext';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { Loader } from '@/components/ui/loader';
import {
  DataTable,
  DataTableHeader,
  DataTableHead,
  DataTableBody,
  DataTableFooter,
} from '@/components/ui/data-table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { PaginationInfo } from '@/components/ui/pagination-info';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function TransactionsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('day');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const { transactions, loading, error, currentPage, setCurrentPage, itemsPerPage } = useTransactions();
  const { defaultCurrency } = useCurrency();

  // Generate years array from actual transaction data
  const years = useMemo(() => {
    if (!transactions.length) {
      return [new Date().getFullYear()];
    }
    
    const uniqueYears = new Set<number>();
    transactions.forEach((transaction) => {
      const transactionDate = new Date(transaction.created_at);
      uniqueYears.add(transactionDate.getFullYear());
    });
    
    return Array.from(uniqueYears).sort((a, b) => b - a);
  }, [transactions]);

  // Filter transactions based on selected period
  const filteredTransactions = useMemo(() => {
    if (!transactions.length) return [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.created_at);
      const transactionDay = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate());

      switch (periodFilter) {
        case 'day':
          const targetDate = selectedDate 
            ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
            : today;
          return transactionDay.getTime() === targetDate.getTime();
        case 'month':
          return (
            transactionDate.getMonth() === selectedMonth &&
            transactionDate.getFullYear() === selectedYear
          );
        case 'year':
          return transactionDate.getFullYear() === selectedYear;
        case 'range':
          if (!dateRange?.from) return false;
          const rangeStart = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate());
          const rangeEnd = dateRange.to 
            ? new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate())
            : rangeStart;
          return transactionDay >= rangeStart && transactionDay <= rangeEnd;
        default:
          return true;
      }
    });
  }, [transactions, periodFilter, selectedDate, selectedMonth, selectedYear, dateRange]);

  // Calculate totals for cash, online/card, and total sales from filtered transactions
  const paymentTotals = useMemo(() => {
    const cashTotal = filteredTransactions.reduce((sum, transaction) => {
      const grandTotal = transaction.grand_total || 0;
      const cashPayment = transaction.payment_breakdown?.cash || 0;
      const cardPayment = transaction.payment_breakdown?.online_card || 0;
      const totalPayment = cashPayment + cardPayment;
      
      if (totalPayment > 0) {
        const cashProportion = cashPayment / totalPayment;
        return sum + (grandTotal * cashProportion);
      }
      if (transaction.payment_method?.slug?.toLowerCase() === 'cash') {
        return sum + grandTotal;
      }
      return sum;
    }, 0);

    const onlineCardTotal = filteredTransactions.reduce((sum, transaction) => {
      const grandTotal = transaction.grand_total || 0;
      const cashPayment = transaction.payment_breakdown?.cash || 0;
      const cardPayment = transaction.payment_breakdown?.online_card || 0;
      const totalPayment = cashPayment + cardPayment;
      
      if (totalPayment > 0) {
        const cardProportion = cardPayment / totalPayment;
        return sum + (grandTotal * cardProportion);
      }
      if (transaction.payment_method?.slug?.toLowerCase() !== 'cash') {
        return sum + grandTotal;
      }
      return sum;
    }, 0);

    const totalSales = filteredTransactions.reduce((sum, transaction) => {
      return sum + (transaction.grand_total || 0);
    }, 0);

    // Calculate totals for previous period for comparison
    const now = new Date();
    let previousPeriodStart: Date;
    let previousPeriodEnd: Date;

    switch (periodFilter) {
      case 'day':
        previousPeriodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        previousPeriodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
        break;
      case 'month':
        previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      case 'year':
        previousPeriodStart = new Date(selectedYear - 1, 0, 1);
        previousPeriodEnd = new Date(selectedYear - 1, 11, 31, 23, 59, 59);
        break;
      default:
        previousPeriodStart = new Date();
        previousPeriodEnd = new Date();
    }

    const previousPeriodTransactions = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.created_at);
      return transactionDate >= previousPeriodStart && transactionDate <= previousPeriodEnd;
    });

    const prevCashTotal = previousPeriodTransactions.reduce((sum, transaction) => {
      const grandTotal = transaction.grand_total || 0;
      const cashPayment = transaction.payment_breakdown?.cash || 0;
      const cardPayment = transaction.payment_breakdown?.online_card || 0;
      const totalPayment = cashPayment + cardPayment;
      
      if (totalPayment > 0) {
        const cashProportion = cashPayment / totalPayment;
        return sum + (grandTotal * cashProportion);
      }
      if (transaction.payment_method?.slug?.toLowerCase() === 'cash') {
        return sum + grandTotal;
      }
      return sum;
    }, 0);

    const prevOnlineCardTotal = previousPeriodTransactions.reduce((sum, transaction) => {
      const grandTotal = transaction.grand_total || 0;
      const cashPayment = transaction.payment_breakdown?.cash || 0;
      const cardPayment = transaction.payment_breakdown?.online_card || 0;
      const totalPayment = cashPayment + cardPayment;
      
      if (totalPayment > 0) {
        const cardProportion = cardPayment / totalPayment;
        return sum + (grandTotal * cardProportion);
      }
      if (transaction.payment_method?.slug?.toLowerCase() !== 'cash') {
        return sum + grandTotal;
      }
      return sum;
    }, 0);

    const prevTotalSales = previousPeriodTransactions.reduce((sum, transaction) => {
      return sum + (transaction.grand_total || 0);
    }, 0);

    const calculatePercentageChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      cash: cashTotal,
      onlineCard: onlineCardTotal,
      total: totalSales,
      prevCash: prevCashTotal,
      prevOnlineCard: prevOnlineCardTotal,
      prevTotal: prevTotalSales,
      cashChange: calculatePercentageChange(cashTotal, prevCashTotal),
      onlineCardChange: calculatePercentageChange(onlineCardTotal, prevOnlineCardTotal),
      totalChange: calculatePercentageChange(totalSales, prevTotalSales),
    };
  }, [filteredTransactions, transactions, periodFilter, selectedYear]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [periodFilter, selectedDate, selectedMonth, selectedYear, dateRange, setCurrentPage]);

  // Reset selected date to today when switching to day filter
  useEffect(() => {
    if (periodFilter === 'day' && !selectedDate) {
      setSelectedDate(new Date());
    }
  }, [periodFilter, selectedDate]);

  // Reset selected month/year to current when switching to month/year filter
  useEffect(() => {
    if (periodFilter === 'month') {
      const now = new Date();
      setSelectedMonth(now.getMonth());
      const currentYear = now.getFullYear();
      if (years.length > 0) {
        setSelectedYear(years.includes(currentYear) ? currentYear : years[0]);
      } else {
        setSelectedYear(currentYear);
      }
    } else if (periodFilter === 'year') {
      const now = new Date();
      const currentYear = now.getFullYear();
      if (years.length > 0) {
        setSelectedYear(years.includes(currentYear) ? currentYear : years[0]);
      } else {
        setSelectedYear(currentYear);
      }
    } else if (periodFilter === 'range' && !dateRange) {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      setDateRange({ from: yesterday, to: today });
    }
  }, [periodFilter, dateRange, years]);

  // Ensure selectedYear is valid when years list changes
  useEffect(() => {
    if ((periodFilter === 'month' || periodFilter === 'year') && years.length > 0 && !years.includes(selectedYear)) {
      setSelectedYear(years[0]);
    }
  }, [years, periodFilter, selectedYear]);

  // Clear/reset function
  const handleClearSelection = () => {
    const now = new Date();
    if (periodFilter === 'day') {
      setSelectedDate(now);
    } else if (periodFilter === 'month') {
      setSelectedMonth(now.getMonth());
      setSelectedYear(now.getFullYear());
    } else if (periodFilter === 'year') {
      const currentYear = now.getFullYear();
      if (years.length > 0 && years.includes(currentYear)) {
        setSelectedYear(currentYear);
      } else if (years.length > 0) {
        setSelectedYear(years[0]);
      } else {
        setSelectedYear(currentYear);
      }
    } else if (periodFilter === 'range') {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      setDateRange({ from: yesterday, to: today });
    }
  };

  // Check if selection is different from current date/month/year/range
  const hasCustomSelection = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (periodFilter === 'day') {
      if (!selectedDate) return false;
      const selected = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      return selected.getTime() !== today.getTime();
    } else if (periodFilter === 'month') {
      return selectedMonth !== now.getMonth() || selectedYear !== now.getFullYear();
    } else if (periodFilter === 'year') {
      return selectedYear !== now.getFullYear();
    } else if (periodFilter === 'range') {
      if (!dateRange?.from) return false;
      const rangeStart = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate());
      const rangeEnd = dateRange.to 
        ? new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate())
        : rangeStart;
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return rangeStart.getTime() !== yesterday.getTime() || (rangeEnd && rangeEnd.getTime() !== today.getTime());
    }
    return false;
  }, [periodFilter, selectedDate, selectedMonth, selectedYear, dateRange]);

  // Get period description for empty state
  const getPeriodDescription = () => {
    if (periodFilter === 'day') return 'day';
    if (periodFilter === 'month') return `${MONTHS[selectedMonth]} ${selectedYear}`;
    if (periodFilter === 'year') return `${selectedYear}`;
    if (periodFilter === 'range' && dateRange?.from && dateRange.to) {
      return `range (${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")})`;
    }
    return 'date range';
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const from = filteredTransactions.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const to = Math.min(currentPage * itemsPerPage, filteredTransactions.length);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxPageNumbers = 5;
    
    if (totalPages <= maxPageNumbers) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 'ellipsis', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, 'ellipsis', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, 'ellipsis', currentPage, 'ellipsis', totalPages);
      }
    }
    return pages;
  };

  // Filter props to pass to TransactionFilters component
  const filterProps = {
    periodFilter,
    setPeriodFilter,
    selectedDate,
    setSelectedDate,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    dateRange,
    setDateRange,
    years,
    hasCustomSelection,
    onClear: handleClearSelection,
  };

  // Page header component (inlined)
  const PageHeader = ({ showFilters = false }: { showFilters?: boolean }) => (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <History className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Transactions</h1>
            <p className="text-sm text-muted-foreground">An overview of your transaction history</p>
          </div>
        </div>
        {showFilters && (
          <div className="w-full sm:w-auto">
            <TransactionFilters {...filterProps} />
          </div>
        )}
      </div>
    </div>
  );

  const TableHeader = () => (
    <div className="grid gap-4 text-xs font-medium uppercase tracking-wider
      border-b border-border bg-card px-4 py-3 text-center text-muted-foreground min-w-[900px]"
      style={{ gridTemplateColumns: 'auto 1fr 1fr 1fr 1fr 1fr 1fr 1fr auto' }}>
      <span className="w-6"></span>
      <span className="text-left">Reference</span>
      <span>Branch</span>
      <span>Cashier</span>
      <span>Status</span>
      <span>Total Items</span>
      <span>Total Amount</span>
      <span>Amount Paid</span>
      <span className="w-8"></span>
    </div>
  );

  const renderTableBody = () => {
    if (!isMounted || loading) {
      return (
        <div className="flex items-center justify-center py-16">
          <Loader size="md" />
        </div>
      );
    }

    // Error state
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <p className="text-red-500 text-center">Error: {error}</p>
        </div>
      );
    }

    // No transactions at all
    if (transactions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <History className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold font-headline text-center">
            No transactions yet
          </h3>
          <p className="text-muted-foreground text-center text-sm">
            Complete a purchase to see your history here.
          </p>
        </div>
      );
    }

    // No filtered transactions
    if (filteredTransactions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <History className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold font-headline text-center">
            No transactions found
          </h3>
          <p className="text-muted-foreground text-center text-sm">
            No transactions found for the selected {getPeriodDescription()}.
          </p>
        </div>
      );
    }

    // Show transactions
    return (
      <Accordion type="single" collapsible className="w-full">
        {paginatedTransactions.map((transaction) => (
          <TransactionItem key={transaction.id} transaction={transaction} />
        ))}
      </Accordion>
    );
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <PageHeader showFilters />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Cash Sales</p>
              <p className="text-3xl font-bold text-foreground">
                {defaultCurrency?.symbol || '₱'}{paymentTotals.cash.toFixed(2)}
              </p>
              {!isNaN(paymentTotals.cashChange) && !loading && (
                <p className={`text-sm font-medium ${paymentTotals.cashChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {paymentTotals.cashChange >= 0 ? '+' : ''}{paymentTotals.cashChange.toFixed(1)}% from last period
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Online/Card Sales</p>
              <p className="text-3xl font-bold text-foreground">
                {defaultCurrency?.symbol || '₱'}{paymentTotals.onlineCard.toFixed(2)}
              </p>
              {!isNaN(paymentTotals.onlineCardChange) && !loading && (
                <p className={`text-sm font-medium ${paymentTotals.onlineCardChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {paymentTotals.onlineCardChange >= 0 ? '+' : ''}{paymentTotals.onlineCardChange.toFixed(1)}% from last period
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Sales</p>
              <p className="text-3xl font-bold text-foreground">
                {defaultCurrency?.symbol || '₱'}{paymentTotals.total.toFixed(2)}
              </p>
              {!isNaN(paymentTotals.totalChange) && !loading && (
                <p className={`text-sm font-medium ${paymentTotals.totalChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {paymentTotals.totalChange >= 0 ? '+' : ''}{paymentTotals.totalChange.toFixed(1)}% from last period
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable>
        {/* Scrollable table container for mobile */}
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <TableHeader />

            <DataTableBody>
              {renderTableBody()}
            </DataTableBody>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <DataTableFooter>
            <PaginationInfo
              from={from}
              to={to}
              total={filteredTransactions.length}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={() => {}}
              showItemsPerPage={false}
            />
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }}
                    className={cn(
                      currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                    )}
                  />
                </PaginationItem>
                
                {getPageNumbers().map((page, idx) => (
                  page === 'ellipsis' ? (
                    <PaginationItem key={`ellipsis-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(page);
                        }}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                    }}
                    className={cn(
                      currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </DataTableFooter>
        )}
      </DataTable>
    </div>
  );
}
