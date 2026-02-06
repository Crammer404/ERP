'use client';

import { ClipboardList } from 'lucide-react';
import { OrdersClient } from './orders-client';

export default function OrdersPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <ClipboardList className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-headline">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground">
            Manage your purchase orders and view purchase history.
          </p>
        </div>
      </div>
      <OrdersClient />
    </div>
  );
}