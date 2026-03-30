'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/config/api.config';
import { CalendarDays } from 'lucide-react';

const pageMeta = {
  [ROUTES.HRMS.HR.HOLIDAYS]: {
    title: 'Holidays',
    description: 'Manage Philippines holidays and payroll holiday classification.',
    icon: CalendarDays,
  },
} as const;

export default function HrLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const meta = pageMeta[pathname as keyof typeof pageMeta] ?? {
    title: 'HR',
    description: 'Manage HR operations and records.',
    icon: CalendarDays,
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

