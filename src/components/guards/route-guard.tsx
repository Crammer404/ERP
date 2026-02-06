'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../providers/auth-provider';
import { Loader } from '@/components/ui/loader';

const publicRoutes = ['/', '/login', '/onboarding'];
const marketingRoutePrefixes = [
  '/website',
  '/about',
  '/features',
  '/pricing',
  '/contact',
];

const authOnlyRedirectRoutes = ['/', '/login', '/onboarding'];

const isPublicRoute = (pathname: string): boolean => {
  const normalizedPath = pathname.replace(/\/$/, '') || '/';
  const matchesPublicRoute = publicRoutes.some(route => {
    const normalizedRoute = route.replace(/\/$/, '') || '/';
    return normalizedPath === normalizedRoute;
  });

  if (matchesPublicRoute) {
    return true;
  }
  return marketingRoutePrefixes.some(prefix => {
    const normalizedPrefix = prefix.replace(/\/$/, '') || '/';
    return (
      normalizedPath === normalizedPrefix ||
      normalizedPath.startsWith(`${normalizedPrefix}/`)
    );
  });
};

const shouldRedirectAuthUser = (pathname: string): boolean => {
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
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showLoader, setShowLoader] = useState(false);
  const [loadingTimeoutExpired, setLoadingTimeoutExpired] = useState(false);

  const getCurrentPathname = (): string | null => {
    if (pathname) return pathname;
    if (typeof window !== 'undefined') {
      const actualPath = window.location.pathname;
      return actualPath === '/' ? '/' : (actualPath.endsWith('/') ? actualPath.slice(0, -1) : actualPath);
    }
    return null;
  };

  const currentPathname = getCurrentPathname();

  const isPublic = currentPathname ? isPublicRoute(currentPathname) : null;

  useEffect(() => {
    const pathToSave = currentPathname || pathname;
    if (pathToSave && !isPublicRoute(pathToSave) && !shouldRedirectAuthUser(pathToSave)) {
      try {
        sessionStorage.setItem('last_active_route', pathToSave);
      } catch (error) {
        console.warn('Failed to save last active route:', error);
      }
    }
  }, [currentPathname, pathname]);

  useEffect(() => {
    redirectingRef.current = false;
    lastRedirectRef.current = null;
    setShowLoader(false);
    
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }
  }, [currentPathname, pathname]);

  useEffect(() => {
    const pathToCheck = currentPathname || pathname;
    if (!pathToCheck) {
      return;
    }

    if (loading || redirectingRef.current) {
      return;
    }

    const normalizedPathname = pathToCheck.replace(/\/$/, '') || '/';

    if (user && shouldRedirectAuthUser(pathToCheck)) {
      let lastRoute = '/dashboard';
      try {
        const storedRoute = sessionStorage.getItem('last_active_route');
        if (storedRoute) {
          lastRoute = storedRoute.replace(/\/$/, '') || '/';
          if (shouldRedirectAuthUser(lastRoute)) {
            lastRoute = '/dashboard';
          }
        }
      } catch (error) {
        console.warn('Failed to read last active route:', error);
      }

      if (normalizedPathname !== lastRoute && lastRedirectRef.current !== lastRoute) {
        redirectingRef.current = true;
        lastRedirectRef.current = lastRoute;
        setShowLoader(true);
        
        if (redirectTimeoutRef.current) {
          clearTimeout(redirectTimeoutRef.current);
        }
        redirectTimeoutRef.current = setTimeout(() => {
          console.warn('Redirect timeout - forcing navigation');
          redirectingRef.current = false;
          setShowLoader(false);
          if (typeof window !== 'undefined') {
            window.location.href = lastRoute;
          }
        }, 8000);
        
        router.replace(lastRoute);
        return;
      }
    } 
    else if (!user && isPublic === false) {
      if (normalizedPathname !== '/login' && lastRedirectRef.current !== '/login') {
        redirectingRef.current = true;
        lastRedirectRef.current = '/login';
        setShowLoader(true);
        
        if (redirectTimeoutRef.current) {
          clearTimeout(redirectTimeoutRef.current);
        }
        redirectTimeoutRef.current = setTimeout(() => {
          console.warn('Redirect timeout - forcing navigation to login');
          redirectingRef.current = false;
          setShowLoader(false);
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }, 8000);
        
        router.replace('/login');
        return;
      }
    }
    
    if (showLoader) {
      setShowLoader(false);
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    }
  }, [user, loading, currentPathname, pathname, router, isPublic, showLoader]);

  useEffect(() => {
    if (loading && (isPublic === false || isPublic === null)) {
      setLoadingTimeoutExpired(false);
      
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      loadingTimeoutRef.current = setTimeout(() => {
        console.warn('Auth loading timeout - allowing render');
        setLoadingTimeoutExpired(true);
      }, 10000);
    } else {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      setLoadingTimeoutExpired(false);
    }
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [loading, isPublic]);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  const pathToCheck = currentPathname || pathname;
  if (user && pathToCheck && shouldRedirectAuthUser(pathToCheck)) {
    if (showLoader || loading) {
      return (
        <Loader 
          overlay 
          size="lg"
        />
      );
    }
    return <>{children}</>;
  }

  if (isPublic === true && !user) {
    return <>{children}</>;
  }

  if (!currentPathname && !pathname) {
    return <>{children}</>;
  }

  if (isPublic === null) {
    if (loading) {
      if (loadingTimeoutExpired) {
        return <>{children}</>;
      }
      return (
        <Loader 
          overlay 
          size="lg"
        />
      );
    }
    return <>{children}</>;
  }

  if (loading && isPublic === false) {
    if (loadingTimeoutExpired) {
      return <>{children}</>;
    }
    
    return (
      <Loader 
        overlay 
        size="lg"
      />
    );
  }

  if (!user && isPublic === false) {
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

  return <>{children}</>;
}
