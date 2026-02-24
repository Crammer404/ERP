'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/config/api.config';
import { 
  Calculator, 
  Settings, 
  FileText, 
  Receipt, 
  Briefcase 
} from 'lucide-react';

const pageMeta = {
  [ROUTES.HRMS.PAYROLL.GENERATE]: {
    title: 'Payroll Generation',
    description: 'Generate payroll records and review payroll output.',
    icon: Calculator,
  },
  [ROUTES.HRMS.PAYROLL.CONFIG]: {
    title: 'Payroll Configuration',
    description: 'Set up payroll rates, deductions, and compensation values.',
    icon: Settings,
  },
  [ROUTES.HRMS.PAYROLL.REPORTS]: {
    title: 'Payroll Reports',
    description: 'Analyze payroll summaries and generated report data.',
    icon: FileText,
  },
  [ROUTES.HRMS.PAYROLL.PAYSLIP]: {
    title: 'Payslip',
    description: 'Review employee payslips and payroll breakdown details.',
    icon: Receipt,
  },
  [ROUTES.HRMS.PAYROLL.POSITIONS]: {
    title: 'Payroll Positions',
    description: 'Manage employee positions, base salaries, and allowances.',
    icon: Briefcase,
  },
} as const;

export default function PayrollLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const meta = pageMeta[pathname as keyof typeof pageMeta] ?? {
    title: 'Payroll',
    description: 'Manage payroll operations and records.',
    icon: Calculator,
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
