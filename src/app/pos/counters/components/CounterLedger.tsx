'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  DataTable,
  DataTableHeader,
  DataTableHead,
  DataTableBody,
  DataTableFooter,
  StatusDot,
} from '@/components/ui/data-table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { PaginationInfo } from '@/components/ui/pagination-info';
import { fetchCashRegisterLedger, fetchSessionPaymentSummary, fetchExpectedBalances, fetchLedgerBreakdown, type LedgerEntry, type LedgerBreakdown } from '../service/cashRegisterService';
import type { CashRegister } from '../service/cashRegisterService';
import { useCurrency } from '@/contexts/CurrencyContext';
import { EmptyStates } from '@/components/ui/empty-state';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionBreakdownProps {
  sessionId?: number;
  opening: LedgerEntry;
  closing?: LedgerEntry;
  currencySymbol: string;
}

function SessionBreakdown({ sessionId, opening, closing, currencySymbol }: SessionBreakdownProps) {
  const [breakdown, setBreakdown] = useState<LedgerBreakdown | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionId) {
      setLoading(true);
      fetchLedgerBreakdown(sessionId)
        .then(res => res.data)
        .then(data => setBreakdown(data))
        .catch(() => setBreakdown(null))
        .finally(() => setLoading(false));
    }
  }, [sessionId]);

  const formatMoney = (amount: number) => {
    return `${currencySymbol} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDenomination = (denomination: any) => {
    if (!denomination || denomination.total === 0) {
      return <div className="text-xs text-muted-foreground">No denomination data</div>;
    }

    const items = [
      { label: '₱1,000', value: denomination.bill_1000, amount: denomination.bill_1000 * 1000 },
      { label: '₱500', value: denomination.bill_500, amount: denomination.bill_500 * 500 },
      { label: '₱200', value: denomination.bill_200, amount: denomination.bill_200 * 200 },
      { label: '₱100', value: denomination.bill_100, amount: denomination.bill_100 * 100 },
      { label: '₱50', value: denomination.bill_50, amount: denomination.bill_50 * 50 },
      { label: '₱20', value: denomination.bill_20, amount: denomination.bill_20 * 20 },
      { label: '₱20 Coin', value: denomination.coin_20, amount: denomination.coin_20 * 20 },
      { label: '₱10 Coin', value: denomination.coin_10, amount: denomination.coin_10 * 10 },
      { label: '₱5 Coin', value: denomination.coin_5, amount: denomination.coin_5 * 5 },
      { label: '₱1 Coin', value: denomination.coin_1, amount: denomination.coin_1 * 1 },
      { label: '₱0.25', value: denomination.coin_0_25, amount: denomination.coin_0_25 * 0.25 },
      { label: '₱0.10', value: denomination.coin_0_10, amount: denomination.coin_0_10 * 0.10 },
      { label: '₱0.05', value: denomination.coin_0_05, amount: denomination.coin_0_05 * 0.05 },
      { label: '₱0.01', value: denomination.coin_0_01, amount: denomination.coin_0_01 * 0.01 },
    ].filter(item => item.value > 0);

    if (items.length === 0) {
      return <div className="text-xs text-muted-foreground">No denomination data</div>;
    }

    return (
      <div className="space-y-1 text-xs">
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between">
            <span className="text-muted-foreground">{item.label}:</span>
            <span className="font-medium">{item.value} pcs = {formatMoney(item.amount)}</span>
          </div>
        ))}
        <div className="flex justify-between font-medium pt-1 border-t mt-1">
          <span>Total:</span>
          <span>{formatMoney(denomination.total)}</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading breakdown...</div>;
  }

  if (!breakdown) {
    return <div className="text-sm text-muted-foreground">Breakdown data not available</div>;
  }

  return (
    <div className="space-y-4">
      <div className="text-xs font-medium mb-3">Ledger Breakdown</div>
      
      <div className="grid grid-cols-2 gap-6 text-xs">
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="font-medium text-muted-foreground uppercase">Opening Balances</div>
            <div className="flex justify-between">
              <span>Opening Cash Balance:</span>
              <span className="font-medium">{formatMoney(breakdown.opening_balances.cash)}</span>
            </div>
            <div className="flex justify-between">
              <span>Opening Online Balance:</span>
              <span className="font-medium">{formatMoney(breakdown.opening_balances.online)}</span>
            </div>
          </div>

          {closing && (
            <>
              <div className="pt-2 border-t space-y-1">
                <div className="font-medium text-muted-foreground uppercase">Closing Balances</div>
                <div className="flex justify-between">
                  <span>Closing Cash Balance:</span>
                  <span className="font-medium">{formatMoney(breakdown.closing_balances.cash)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Closing Online Balance:</span>
                  <span className="font-medium">{formatMoney(breakdown.closing_balances.online)}</span>
                </div>
              </div>

              <div className="pt-2 border-t space-y-1">
                <div className="font-medium text-muted-foreground uppercase">Sales Summary</div>
                <div className="flex justify-between">
                  <span>Gross Sales:</span>
                  <span className="font-medium">{formatMoney(breakdown.gross_sales)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cost of Goods Sold (COGS):</span>
                  <span className="font-medium">{formatMoney(breakdown.cogs)}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t">
                  <span>Net Profit:</span>
                  <span className={breakdown.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatMoney(breakdown.net_profit)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {closing && (
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="font-medium text-muted-foreground uppercase">Cash Denomination - Opening</div>
              {formatDenomination(breakdown.cash_denomination.opening)}
            </div>

            <div className="pt-2 border-t space-y-1">
              <div className="font-medium text-muted-foreground uppercase">Cash Denomination - Closing</div>
              {formatDenomination(breakdown.cash_denomination.closing)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface CounterLedgerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  cashRegister: CashRegister;
}

export function CounterLedger({
  isOpen,
  onOpenChange,
  cashRegister,
}: CounterLedgerProps) {
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { defaultCurrency } = useCurrency();
  const currencySymbol = defaultCurrency?.symbol ?? '₱';

  useEffect(() => {
    if (isOpen && cashRegister.id) {
      loadLedger();
    }
  }, [isOpen, cashRegister.id]);

  const loadLedger = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchCashRegisterLedger(cashRegister.id);
      setLedgerEntries(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load ledger.');
      setLedgerEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatMoney = (amount: number) => {
    return `${currencySymbol} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const groupedSessions = useMemo(() => {
    const grouped: Array<{ sessionId?: number; opening: LedgerEntry; closing?: LedgerEntry }> = [];
    let currentOpening: LedgerEntry | null = null;

    ledgerEntries.forEach((entry) => {
      if (entry.type === 'opening') {
        if (currentOpening) {
          const sessionId = (currentOpening as LedgerEntry).session_id;
          grouped.push({ sessionId: sessionId || undefined, opening: currentOpening });
        }
        currentOpening = entry;
      } else if (entry.type === 'closing') {
        const sessionId = entry.session_id;
        grouped.push({ 
          sessionId: sessionId || undefined, 
          opening: currentOpening || entry, 
          closing: entry 
        });
        currentOpening = null;
      }
    });

    if (currentOpening !== null) {
      const sessionId = (currentOpening as LedgerEntry).session_id;
      grouped.push({ sessionId: sessionId || undefined, opening: currentOpening });
    }

    return grouped;
  }, [ledgerEntries]);

  const totalPages = Math.ceil(groupedSessions.length / itemsPerPage);
  const paginatedSessions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return groupedSessions.slice(start, end);
  }, [groupedSessions, currentPage, itemsPerPage]);

  const paginationFrom = groupedSessions.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const paginationTo = Math.min(currentPage * itemsPerPage, groupedSessions.length);

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[1600px] max-h-[90vh] flex flex-col p-0"
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-xl font-semibold">Cash Register Ledger for {cashRegister.name}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          {loading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          )}

          {!loading && error && (
            <EmptyStates.Generic
              title="Failed to load ledger"
              description={error}
            />
          )}

          {!loading && !error && (
            <DataTable>
              <DataTableHeader columns={6}>
                <DataTableHead align="left">Date & Time</DataTableHead>
                <DataTableHead align="left">Cashier</DataTableHead>
                <DataTableHead>Status</DataTableHead>
                <DataTableHead align="right">Balance</DataTableHead>
                <DataTableHead align="right">Transactions</DataTableHead>
                <DataTableHead align="right">Variance / Status</DataTableHead>
              </DataTableHeader>

              <DataTableBody>
                {groupedSessions.length === 0 ? (
                  <div className="py-8">
                    <EmptyStates.Generic
                      title="No ledger entries found"
                      description="This cash register has no session history yet."
                    />
                  </div>
                ) : (
                  <Accordion type="single" collapsible className="w-full">
                    {paginatedSessions.map((session, index) => (
                      <AccordionItem
                        key={index}
                        value={`session-${index}`}
                        className="border border-border/60 rounded-md bg-card my-2 first:mt-0 last:mb-0 data-[state=open]:bg-muted/40 transition-all duration-200"
                      >
                        <AccordionTrigger className="hover:no-underline cursor-pointer px-4 py-3 rounded-md transition-colors duration-150 hover:bg-muted/40 [&>svg]:hidden">
                          <div className="grid grid-cols-6 gap-4 w-full text-sm font-normal text-left items-center">
                            <div className="flex items-center gap-2">
                              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="flex flex-col gap-1">
                                <span className="text-foreground">
                                  {formatDateTime(session.opening.at)}
                                </span>
                                {session.closing && (
                                  <span className="text-foreground">
                                    {formatDateTime(session.closing.at)}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center">
                              <div className="flex flex-col gap-1">
                                <span className="text-foreground">
                                  {session.opening.user?.name || 'N/A'}
                                </span>
                                {session.closing && session.closing.user && (
                                  <span className="text-foreground">
                                    {session.closing.user.name}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center">
                              <div className="flex flex-col gap-1 items-start">
                                <StatusDot status={session.closing ? 'success' : 'success'} label="OPEN" />
                                {session.closing && (
                                  <StatusDot status="default" label="CLOSED" />
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-end">
                              <div className="flex flex-col text-right gap-1">
                                <span className="text-foreground">
                                  {formatMoney(Number(session.opening.amount) || 0)}
                                </span>
                                {session.closing && (
                                  <span className="text-foreground">
                                    {formatMoney(Number(session.closing.counted_amount) || 0)}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-end">
                              <div className="flex flex-col gap-1">
                                {!session.closing && (
                                  <span className="text-muted-foreground">-</span>
                                )}
                                {session.closing && (
                                  <span className="text-foreground text-right">
                                    {session.closing.transaction_count ?? 0}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-end">
                              <div className="flex flex-col gap-1">
                                {!session.closing && (
                                  <span className="text-muted-foreground">-</span>
                                )}
                                {session.closing && (
                                  <span className={cn(
                                    "text-right font-medium",
                                    session.closing.case === 'SALE' ? 'text-green-600' :
                                    session.closing.case === 'NO_SALE' ? 'text-muted-foreground' :
                                    session.closing.case === 'SHORTED' ? 'text-red-600' :
                                    'text-foreground'
                                  )}>
                                    {(() => {
                                      const variance = session.closing.variance !== null && session.closing.variance !== undefined
                                        ? formatMoney(Math.abs(session.closing.variance))
                                        : null;
                                      const caseValue = session.closing.case;
                                      
                                      if (variance !== null && caseValue) {
                                        return `${variance} - ${caseValue}`;
                                      } else if (variance !== null) {
                                        return variance;
                                      } else if (caseValue) {
                                        return caseValue;
                                      }
                                      return '-';
                                    })()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 py-4 border-t border-border/40 bg-muted/20 font-mono">
                          <SessionBreakdown
                            sessionId={session.sessionId}
                            opening={session.opening}
                            closing={session.closing}
                            currencySymbol={currencySymbol}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </DataTableBody>

              {!loading && !error && groupedSessions.length > 0 && totalPages > 1 && (
                <DataTableFooter>
                  <PaginationInfo
                    from={paginationFrom}
                    to={paginationTo}
                    total={groupedSessions.length}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={() => {}}
                    textSize="xs"
                    compact={true}
                    showItemsPerPage={false}
                    className="min-w-0"
                  />
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(Math.max(1, currentPage - 1));
                          }}
                          className={cn(
                            "text-xs h-7 px-2",
                            currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                          )}
                        />
                      </PaginationItem>
                      
                      {(() => {
                        const pages: (number | 'ellipsis')[] = [];
                        const maxPageNumbers = 2;
                        
                        if (totalPages <= maxPageNumbers) {
                          for (let i = 1; i <= totalPages; i++) {
                            pages.push(i);
                          }
                        } else {
                          if (currentPage === 1) {
                            pages.push(1);
                            if (totalPages > 2) {
                              pages.push('ellipsis');
                            }
                            pages.push(totalPages);
                          } else if (currentPage === totalPages) {
                            pages.push(1);
                            if (totalPages > 2) {
                              pages.push('ellipsis');
                            }
                            pages.push(totalPages);
                          } else {
                            pages.push(1);
                            if (currentPage > 2) {
                              pages.push('ellipsis');
                            }
                            pages.push(currentPage);
                            if (currentPage < totalPages - 1) {
                              pages.push('ellipsis');
                            }
                            pages.push(totalPages);
                          }
                        }
                        
                        return pages.map((page, idx) => {
                          if (page === 'ellipsis') {
                            return (
                              <PaginationItem key={`ellipsis-${idx}`}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentPage(page);
                                }}
                                isActive={currentPage === page}
                                className="cursor-pointer text-xs h-7 px-2"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        });
                      })()}
                      
                      <PaginationItem>
                        <PaginationNext
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(Math.min(totalPages, currentPage + 1));
                          }}
                          className={cn(
                            "text-xs h-7 px-2",
                            currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                          )}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </DataTableFooter>
              )}
            </DataTable>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t">
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
