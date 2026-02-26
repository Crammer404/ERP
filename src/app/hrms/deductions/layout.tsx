'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/config/api.config';
import { 
  DollarSign, 
  CreditCard 
} from 'lucide-react';

const pageMeta = {
  [ROUTES.HRMS.DEDUCTIONS.CASH_ADVANCE]: {
    title: 'Cash Advance',
    description: 'Track employee cash advances and manage outstanding balances.',
    icon: DollarSign,
  },
  [ROUTES.HRMS.DEDUCTIONS.LOAN]: {
    title: 'Loan Management',
    description: 'Manage employee loans, repayment schedules, and automatic payroll deductions.',
    icon: CreditCard,
  },
} as const;

export default function DeductionsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const meta = pageMeta[pathname as keyof typeof pageMeta] ?? {
    title: 'Deductions',
    description: 'Manage payroll deductions and employee advances.',
    icon: DollarSign,
  };

  const Icon = meta.icon;

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-headline">{meta.title}</h1>
          <p className="text-sm text-muted-foreground">{meta.description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
