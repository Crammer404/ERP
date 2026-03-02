'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import {
  Users,
  Building2,
  UserCog,
  Landmark,
} from 'lucide-react';

const pageMeta = {
  '/management/users': {
    title: 'Users',
    description: 'Manage user accounts and employee profiles.',
    icon: Users,
  },
  '/management/branches': {
    title: 'Branches',
    description: 'Manage company branches and locations.',
    icon: Building2,
  },
  '/management/roles': {
    title: 'Roles',
    description: 'Manage and oversee employee roles and permissions.',
    icon: UserCog,
  },
  '/management/tenants': {
    title: 'Tenants',
    description: 'Manage tenants and their subscriptions.',
    icon: Landmark,
  },
} as const;

export default function ManagementLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const meta = (pageMeta as Record<string, { title: string; description: string; icon: any }>)[pathname] ?? {
    title: 'Management',
    description: 'Manage organization structure, branches, users, and roles.',
    icon: Users,
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

