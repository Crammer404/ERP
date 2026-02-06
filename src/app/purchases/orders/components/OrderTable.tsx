'use client';

import { useEffect, useState, useMemo, Fragment } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { EllipsisVertical, ChevronDown, ChevronRight, Check, X, Eye, ArrowLeft, RotateCcw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { purchaseService } from '../services/purchaseService';
import { useToast } from '@/hooks/use-toast';
import type { PurchaseOrder } from '../services/purchaseService';
import { tenantContextService } from '@/services/tenant/tenantContextService';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/contexts/CurrencyContext';

interface OrderTableProps {
  orders?: PurchaseOrder[];
  searchTerm: string;
  selectedSupplier?: string;
  loading?: boolean;
  onDelete?: (id: number) => Promise<void>;
  onEdit?: (item: PurchaseOrder) => void;
  statusFilter?: string | string[];
  isApproval?: boolean;
  onApprove?: (id: number) => Promise<void>;
  onReject?: (id: number) => Promise<void>;
  onStatusChange?: (id: number, status: string) => Promise<void>;
}

// Status badge helper function
const getStatusBadge = (status: string, onStatusChange?: (status: string) => void) => {
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500 hover:bg-green-600">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 hover:bg-red-600">Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
      case 'for review':
        return <Badge className="bg-blue-500 hover:bg-blue-600">For Review</Badge>;
      case 'for returned':
        return <Badge className="bg-orange-500 hover:bg-orange-600">For Returned</Badge>;
      case 'for recall':
        return <Badge className="bg-purple-500 hover:bg-purple-600">For Recall</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Do not make badge clickable for approved or rejected statuses
  if (status === 'approved' || status === 'rejected') {
    return getBadgeVariant(status);
  }

  if (!onStatusChange) {
    return getBadgeVariant(status);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="cursor-pointer flex items-center gap-1">
          {getBadgeVariant(status)}
          <ChevronDown className="w-4 h-4" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => onStatusChange('rejected')}>
          <X className="w-4 h-4 mr-2" />
          Reject
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onStatusChange('for review')}>
          <Eye className="w-4 h-4 mr-2" />
          For Review
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onStatusChange('approved')}>
          <Check className="w-4 h-4 mr-2" />
          Approved
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onStatusChange('for returned')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          For Returned
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onStatusChange('for recall')}>
          <RotateCcw className="w-4 h-4 mr-2" />
          For Recall
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface OrderItem extends PurchaseOrder {}

