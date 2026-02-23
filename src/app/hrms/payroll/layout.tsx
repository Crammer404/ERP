'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/config/api.config';

const pageMeta = {
  [ROUTES.HRMS.PAYROLL.GENERATE]: {
    title: 'Payroll Generation',
    description: 'Generate payroll records and review payroll output.',
  },
  [ROUTES.HRMS.PAYROLL.CONFIG]: {
    title: 'Payroll Configuration',
    description: 'Set up payroll rates, deductions, and compensation values.',
  },
  [ROUTES.HRMS.PAYROLL.REPORTS]: {
    title: 'Payroll Reports',
    description: 'Analyze payroll summaries and generated report data.',
  },
  [ROUTES.HRMS.PAYROLL.PAYSLIP]: {
    title: 'Payslip',
    description: 'Review employee payslips and payroll breakdown details.',
  },
} as const;

export default function PayrollLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const meta = pageMeta[pathname as keyof typeof pageMeta] ?? {
    title: 'Payroll',
    description: 'Manage payroll operations and records.',
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-headline">{meta.title}</h1>
        <p className="text-sm text-muted-foreground">{meta.description}</p>
      </div>
      {children}
    </div>
  );
}
