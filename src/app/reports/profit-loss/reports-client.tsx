'use client';

import { useState, useEffect, useMemo } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';
import type { Transaction } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, History, AlertTriangle, Scale } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { useCurrency } from '@/contexts/CurrencyContext';

const InfoCard = ({ icon: Icon, title, value, description, colorClass = 'text-primary' }: { icon: React.ElementType, title: string, value: string, description: string, colorClass?: string }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-muted-foreground ${colorClass}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

export function ReportsClient() {
  const { defaultCurrency } = useCurrency();
  const [isMounted, setIsMounted] = useState(false);
  const [transactions] = useLocalStorage<Transaction[]>('transactions', []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const report = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    
    transactions.forEach(transaction => {
        totalRevenue += transaction.total;
        transaction.items.forEach(item => {
            // If cost is not available for an item, it defaults to 0
            totalCost += (item.cost || 0) * item.quantity;
        });
    });

    const grossProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    
    return {
        totalRevenue,
        totalCost,
        grossProfit,
        profitMargin,
    }
  }, [transactions]);

  const hasMissingCostData = useMemo(() => {
    return transactions.some(t => t.items.some(i => i.cost === undefined || i.cost === 0))
  }, [transactions]);

  if (!isMounted) {
    return (
        <div className="text-center text-muted-foreground">
            <p>Loading report...</p>
        </div>
    );
  }

  if (transactions.length === 0) {
    return (
        <Card className="py-20 text-center">
            <CardContent>
                <History className="mx-auto h-24 w-24 text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold font-headline">No transaction data</h3>
                <p className="text-muted-foreground">
                    Complete a sale to generate a report.
                </p>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="space-y-6">
        {hasMissingCostData && (
             <Card className="border-amber-500/50 bg-amber-500/10">
                <CardHeader className="flex flex-row items-start gap-4">
                    <AlertTriangle className="h-8 w-8 text-amber-600 mt-1" />
                    <div>
                        <CardTitle className="text-amber-700">Incomplete Cost Data</CardTitle>
                        <CardDescription className="text-amber-600">
                            Some sold items are missing a cost value. The profit calculation may be inaccurate. Please update these products in the inventory.
                        </CardDescription>
                    </div>
                </CardHeader>
            </Card>
        )}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <InfoCard
                icon={DollarSign}
                title="Total Revenue"
                value={`${defaultCurrency?.symbol || '₱'}${report.totalRevenue.toFixed(2)}`}
                description="Total amount from all sales"
            />
             <InfoCard
                 icon={TrendingDown}
                 title="Total Costs (COGS)"
                 value={`${defaultCurrency?.symbol || '₱'}${report.totalCost.toFixed(2)}`}
                 description="Total cost of goods sold"
                 colorClass="text-destructive"
             />
             <InfoCard
                 icon={Scale}
                 title="Gross Profit"
                 value={`${defaultCurrency?.symbol || '₱'}${report.grossProfit.toFixed(2)}`}
                 description="Revenue minus cost of goods"
                 colorClass={report.grossProfit >= 0 ? 'text-green-600' : 'text-destructive'}
             />
             <InfoCard 
                icon={TrendingUp}
                title="Profit Margin"
                value={`${report.profitMargin.toFixed(2)}%`}
                description="The percentage of revenue that is profit"
                colorClass={report.profitMargin >= 0 ? 'text-green-600' : 'text-destructive'}
            />
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Transaction Breakdown</CardTitle>
                <CardDescription>Profit analysis for each individual transaction.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Revenue</TableHead>
                                <TableHead className="text-right">Cost</TableHead>
                                <TableHead className="text-right">Profit</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(transaction => {
                                const transactionCost = transaction.items.reduce((acc, item) => acc + (item.cost || 0) * item.quantity, 0);
                                const transactionProfit = transaction.total - transactionCost;
                                return (
                                <TableRow key={transaction.id}>
                                    <TableCell className="font-medium">#{transaction.id.substring(0,8)}</TableCell>
                                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">{defaultCurrency?.symbol || '₱'}{transaction.total.toFixed(2)}</TableCell>
                                    <TableCell className="text-right text-destructive">{defaultCurrency?.symbol || '₱'}{transactionCost.toFixed(2)}</TableCell>
                                    <TableCell className={`text-right font-semibold ${transactionProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>{defaultCurrency?.symbol || '₱'}{transactionProfit.toFixed(2)}</TableCell>
                                </TableRow>
                                )
                            })}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={2}>Totals</TableCell>
                                <TableCell className="text-right font-bold">{defaultCurrency?.symbol || '₱'}{report.totalRevenue.toFixed(2)}</TableCell>
                                <TableCell className="text-right font-bold text-destructive">{defaultCurrency?.symbol || '₱'}{report.totalCost.toFixed(2)}</TableCell>
                                <TableCell className={`text-right font-bold ${report.grossProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>{defaultCurrency?.symbol || '₱'}{report.grossProfit.toFixed(2)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
