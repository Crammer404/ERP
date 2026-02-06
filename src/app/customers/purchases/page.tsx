'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, History } from 'lucide-react';
import { Accordion } from '@/components/ui/accordion';
import { useCustomerTransactions } from '../../pos/transactions/hooks';
import { useCustomer } from '../hooks';
import { TransactionItem } from '../../pos/transactions/components';
import { Loader } from '@/components/ui/loader';
import {
  DataTable,
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
import { cn } from '@/lib/utils';

export default function CustomerPurchasesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const customerId = searchParams.get('id');

  const { customer } = useCustomer(customerId ? Number(customerId) : null);
  const { transactions, loading, error, currentPage, setCurrentPage, itemsPerPage } = useCustomerTransactions(customerId ? Number(customerId) : null);

  const [searchQuery, setSearchQuery] = useState('');

  const handleBack = () => {
    router.push('/customers');
  };

  // Redirect if no customer ID
  useEffect(() => {
    if (!customerId) {
      router.push('/customers');
    }
  }, [customerId, router]);

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, setCurrentPage]);

  if (!customerId) {
    return null;
  }

  // Filter transactions based on search query
  const filteredTransactions = transactions.filter((transaction) => {
    const query = searchQuery.toLowerCase();
    const reference = transaction.reference_no.toString().toLowerCase();
    const date = new Date(transaction.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).toLowerCase();
    return reference.includes(query) || date.includes(query);
  });

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

  // Table header - matches grid layout: [auto_1fr_1fr_1fr_1fr_1fr_1fr_auto]
  const TableHeader = () => (
    <div className="grid gap-4 text-xs font-medium uppercase tracking-wider
      border-b border-border bg-card px-4 py-3 text-center text-muted-foreground min-w-[800px]"
      style={{ gridTemplateColumns: 'auto 1fr 1fr 1fr 1fr 1fr 1fr auto' }}>
      <span className="w-6"></span>
      <span className="text-left">Reference</span>
      <span>Branch</span>
      <span>Cashier</span>
      <span>Status</span>
      <span>Total Amount</span>
      <span>Amount Paid</span>
      <span className="w-8"></span>
    </div>
  );

  // Render table body content based on state
  const renderTableBody = () => {
    // Loading state
    if (loading) {
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

    // No transactions or no filtered results
    if (filteredTransactions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <History className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold font-headline text-center">
            {searchQuery ? 'No matching purchases found' : 'No purchases yet'}
          </h3>
          <p className="text-muted-foreground text-center text-sm">
            {searchQuery ? 'Try adjusting your search terms.' : 'This customer has no transaction history.'}
          </p>
        </div>
      );
    }

    // Show transactions
    return (
      <Accordion type="single" collapsible className="w-full">
        {paginatedTransactions.map((transaction) => (
          <TransactionItem key={transaction.id} transaction={transaction} customerId={customerId} />
        ))}
      </Accordion>
    );
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-headline">Customer Purchases</h1>
          <p className="text-sm text-muted-foreground">
            View all purchases made by {customer ? `${customer.first_name}${customer.last_name ? ` ${customer.last_name}` : ''}` : 'this customer'}.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
          <CardDescription>All transactions for this customer</CardDescription>
          <div className="mt-4">
            <Input
              type="text"
              placeholder="Search by reference or date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable className="border-0 rounded-none">
            {/* Scrollable table container for mobile */}
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
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
        </CardContent>
      </Card>
    </div>
  );
}
