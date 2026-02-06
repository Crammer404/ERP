'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/layout/sidebar';
import { SiteHeader } from '@/components/layout/site-header';
import { useSidebar } from '@/components/providers/sidebar-provider';
import { Toaster } from '@/components/ui/toaster';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isMobile, isOpen } = useSidebar();

  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.height = '100%';
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100%';
    
    return () => {
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
      document.body.style.overflow = '';
      document.body.style.height = '';
    };
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden fixed inset-0">
      <Sidebar />
      
      <div className={cn(
        "flex-1 flex flex-col overflow-hidden min-w-0",
        isMobile && "w-full"
      )}>
        <SiteHeader />
        
        <main className="flex-1 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
