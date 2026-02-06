'use client';

import { SuppliersClient } from './suppliers-client';
import { Truck, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SuppliersPage() {
  console.log('Suppliers page loaded at /suppliers');
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Truck className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-2xl font-bold font-headline">Suppliers</h1>
          <p className="text-sm text-muted-foreground">
            Manage supplier information and contact details for your business.
          </p>
        </div>
      </div>
      <SuppliersClient />
    </div>
  );
}