'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../providers/auth-provider';
import { Loader } from '@/components/ui/loader';

const publicRoutes = ['/', '/login', '/onboarding', '/about', '/features', '/pricing', '/contact'];
const authOnlyRedirectRoutes = ['/', '/login', '/onboarding'];

const normalizePath = (pathname: string | null | undefined): string => {
  if (!pathname) return '';
  return pathname === '/' ? '/' : pathname.replace(/\/$/, '');
};

const getResolvedPathname = (pathname: string | null): string => {
  const routerPath = normalizePath(pathname);
  if (typeof window === 'undefined') return routerPath;

  const browserPath = normalizePath(window.location.pathname);
  if (!routerPath) return browserPath;

  // On hard reload there are cases where router path is stale; trust browser URL.
  return routerPath === browserPath ? routerPath : browserPath;
};

const isPublicRoute = (pathname: string): boolean => {
  if (!pathname) return false;
  const normalizedPath = normalizePath(pathname) || '/';
  return publicRoutes.some(route => {
    const normalizedRoute = normalizePath(route) || '/';
    return normalizedPath === normalizedRoute;
  });
};

const shouldRedirectAuthUser = (pathname: string): boolean => {
  if (!pathname) return false;
  const normalizedPath = normalizePath(pathname) || '/';
  return authOnlyRedirectRoutes.some(route => {
    const normalizedRoute = normalizePath(route) || '/';
    return normalizedPath === normalizedRoute;
  });
};

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const redirectingRef = useRef(false);
  const lastRedirectRef = useRef<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const loaderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialAuthCheckDoneRef = useRef(false);
  const resolvedPathname = getResolvedPathname(pathname);

  const clearRedirectTimeout = () => {
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }
  };

  const startRedirect = (targetPath: string) => {
    if (lastRedirectRef.current === targetPath && redirectingRef.current) {
      return;
    }

    redirectingRef.current = true;
    lastRedirectRef.current = targetPath;
    setShowLoader(true);

    clearRedirectTimeout();
    // Safety: never keep loader forever if router navigation stalls.
    redirectTimeoutRef.current = setTimeout(() => {
      if (!redirectingRef.current) return;
      console.warn('RouteGuard: router.replace stalled, falling back to hard redirect', targetPath);
      window.location.replace(targetPath);
    }, 4000);

    router.replace(targetPath);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (resolvedPathname) {
      redirectingRef.current = false;
      lastRedirectRef.current = null;
      clearRedirectTimeout();
      setShowLoader(false);
    }
  }, [resolvedPathname]);

  useEffect(() => {
    if (!mounted || !resolvedPathname || loading) {
      return;
    }

    const isPublic = isPublicRoute(resolvedPathname);
    const shouldRedirect = shouldRedirectAuthUser(resolvedPathname);

    if (user && !isPublic && !shouldRedirect) {
      try {
        sessionStorage.setItem('last_active_route', resolvedPathname);
      } catch (error) {
        console.warn('Failed to save last active route:', error);
      }
    }
  }, [mounted, user, loading, resolvedPathname]);

  useEffect(() => {
    if (!mounted || !resolvedPathname) {
      setShowLoader(false);
      return;
    }

    const isPublic = isPublicRoute(resolvedPathname);
    const shouldRedirect = shouldRedirectAuthUser(resolvedPathname);

    if (loaderTimeoutRef.current) {
      clearTimeout(loaderTimeoutRef.current);
      loaderTimeoutRef.current = null;
    }

    if (loading) {
      if (!isPublic && !initialAuthCheckDoneRef.current) {
        setShowLoader(true);
        loaderTimeoutRef.current = setTimeout(() => {
          console.warn('RouteGuard: Auth check timeout - hiding loader');
          setShowLoader(false);
          initialAuthCheckDoneRef.current = true;
        }, 10000);
      } else {
        setShowLoader(false);
      }
      return;
    }

    if (!loading && !initialAuthCheckDoneRef.current) {
      initialAuthCheckDoneRef.current = true;
      if (loaderTimeoutRef.current) {
        clearTimeout(loaderTimeoutRef.current);
        loaderTimeoutRef.current = null;
      }
    }

    if (user && shouldRedirect) {
      let targetPath = '/dashboard/';
      
      try {
        const storedRoute = sessionStorage.getItem('last_active_route');
        if (storedRoute) {
          const normalizedStored = storedRoute.replace(/\/$/, '') || '/';
          if (!shouldRedirectAuthUser(normalizedStored)) {
            targetPath = normalizedStored.endsWith('/') ? normalizedStored : `${normalizedStored}/`;
          }
        }
      } catch (error) {
        console.warn('Failed to read last active route:', error);
      }

      startRedirect(targetPath);
    } 
    else if (!user && !isPublic) {
      const targetPath = '/login/';
      startRedirect(targetPath);
    } 
    else {
      setShowLoader(false);
    }

    return () => {
      if (loaderTimeoutRef.current) {
        clearTimeout(loaderTimeoutRef.current);
        loaderTimeoutRef.current = null;
      }
      clearRedirectTimeout();
    };
  }, [mounted, user, loading, resolvedPathname, router]);

  if (!mounted) {
    return <>{children}</>;
  }

  if (redirectingRef.current || (showLoader && !initialAuthCheckDoneRef.current)) {
    return (
      <Loader 
        overlay 
        size="lg"
      />
    );
  }

  return <>{children}</>;
}
