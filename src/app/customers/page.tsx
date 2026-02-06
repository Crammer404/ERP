'use client';

import { CustomersClient } from './customers-client';
import { User, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CustomersPage() {
  console.log('Customers page loaded at /customer');
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-8">
        <User className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-2xl font-bold font-headline">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Manage customer information and contact details for your business.
          </p>
        </div>
      </div>
      <CustomersClient />
    </div>
  );
}