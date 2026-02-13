'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';
import { 
  Clock, 
  Table, 
  User, 
  FileText, 
  Trash2, 
  CreditCard,
  RefreshCw,
  AlertCircle,
  X,
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import type { FloatingOrder } from '../services/floatingOrderService';
import { format } from 'date-fns';

type FloatingOrdersPanelProps = {
  floatingOrders: FloatingOrder[];
  loading: boolean;
  error: string | null;
  onSelectOrder: (order: FloatingOrder) => void;
  onBillOut: (orderId: number) => void;
  onCancel: (orderId: number) => void;
  onRefresh: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  loadingOrderId?: number | null; // Track which order is currently loading
};

export default function FloatingOrdersPanel({
  floatingOrders,
  loading,
  error,
  onSelectOrder,
  onBillOut,
  onCancel,
  onRefresh,
  isOpen,
  onOpenChange,
  loadingOrderId = null,
}: FloatingOrdersPanelProps) {
  const { defaultCurrency } = useCurrency();
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  const toggleExpand = (orderId: number) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      case 'in-progress':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
      case 'billed':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20';
    }
  };

    return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent hideClose side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <SheetTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <span>Orders</span>
            </SheetTitle>
            <SheetClose className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </SheetClose>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden">
        {loading && floatingOrders.length === 0 ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="p-4 flex flex-col items-center justify-center h-full text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        ) : floatingOrders.length === 0 ? (
          <div className="p-4 flex flex-col items-center justify-center h-full text-center">
            <Clock className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No held orders</p>
            <p className="text-xs text-muted-foreground mt-1">
              Orders you hold will appear here
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
                {(() => {
                  // Debug: Log all orders before filtering
                  console.log('FloatingOrdersPanel - All orders:', floatingOrders.map(o => ({
                    id: o.id,
                    reference_no: o.reference_no,
                    status: o.status,
                    total_quantity: o.total_quantity,
                    order_items_length: o.order_items?.length ?? 0,
                    order_items: o.order_items,
                    grand_total: o.grand_total,
                  })));
                  
                  const filteredOrders = floatingOrders.filter((order) => {
                    // Show both 'active' (in cart) and 'in-progress' (in panel) orders
                    const validStatus = order.status === 'active' || order.status === 'in-progress';
                    if (!validStatus) {
                      console.log(`Order ${order.id} filtered out: invalid status (${order.status})`);
                      return false;
                    }
                    
                    // For now, show all orders with valid status (items check might be too strict)
                    // Check if order has items (either from total_quantity or order_items array)
                    const totalQty = order.total_quantity ?? order.order_items?.reduce((sum, item) => sum + (item.quantity || 0), 0) ?? 0;
                    const hasItems = (order.order_items?.length ?? 0) > 0 || totalQty > 0;
                    
                    // Show order if it has valid status, even if items aren't loaded yet
                    // The backend should always return items, but if not, we'll still show the order
                    const shouldShow = validStatus; // Temporarily show all valid status orders
                    
                    if (!shouldShow) {
                      console.log(`Order ${order.id} filtered out: no items`, {
                        total_quantity: order.total_quantity,
                        order_items_length: order.order_items?.length ?? 0,
                        totalQty,
                        hasItems,
                      });
                    }
                    
                    return shouldShow;
                  });
                  
                  console.log('FloatingOrdersPanel - Filtered orders:', filteredOrders.length, 'out of', floatingOrders.length);
                  
                  if (filteredOrders.length === 0) {
                    return (
                      <div className="p-4 flex flex-col items-center justify-center h-full text-center">
                        <Clock className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">No orders match the filter</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Check console for debug information
                        </p>
                      </div>
                    );
                  }
                  
                  return filteredOrders.map((order) => {
                  // Debug logging
                  const totalQty = order.total_quantity ?? order.order_items?.reduce((sum, item) => sum + (item.quantity || 0), 0) ?? 0;
                  if (order.order_items && order.order_items.length > 0 && (!order.grand_total || order.grand_total === 0)) {
                    console.warn('Floating order has items but zero total:', {
                      orderId: order.id,
                      referenceNo: order.reference_no,
                      itemsCount: order.order_items.length,
                      totalQuantity: totalQty,
                      grandTotal: order.grand_total,
                      subTotal: order.sub_total,
                      orderItems: order.order_items,
                    });
                  }
                  
                  return (
                <Card
                  key={order.id}
                  className="border hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => toggleExpand(order.id)}
                >
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">
                            {order.reference_no}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${getStatusColor(order.status)}`}
                          >
                            {order.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {order.table_number && (
                            <div className="flex items-center gap-1">
                              <Table className="h-3 w-3" />
                              <span>Table {order.table_number}</span>
                            </div>
                          )}
                          {order.customer && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>
                                {order.customer.first_name} {order.customer.last_name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          {defaultCurrency?.symbol || '₱'}
                            {Number(order.grand_total ?? 0).toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {(() => {
                              const totalQty = order.total_quantity ?? order.order_items?.reduce((sum, item) => sum + (item.quantity || 0), 0) ?? 0;
                              return `${totalQty} ${totalQty === 1 ? 'item' : 'items'}`;
                            })()}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedOrderId === order.id && (
                      <div className="mt-3 pt-3 border-t space-y-3">
                        {/* Items Breakdown */}
                        {order.order_items && order.order_items.length > 0 ? (
                          <div className="space-y-2">
                            <div className="text-xs font-semibold text-foreground mb-2">Items:</div>
                            <div className="space-y-1 max-h-[200px] overflow-y-auto">
                              {order.order_items.map((item, idx) => {
                                // Get price from item or stock
                                const itemPrice = typeof (item as any).price === 'number' 
                                  ? (item as any).price 
                                  : parseFloat(String((item as any).price ?? item.stock?.price ?? item.stock?.selling_price ?? 0)) || 0;
                                const itemQuantity = typeof item.quantity === 'number' ? item.quantity : parseInt(String(item.quantity ?? 1), 10) || 1;
                                const subtotal = itemPrice * itemQuantity;
                                
                                // Calculate discounts - discounts are on the item
                                const discounts: any[] = (item as any).discounts || [];
                                let sumPercent = 0;
                                let sumFixed = 0;
                                
                                discounts.forEach((d: any) => {
                                  const discount = d.discount || d;
                                  if (discount) {
                                    // Check if it's a percentage discount (has value_in_percentage or classification indicates percentage)
                                    if (discount.value_in_percentage !== null && discount.value_in_percentage !== undefined) {
                                      sumPercent += parseFloat(discount.value_in_percentage || 0);
                                    } else if (discount.classification === 'percentage' || discount.type === 'percentage') {
                                      sumPercent += parseFloat(discount.value || 0);
                                    } 
                                    // Check if it's a fixed discount
                                    else if (discount.classification === 'fixed' || discount.type === 'fixed') {
                                      sumFixed += parseFloat(discount.value || 0);
                                    }
                                    // Fallback: if value_in_percentage is null/undefined and value exists, treat as fixed
                                    else if (discount.value !== null && discount.value !== undefined) {
                                      sumFixed += parseFloat(discount.value || 0);
                                    }
                                  }
                                });
                                
                                const itemDiscount = subtotal * (sumPercent / 100) + sumFixed;
                                const finalPrice = Math.max(0, subtotal - itemDiscount);

                                return (
                                  <div
                                    key={item.id || idx}
                                    className="grid grid-cols-12 gap-2 items-center py-1.5 px-2 bg-muted/30 rounded text-xs"
                                  >
                                    <div className="col-span-4 font-medium text-foreground truncate">
                                      {(() => {
                                        const productName = item.stock?.product?.name || 'Unknown Product';
                                        const variantName = (item.stock as any)?.variant_specification?.name || (item.stock as any)?.variant || null;
                                        return variantName ? `${productName} (${variantName})` : productName;
                                      })()}
                                    </div>
                                    <div className="col-span-2 text-center text-muted-foreground">
                                      {defaultCurrency?.symbol || '₱'}{itemPrice.toFixed(2)}
                                    </div>
                                    <div className="col-span-1 text-center text-muted-foreground">
                                      {itemQuantity}
                                    </div>
                                    <div className="col-span-2 text-center text-destructive text-[10px]">
                                      {sumFixed > 0 ? `${defaultCurrency?.symbol || '₱'}${sumFixed.toFixed(2)}` : '-'}
                                    </div>
                                    <div className="col-span-1 text-center text-destructive text-[10px]">
                                      {sumPercent > 0 ? `${sumPercent.toFixed(0)}%` : '-'}
                                    </div>
                                    <div className="col-span-2 text-center font-semibold text-foreground">
                                      {defaultCurrency?.symbol || '₱'}{Number(finalPrice).toFixed(2)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground text-center py-2">
                            No items yet. Load this order to add items.
                          </div>
                        )}
                        
                        {order.notes && (
                          <div className="flex items-start gap-2 text-xs">
                            <FileText className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">{order.notes}</span>
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          Created: {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectOrder(order);
                            }}
                            disabled={loadingOrderId === order.id}
                            className="flex-1 text-xs h-7"
                          >
                            {loadingOrderId === order.id ? (
                              <>
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                Loading...
                              </>
                            ) : (
                              'Load to Cart'
                            )}
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onBillOut(order.id);
                            }}
                            disabled={loadingOrderId === order.id}
                            className="flex-1 text-xs h-7"
                          >
                            {loadingOrderId === order.id ? (
                              <>
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                Loading...
                              </>
                            ) : (
                              <>
                                <CreditCard className="h-3 w-3 mr-1" />
                                Bill Out
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCancel(order.id);
                            }}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Collapsed Summary */}
                    {expandedOrderId !== order.id && (
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectOrder(order);
                          }}
                          disabled={loadingOrderId === order.id}
                          className="flex-1 text-xs h-7"
                        >
                          {loadingOrderId === order.id ? (
                            <>
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            'Load to Cart'
                          )}
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onBillOut(order.id);
                          }}
                          disabled={loadingOrderId === order.id}
                          className="flex-1 text-xs h-7"
                        >
                          {loadingOrderId === order.id ? (
                            <>
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-3 w-3 mr-1" />
                              Bill Out
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                  );
                });
                })()}
            </div>
          </ScrollArea>
        )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

