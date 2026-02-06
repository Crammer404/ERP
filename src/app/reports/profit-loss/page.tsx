'use client';

import { ReportsClient } from './reports-client';
import { Card, CardContent } from '@/components/ui/card';

export default function ReportsPage() {

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-headline text-primary">Profit & Loss Report</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Analyze your revenue, costs, and profits.
        </p>
      </div>
      <ReportsClient />
    </div>
  );
}
