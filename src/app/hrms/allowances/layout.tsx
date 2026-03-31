'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { DollarSign } from 'lucide-react';

const pageMeta = {
  '/hrms/allowances/cola': {
    title: 'COLA',
    description: 'Manage Cost of Living Allowance per employee.',
    icon: DollarSign,
  },
} as const;

export default function AllowancesLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const meta =
    (pageMeta as Record<string, { title: string; description: string; icon: any }>)[pathname] ?? {
      title: 'Allowances',
      description: 'Manage employee allowances.',
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

