'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import type { FloatingOrder } from '../services/floatingOrderService';

type FloatingOrderSelectorProps = {
  floatingOrders: FloatingOrder[];
  selectedOrderId: number | null;
  onSelectOrder: (orderId: number | null) => void;
  onCreateNew: () => void;
  loading?: boolean;
};

export default function FloatingOrderSelector({
  floatingOrders,
  selectedOrderId,
  onSelectOrder,
  onCreateNew,
  loading = false,
}: FloatingOrderSelectorProps) {
  const { defaultCurrency } = useCurrency();
  const selectedOrder = floatingOrders.find(o => o.id === selectedOrderId);

  return (
    <div className="flex items-center gap-2 p-3 bg-background/50 rounded-lg border">
      <div className="flex-1">
        {selectedOrderId ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {selectedOrder?.reference_no}
                {selectedOrder?.table_number && ` - Table ${selectedOrder.table_number}`}
              </span>
              <span className="text-xs text-muted-foreground">
                ({selectedOrder?.total_quantity ?? selectedOrder?.order_items?.reduce((sum, item) => sum + (item.quantity || 0), 0) ?? 0} items)
              </span>
              <span className="text-xs font-semibold text-primary">
                {defaultCurrency?.symbol || '₱'}{selectedOrder?.grand_total?.toFixed(2) || '0.00'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectOrder(null)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Select
            value={selectedOrderId?.toString() || ''}
            onValueChange={(value) => onSelectOrder(value ? parseInt(value) : null)}
            disabled={loading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select floating order or create new" />
            </SelectTrigger>
            <SelectContent>
              {floatingOrders.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                  No active floating orders
                </div>
              ) : (
                floatingOrders.map((order) => (
                  <SelectItem key={order.id} value={order.id.toString()}>
                    <div className="flex items-center justify-between w-full">
                      <span>
                        {order.reference_no}
                        {order.table_number && ` - Table ${order.table_number}`}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {defaultCurrency?.symbol || '₱'}{(order.grand_total ?? 0).toFixed(2)}
                      </span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onCreateNew}
        disabled={loading}
        className="flex items-center gap-1"
      >
        <Plus className="h-4 w-4" />
        New
      </Button>
    </div>
  );
}

