'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/services/api';
import { authService } from '@/services';
import { tenantContextService } from '@/services/tenant/tenantContextService';
import type { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// No need for public routes here since we're not handling redirects

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Refs to prevent race conditions and duplicate requests
  const authCheckInProgress = useRef(false);
  const lastAuthCheck = useRef<number>(0);
  const authCheckTimeout = useRef<NodeJS.Timeout | null>(null);
  const loadingTimeout = useRef<NodeJS.Timeout | null>(null);

  // Debounced auth check to prevent multiple simultaneous calls
  const debouncedAuthCheck = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastCheck = now - lastAuthCheck.current;

    // If we checked auth recently (within 2 seconds), skip this check
    if (timeSinceLastCheck < 2000 && lastAuthCheck.current > 0) {
      return;
    }

    // If auth check is already in progress, wait for it to complete
    if (authCheckInProgress.current) {
      // Set a timeout to retry if the current check takes too long
      if (authCheckTimeout.current) {
        clearTimeout(authCheckTimeout.current);
      }
      authCheckTimeout.current = setTimeout(() => {
        if (!authCheckInProgress.current) {
          debouncedAuthCheck();
        }
      }, 3000);
      return;
    }

    authCheckInProgress.current = true;
    lastAuthCheck.current = now;

    // Set a maximum loading timeout to prevent infinite loading
    if (loadingTimeout.current) {
      clearTimeout(loadingTimeout.current);
    }
    loadingTimeout.current = setTimeout(() => {
      if (loading) {
        console.warn('Auth check timeout - setting loading to false');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    try {
      const isAuth = isAuthenticated();

      if (isAuth) {
        // Get fresh data to ensure we have the latest format
        const userData = await authService.refreshUserData();

        if (userData) {
          setUser(userData);
        } else {
          // Token exists but user data fetch failed - clear token
          await authService.logout();
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      // Don't immediately clear token on error - might be temporary
      // Only clear if it's a 401 unauthorized error
      if (error instanceof Error && error.message.includes('401')) {
        try {
          await authService.logout();
        } catch (logoutError) {
          console.error('Logout during auth check failed:', logoutError);
        }
      }
      setUser(null);
    } finally {
      authCheckInProgress.current = false;
      setLoading(false);

      // Clear timeouts
      if (authCheckTimeout.current) {
        clearTimeout(authCheckTimeout.current);
        authCheckTimeout.current = null;
      }
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
        loadingTimeout.current = null;
      }
    }
  }, [loading]);

  useEffect(() => {
    debouncedAuthCheck();

    // Cleanup timeouts on unmount
    return () => {
      if (authCheckTimeout.current) {
        clearTimeout(authCheckTimeout.current);
      }
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
      }
    };
  }, [debouncedAuthCheck]);

  const login = (userData: User) => {
    setUser(userData);
    router.push('/dashboard/');
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      // Use window.location.replace for hard redirect to clear all state and prevent back navigation
      // This ensures we go to /login and not the website homepage
      if (typeof window !== 'undefined') {
        // Clear any cached route data
        sessionStorage.removeItem('last_active_route');
        // Use replace instead of href to prevent back button issues
        window.location.replace('/login');
      }
    }
  };

  const value = { user, loading, login, logout };

  // CRITICAL FIX: Don't block rendering with a loader
  // Let RouteGuard handle the loading states for protected routes
  // Public routes should render immediately
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
