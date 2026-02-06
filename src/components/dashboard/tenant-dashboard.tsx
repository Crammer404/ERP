'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Calendar, CreditCard, Users, Package, TrendingUp } from 'lucide-react';
import { tenantContextService, type TenantContextData } from '@/services/tenant/tenantContextService';
import { api } from '@/services/api';

interface DashboardStats {
  totalProducts: number;
  totalTransactions: number;
  totalRevenue: number;
  totalExpenses: number;
  recentTransactions: any[];
  lowStockProducts: any[];
}

export default function TenantDashboard() {
  const [tenantContext, setTenantContext] = useState<TenantContextData | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load tenant context
      const context = await tenantContextService.fetchTenantContext();
      setTenantContext(context);

      if (!context) {
        setError('Unable to load tenant context');
        return;
      }

      // Load dashboard stats
      const [statsResponse] = await Promise.all([
        api('/dashboard/stats'),
      ]);

      setStats(statsResponse);
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const getSubscriptionBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'trial':
        return 'secondary';
      case 'expired':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getTrialDaysRemaining = () => {
    if (!tenantContext?.subscription?.trial_ends_at) return null;
    
    const trialEnd = new Date(tenantContext.subscription.trial_ends_at);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={loadDashboardData}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!tenantContext) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">No tenant context available</p>
        </div>
      </div>
    );
  }

  const trialDaysRemaining = getTrialDaysRemaining();

  return (
    <div className="space-y-6">
      {/* Tenant Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome to {tenantContext.tenant.name}
          </h1>
          <p className="text-muted-foreground">
            {tenantContext.branch.name} • {tenantContext.tenant.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getSubscriptionBadgeVariant(tenantContext.subscription?.status || 'unknown')}>
            {tenantContext.subscription?.status?.toUpperCase() || 'NO PLAN'}
          </Badge>
          {trialDaysRemaining !== null && trialDaysRemaining > 0 && (
            <Badge variant="outline">
              {trialDaysRemaining} days left in trial
            </Badge>
          )}
        </div>
      </div>

      {/* Subscription Alert */}
      {tenantContext.subscription?.status === 'trial' && trialDaysRemaining !== null && trialDaysRemaining <= 7 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">
                  Trial expires in {trialDaysRemaining} days
                </p>
                <p className="text-sm text-orange-600">
                  Upgrade to continue using all features
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                Active inventory items
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTransactions}</div>
              <p className="text-xs text-muted-foreground">
                All-time sales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                All-time earnings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalExpenses)}</div>
              <p className="text-xs text-muted-foreground">
                Business expenses
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Latest sales from your store
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentTransactions?.length ? (
              <div className="space-y-4">
                {stats.recentTransactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">#{transaction.reference_no}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(transaction.grand_total)}</p>
                      <Badge variant="outline" className="text-xs">
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No recent transactions
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alert</CardTitle>
            <CardDescription>
              Products running low on inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.lowStockProducts?.length ? (
              <div className="space-y-4">
                {stats.lowStockProducts.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.category?.name || 'No category'}
                      </p>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      {product.total_stock} left
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                All products are well stocked
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tenant Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Tenant Details</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Name:</strong> {tenantContext.tenant.name}</p>
                {tenantContext.tenant.email && (
                  <p><strong>Email:</strong> {tenantContext.tenant.email}</p>
                )}
                {tenantContext.tenant.phone && (
                  <p><strong>Phone:</strong> {tenantContext.tenant.phone}</p>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Current Branch</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Name:</strong> {tenantContext.branch.name}</p>
                {tenantContext.branch.email && (
                  <p><strong>Email:</strong> {tenantContext.branch.email}</p>
                )}
                {tenantContext.branch.contact_no && (
                  <p><strong>Contact:</strong> {tenantContext.branch.contact_no}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
