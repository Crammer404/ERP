'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../providers/auth-provider';
import { Loader } from '@/components/ui/loader';

const publicRoutes = ['/', '/login', '/onboarding', '/about', '/features', '/pricing', '/contact'];
const authOnlyRedirectRoutes = ['/', '/login', '/onboarding'];

const isPublicRoute = (pathname: string): boolean => {
  if (!pathname) return false;
  const normalizedPath = pathname.replace(/\/$/, '') || '/';
  return publicRoutes.some(route => {
    const normalizedRoute = route.replace(/\/$/, '') || '/';
    return normalizedPath === normalizedRoute;
  });
};

const shouldRedirectAuthUser = (pathname: string): boolean => {
  if (!pathname) return false;
  const normalizedPath = pathname.replace(/\/$/, '') || '/';
  return authOnlyRedirectRoutes.some(route => {
    const normalizedRoute = route.replace(/\/$/, '') || '/';
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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (pathname) {
      redirectingRef.current = false;
      lastRedirectRef.current = null;
    }
  }, [pathname]);

  useEffect(() => {
    if (!mounted || !pathname || loading) {
      return;
    }

    const isPublic = isPublicRoute(pathname);
    const shouldRedirect = shouldRedirectAuthUser(pathname);

    if (user && !isPublic && !shouldRedirect) {
      try {
        sessionStorage.setItem('last_active_route', pathname);
      } catch (error) {
        console.warn('Failed to save last active route:', error);
      }
    }
  }, [mounted, user, loading, pathname]);

  useEffect(() => {
    if (!mounted || !pathname) {
      setShowLoader(false);
      return;
    }

    const isPublic = isPublicRoute(pathname);
    const shouldRedirect = shouldRedirectAuthUser(pathname);

    if (loading) {
      if (!isPublic) {
        setShowLoader(true);
      } else {
        setShowLoader(false);
      }
      return;
    }

    if (user && shouldRedirect) {
      setShowLoader(true);
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

      if (lastRedirectRef.current !== targetPath && !redirectingRef.current) {
        redirectingRef.current = true;
        lastRedirectRef.current = targetPath;
        router.replace(targetPath);
      }
    } 
    else if (!user && !isPublic) {
      setShowLoader(true);
      const targetPath = '/login/';
      if (lastRedirectRef.current !== targetPath && !redirectingRef.current) {
        redirectingRef.current = true;
        lastRedirectRef.current = targetPath;
        router.replace(targetPath);
      }
    } 
    else {
      setShowLoader(false);
    }
  }, [mounted, user, loading, pathname, router]);

  if (!mounted) {
    return <>{children}</>;
  }

  if (user && pathname && shouldRedirectAuthUser(pathname)) {
    return (
      <Loader 
        overlay 
        size="lg"
      />
    );
  }

  if (showLoader) {
    return (
      <Loader 
        overlay 
        size="lg"
      />
    );
  }

  return <>{children}</>;
}
