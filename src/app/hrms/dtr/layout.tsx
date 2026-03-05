'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import {
  BadgeCheck,
  Clock,
  CalendarClock,
  CalendarRange,
  IdCard,
} from 'lucide-react';

const pageMeta = {
  '/hrms/dtr': {
    title: 'DTR',
    description: 'Manage daily time records and attendance.',
    icon: Clock,
  },
  '/hrms/dtr/attendance': {
    title: 'Attendance',
    description: 'Manage your attendance records.',
    icon: BadgeCheck,
  },
  '/hrms/dtr/time-clock': {
    title: 'Time Clock',
    description: 'Clock in and out to record your working hours.',
    icon: CalendarClock,
  },
  '/hrms/dtr/overtime': {
    title: 'Overtime',
    description: 'Review and manage overtime records.',
    icon: CalendarRange,
  },
  '/hrms/dtr/schedule': {
    title: 'Schedules',
    description: 'Configure and manage employee work schedules.',
    icon: CalendarRange,
  },
  '/hrms/dtr/employeeId': {
    title: 'Employee ID',
    description: 'Manage QR employee IDs and identification settings.',
    icon: IdCard,
  },
} as const;

export default function DtrLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const meta =
    pageMeta[pathname as keyof typeof pageMeta] ?? {
      title: 'DTR',
      description: 'Manage daily time records and attendance.',
      icon: Clock,
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

