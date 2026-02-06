'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Package } from 'lucide-react';

export default function StocksPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Package className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-headline">Stock Management</h1>
          <p className="text-sm text-muted-foreground">
            View and manage your inventory stock levels.
          </p>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Stock management functionality coming soon...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
