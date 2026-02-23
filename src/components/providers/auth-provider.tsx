'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/services/api';
import { authService } from '@/services';
import type { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number): Promise<T | null> => {
      const timeoutPromise = new Promise<null>(resolve => {
        setTimeout(() => resolve(null), timeoutMs);
      });
      return Promise.race([promise, timeoutPromise]);
    };

    const checkAuth = async () => {
      try {
        if (!isAuthenticated()) {
          if (!isMounted) return;
          setUser(null);
          setLoading(false);
          return;
        }

        const cachedUser = authService.getCachedUserData();
        if (cachedUser) {
          if (!isMounted) return;
          setUser(cachedUser);
          setLoading(false);
          authService.refreshUserData().then(freshUser => {
            if (!isMounted) return;
            if (freshUser) {
              setUser(freshUser);
            }
          }).catch(() => {});
          return;
        }

        const userData = await withTimeout(authService.refreshUserData(), 8000);
        if (!isMounted) return;

        if (userData) {
          setUser(userData);
        } else {
          authService.logout().catch(() => {});
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        if (!isMounted) return;
        setUser(null);
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    router.replace('/dashboard');
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      router.replace('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}