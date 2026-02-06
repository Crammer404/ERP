'use client';

import { ExpensesClient } from './expenses-client';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ExpensesPage() {
  console.log('Expenses page loaded at /expenses');
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-8">
        <FileText className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-2xl font-bold font-headline">Expenses</h1>
          <p className="text-sm text-muted-foreground">
            Manage expense records and attachments for your business.
          </p>
        </div>
      </div>
      <ExpensesClient />
    </div>
  );
}