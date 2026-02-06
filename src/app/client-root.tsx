'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Providers } from '@/components/providers';
import { AppLayout } from '@/components/layout/app-layout';

export function ClientRoot({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Get current pathname with fallback to window.location (critical for SPA reload)
  const getCurrentPathname = () => {
    if (pathname) return pathname;
    if (typeof window !== 'undefined') {
      const actualPath = window.location.pathname;
      return actualPath === '/' ? '/' : (actualPath.endsWith('/') ? actualPath.slice(0, -1) : actualPath);
    }
    return '/';
  };

  const currentPathname = getCurrentPathname();

  // CRITICAL: On reload, ensure Next.js router knows the correct pathname
  // This fixes the issue where reloading /login or /onboarding shows a black screen
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const actualPath = window.location.pathname;
    const normalizedPath = actualPath === '/' ? '/' : (actualPath.endsWith('/') ? actualPath.slice(0, -1) : actualPath);
    
    // If pathname is null or doesn't match the actual URL on initial load, 
    // the router needs to be informed of the current route
    // Only do this once on mount to avoid redirect loops
    if (!pathname && normalizedPath !== '/') {
      // Store the pathname so router can use it
      sessionStorage.setItem('__next_route_pathname', normalizedPath);
      
      // The router should automatically detect the pathname from the URL,
      // but if it doesn't, we'll let it initialize naturally
      // Don't force navigation as it might cause issues
    }
  }, []); // Only run once on mount

  const isAuthPage =
    currentPathname.startsWith('/login') ||
    currentPathname.startsWith('/register') ||
    currentPathname.startsWith('/forgot-password');

  const isErrorPage = currentPathname === '/404' || currentPathname === '/500' || currentPathname === '/403' || currentPathname.startsWith('/error-pages');
  const isWebsitePage = currentPathname.startsWith('/website') || currentPathname === '/' || currentPathname.startsWith('/about') || currentPathname.startsWith('/features') || currentPathname.startsWith('/pricing') || currentPathname.startsWith('/contact');

  // Don't use AppLayout for auth pages, error pages, or website pages
  const shouldUseAppLayout = !isAuthPage && !isErrorPage && !isWebsitePage;

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      disableTransitionOnChange
    >
      <Providers>
        {shouldUseAppLayout ? (
          // protected pages: use AppLayout
          <AppLayout>{children}</AppLayout>
        ) : (
          // auth, error, and website pages: no AppLayout
          children
        )}
      </Providers>
    </ThemeProvider>
  );
}