// 🧩 Expanded Row for Purchase Items
function PurchaseExpandedRow({ order, isApproval, defaultCurrency }: { order: PurchaseOrder; isApproval?: boolean; defaultCurrency: any }) {
  // Filter items to show active products for both approval and history tabs
  const displayItems = order.items?.filter(item => item.product.status === 'active') || [];

  return (
    <TableRow className="bg-muted">
      <TableCell colSpan={isApproval ? 9 : 8} className="p-0">
        <div className="px-6 py-4 border-l-2 border-primary/20 bg-muted/40 rounded-md space-y-4 text-sm text-foreground">
          <div className="bg-card border border-border rounded-lg p-4 shadow-sm space-y-3">
            <h4 className="font-semibold text-base text-primary flex items-center gap-2">
              Purchased Products
            </h4>
            {displayItems.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left">Name</TableHead>
                      <TableHead className="text-left">Branch</TableHead>
                      <TableHead className="text-left">Quantity</TableHead>
                      <TableHead className="text-left">Cost Price</TableHead>
                      <TableHead className="text-left">Discount</TableHead>
                      <TableHead className="text-left">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayItems.map((item, idx) => {
                      const costPrice = item.pricePerUnit || 0;
                      const quantity = item.quantity;
                      const discountAmount = item.discount || 0;
                      const subtotal = (quantity * costPrice) - discountAmount;

                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{item.product.name}</TableCell>
                          <TableCell>{order.branch?.name || 'N/A'}</TableCell>
                          <TableCell>{quantity}</TableCell>
                          <TableCell>{defaultCurrency?.symbol || '$'}{costPrice.toFixed(2)}</TableCell>
                          <TableCell>{costPrice > 0 ? ((discountAmount / (quantity * costPrice)) * 100).toFixed(2) + '%' : '0%'}</TableCell>
                          <TableCell>{defaultCurrency?.symbol || '$'}{subtotal.toFixed(2)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground">No active products available</p>
            )}
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function OrderTable({ orders = [], searchTerm, selectedSupplier, loading, onDelete, onEdit, statusFilter, isApproval, onApprove, onReject, onStatusChange }: OrderTableProps) {
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const { defaultCurrency } = useCurrency();

  // Filter data by search term, selected supplier, and status
  const filteredData = useMemo(() => {
    let data = orders;

    // Apply status filter if provided
    if (statusFilter) {
      if (Array.isArray(statusFilter)) {
        data = data.filter(o => statusFilter.includes(o.status));
      } else {
        data = data.filter(o => o.status === statusFilter);
      }
    }

    // Apply search and supplier filters
    return data.filter((item) => {
      const matchesSearch =
        item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.items?.some(i => i.product.name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesSupplier = !selectedSupplier || item.supplier === selectedSupplier;

      return matchesSearch && matchesSupplier;
    });
  }, [orders, searchTerm, selectedSupplier, statusFilter]);

  const getEmptyMessage = () => {
    if (statusFilter === 'completed') return 'No completed purchase orders found.';
    if (statusFilter === 'pending') return 'No pending orders for approval.';
    if (statusFilter === 'inactive') {
      if (!selectedSupplier) return 'Please select a supplier to view orders for approval.';
      return 'No inactive orders for approval.';
    }
    if (Array.isArray(statusFilter) && statusFilter.includes('approved')) {
      return 'No purchase history found.';
    }
    return 'No purchase orders found. Try adding a new order or select a supplier above to filter existing orders.';
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-2 border rounded-lg p-4">
        <div className="h-10 bg-muted rounded animate-pulse"></div>
        <div className="h-10 bg-muted rounded animate-pulse"></div>
        <div className="h-10 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  // For approval tab, require supplier selection
  if (statusFilter === 'inactive' && !selectedSupplier) {
    return (
      <div className="text-center text-muted-foreground border rounded-lg py-8">
        Please select a supplier to view orders for approval.
      </div>
    );
  }

  // Empty state
  if (filteredData.length === 0) {
    return (
      <div className="text-center text-muted-foreground border rounded-lg py-8">
        {searchTerm ? 'No results match your search.' : getEmptyMessage()}
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice No</TableHead>
            <TableHead>Products</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Paid Amount</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Change</TableHead>
            {isApproval && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((item, index) => {
            const isExpanded = expandedRowId === item.id;
            return (
              <Fragment key={item.id}>
                <TableRow
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setExpandedRowId(isExpanded ? null : item.id)}
                >
                  <TableCell>{item.invoice_no || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      {item.items?.filter(i => i.product.status === 'active').length ?? 0} products
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {getStatusBadge(
                      item.status,
                      onStatusChange ? (status) => onStatusChange(item.id, status) : undefined
                    )}
                  </TableCell>
                  <TableCell>{item.supplier}</TableCell>
                  <TableCell>{defaultCurrency?.symbol || '$'}{item.total.toFixed(2)}</TableCell>
                  <TableCell>{defaultCurrency?.symbol || '$'}{(item.paid_amount || 0).toFixed(2)}</TableCell>
                  <TableCell>{defaultCurrency?.symbol || '$'}{(item.due || 0).toFixed(2)}</TableCell>
                  <TableCell>{defaultCurrency?.symbol || '$'}{(item.change || 0).toFixed(2)}</TableCell>
                  {isApproval && (
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <EllipsisVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onApprove?.(item.id)}>
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => onReject?.(item.id)}
                          >
                            Reject
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
                {isExpanded && (
                  <PurchaseExpandedRow order={item} isApproval={isApproval} defaultCurrency={defaultCurrency} />
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}