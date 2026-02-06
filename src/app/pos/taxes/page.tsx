'use client';

import { TaxesClient } from './taxes-client';
import { SquareChartGantt, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TaxesPage() {
  console.log('Taxes page loaded at /pos/taxes');
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <SquareChartGantt className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-2xl font-bold font-headline">Taxes</h1>
            <p className="text-sm text-muted-foreground">
              Manage tax configurations for your system.
            </p>
          </div>
        </div>

        <Button onClick={() => document.dispatchEvent(new CustomEvent('open-add-tax-modal'))} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Tax
        </Button>
      </div>
      <TaxesClient />
    </div>
  );
}