'use client';

import { cn } from '@/lib/utils';
import { useSidebar } from '../providers/sidebar-provider';
import { SidebarNav } from './sidebar-nav';
import { useEffect, useState } from 'react';
import { useAuth } from '../providers/auth-provider';
import { getBrandName, getBrandColors } from '@/config/brand.config';
import { BrandLogo } from '../ui/brand-logo';

export function Sidebar() {
  const { isCollapsed, isMobile, isOpen, setIsOpen } = useSidebar();
  const [isMounted, setIsMounted] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !user) {
    return null;
  }
  if (isMobile && !isOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "flex h-full flex-col bg-background transition-all duration-300 ease-in-out",
          !isMobile && (isCollapsed ? "w-20" : "w-64"),
          isMobile && cn(
          "fixed left-0 top-0 z-50 w-64 h-full shadow-xl",
          "transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
          )
        )}
      >
        {/* Logo / header */}
        <div className="flex h-16 items-center justify-center px-6">
          <div className="flex items-center gap-3">
            <BrandLogo size="lg" />
            <span className={cn("text-xl font-bold", getBrandColors().primary, isCollapsed && !isMobile && "hidden")}>{getBrandName()}</span>
          </div>
        </div>

        {/* Sidebar links with scroll */}
        <div className="flex-1 overflow-y-auto">
          <SidebarNav />
        </div>
      </aside>
    </>
  )
}
