'use client';

import { CurrenciesClient } from './currencies-client';
import { Landmark } from 'lucide-react';

export default function CurrenciesPage() {
  console.log('Currencies page loaded at /settings/currencies');
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Landmark className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-headline">Currencies</h1>
          <p className="text-sm text-muted-foreground">
            Manage currency configurations for your system.
          </p>
        </div>
      </div>
      <CurrenciesClient />
    </div>
  );
}