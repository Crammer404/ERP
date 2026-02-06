'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowLeft, History, MoreVertical, Receipt } from 'lucide-react';
import { useSupplierPurchases } from '../hooks';
import { useSuppliers } from '../hooks';
import { Purchase } from '../services/purchaseService';

export default function SupplierPurchasesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supplierId = searchParams.get('id');

  const { purchases, loading, error } = useSupplierPurchases(supplierId ? Number(supplierId) : null);
  const { suppliers } = useSuppliers();

  const [searchQuery, setSearchQuery] = useState('');

  const supplier = suppliers.find(s => s.id === Number(supplierId));

  const handleBack = () => {
    router.push('/suppliers');
  };

  const handleViewReceipt = (purchase: Purchase) => {
    sessionStorage.setItem('viewPurchaseReceiptId', purchase.id.toString());
    sessionStorage.setItem('receiptSource', 'supplier-purchases');
    sessionStorage.setItem('supplierId', supplierId || '');
    router.push('/suppliers/purchases/receipt');
  };


  // Redirect if no supplier ID
  useEffect(() => {
    if (!supplierId) {
      router.push('/suppliers');
    }
  }, [supplierId, router]);

  if (!supplierId) {
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center py-20 col-span-full">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-muted-foreground font-medium">Loading Purchases...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card className="py-20 text-center">
          <CardContent>
            <p className="text-red-500">Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter purchases based on search query
  const filteredPurchases = purchases.filter((purchase) => {
    const query = searchQuery.toLowerCase();
    const invoice = purchase.invoice_no?.toString().toLowerCase() || '';
    const date = purchase.date ? new Date(purchase.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).toLowerCase() : '';
    const branch = purchase.branch?.name?.toLowerCase() || '';
    const status = purchase.status?.toLowerCase() || '';
    const creator = purchase.creator?.name?.toLowerCase() || '';
    return invoice.includes(query) || date.includes(query) || branch.includes(query) || status.includes(query) || creator.includes(query);
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'pending': 'secondary',
      'approved': 'default',
      'rejected': 'destructive',
      'for review': 'outline',
      'for returned': 'destructive',
      'for recall': 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-headline">Supplier Purchases</h1>
          <p className="text-sm text-muted-foreground">
            View all purchases from {supplier ? supplier.name : 'this supplier'}.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
          <CardDescription>All purchases from this supplier</CardDescription>
          <div className="mt-4">
            <Input
              type="text"
              placeholder="Search by invoice, date, branch, status, or creator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {filteredPurchases.length === 0 ? (
            <>
              <History className="mx-auto h-24 w-24 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold font-headline text-center">
                {searchQuery ? 'No matching purchases found' : 'No purchases yet'}
              </h3>
              <p className="text-muted-foreground text-center">
                {searchQuery ? 'Try adjusting your search terms.' : 'This supplier has no purchase history.'}
              </p>
            </>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice no.</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead className="text-right">Grand Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell>
                        <div>
                          <div className="font-semibold text-lg">{purchase.invoice_no || '—'}</div>
                          <div className="text-sm text-muted-foreground">
                            {purchase.date ? new Date(purchase.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            }) : '—'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{purchase.branch?.name || '—'}</TableCell>
                      <TableCell>{purchase.status ? getStatusBadge(purchase.status) : '—'}</TableCell>
                      <TableCell>{purchase.creator?.name || '—'}</TableCell>
                      <TableCell className="text-right font-medium">
                        ₱{(purchase.grand_total ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="center">
                            <DropdownMenuItem onClick={() => handleViewReceipt(purchase)}>
                              <Receipt className="h-4 w-4 mr-2" />
                              View Receipt
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}