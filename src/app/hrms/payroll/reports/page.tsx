
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileBarChart } from 'lucide-react';

export default function PayrollReportsPage() {

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-8">
        <FileBarChart className="h-10 w-10 text-primary" />
        <div>
            <h1 className="text-4xl font-bold font-headline text-primary">Payroll Reports</h1>
            <p className="text-lg text-muted-foreground mt-1">
              Analyze and view payroll-related reports.
            </p>
        </div>
      </div>
       <Card>
        <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>This feature is under construction.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">The payroll reports interface will be available here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
