'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../providers/auth-provider';
import { Loader } from '@/components/ui/loader';

const publicRoutes = [
  '/',
  '/login',
  '/onboarding',
  '/about',
  '/features',
  '/pricing',
  '/contact',
];

const authRedirectRoutes = ['/', '/login', '/onboarding'];

const normalizePath = (pathname: string | null | undefined): string => {
  if (!pathname) return '/';
  return pathname === '/' ? '/' : pathname.replace(/\/$/, '');
};

const isPublicRoute = (pathname: string): boolean => {
  const normalized = normalizePath(pathname);
  return publicRoutes.some(route => normalizePath(route) === normalized);
};

const shouldRedirectAuthUser = (pathname: string): boolean => {
  const normalized = normalizePath(pathname);
  return authRedirectRoutes.some(route => normalizePath(route) === normalized);
};

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const resolvedPath = normalizePath(pathname);

  useEffect(() => {
    if (loading) return;

    const isPublic = isPublicRoute(resolvedPath);
    const shouldRedirect = shouldRedirectAuthUser(resolvedPath);

    // Not authenticated & trying to access private route
    if (!user && !isPublic) {
      router.replace('/login');
      return;
    }

    // Authenticated & trying to access login/onboarding
    if (user && shouldRedirect) {
      router.replace('/dashboard');
      return;
    }

  }, [user, loading, resolvedPath, router]);

  // 🔹 Show loader ONLY while auth is resolving
  if (loading) {
    return <Loader overlay size="lg" />;
  }

  return <>{children}</>;
}