
'use client';

import { WithAuthProtection } from '@/components/auth/with-auth-protection';
// import { useAccessControl } from '@/components/providers/access-control-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, ChevronDown, LayoutDashboard } from 'lucide-react';
import { DashboardBarChart } from '@/components/common/charts';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState, useMemo } from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';

type TimeRange = 'Today' | 'Week' | 'Monthly';

const dashboardData = {
    Today: {
        totalSales: { value: 1250.75, change: '+5.2%' },
        totalExpenses: { value: 430.50, change: '+2.1%' },
        netProfit: { value: 820.25, change: '+7.8%' },
        totalCustomers: { value: 82, change: '+12' },
    },
    Week: {
        totalSales: { value: 8750.40, change: '+15.1%' },
        totalExpenses: { value: 2990.80, change: '-1.5%' },
        netProfit: { value: 5759.60, change: '+22.4%' },
        totalCustomers: { value: 450, change: '+58' },
    },
    Monthly: {
        totalSales: { value: 45231.89, change: '+20.1%' },
        totalExpenses: { value: 19876.54, change: '-4.2%' },
        netProfit: { value: 25355.35, change: '+15%' },
        totalCustomers: { value: 2350, change: '+180' },
    },
};


function DashboardContent() {
  // const { hasAccess } = useAccessControl();
  const [timeRange, setTimeRange] = useState<TimeRange>('Monthly');
  const { defaultCurrency } = useCurrency();

  const data = useMemo(() => dashboardData[timeRange], [timeRange]);

  const chartData = useMemo(() => [
    { name: 'Sales', value: data.totalSales.value },
    { name: 'Expenses', value: data.totalExpenses.value },
    { name: 'Profit', value: data.netProfit.value },
  ], [data]);

  // Dashboard should be accessible to all authenticated users
  // Remove strict access control for dashboard as it's a basic page

  return (
    <div className="container mx-auto py-6 px-4">
       <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <LayoutDashboard className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold font-headline text-primary">Dashboard</h1>
                        <p className="text-sm text-muted-foreground">
                           An overview of your business performance.
                        </p>
                    </div>
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                        {timeRange}
                        <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                         <DropdownMenuRadioGroup value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
                            <DropdownMenuRadioItem value="Today">Today</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="Week">Week</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="Monthly">Monthly</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                  <span className="h-4 w-4 text-muted-foreground flex items-center justify-center text-sm font-bold">{defaultCurrency?.symbol || '₱'}</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{defaultCurrency?.symbol || '₱'}{data.totalSales.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <p className="text-xs text-muted-foreground">{data.totalSales.change} from last period</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                  <span className="h-4 w-4 text-muted-foreground flex items-center justify-center text-sm font-bold">{defaultCurrency?.symbol || '₱'}</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{defaultCurrency?.symbol || '₱'}{data.totalExpenses.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <p className="text-xs text-muted-foreground">{data.totalExpenses.change} from last period</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                  <span className="h-4 w-4 text-muted-foreground flex items-center justify-center text-sm font-bold">{defaultCurrency?.symbol || '₱'}</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{defaultCurrency?.symbol || '₱'}{data.netProfit.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <p className="text-xs text-muted-foreground">{data.netProfit.change} from last period</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">+{data.totalCustomers.value.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">{data.totalCustomers.change} from last period</p>
                </CardContent>
              </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="text-primary">Overview</CardTitle>
                    <CardDescription>A summary of key metrics for the selected time range.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <DashboardBarChart data={chartData} defaultCurrency={defaultCurrency} />
                </CardContent>
            </Card>
       </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <WithAuthProtection>
      <DashboardContent />
    </WithAuthProtection>
  );
}
