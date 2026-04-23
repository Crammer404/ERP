'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, isAuthenticated } from '@/services/api';
import { authService } from '@/services';
import { AccountDisabledError } from '@/services/auth/authService';
import type { User } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { API_CONFIG, API_ENDPOINTS } from '@/config/api.config';

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
  const [disabledDialogOpen, setDisabledDialogOpen] = useState(false);
  const [disabledDialogMessage, setDisabledDialogMessage] = useState(
    'Your account has been temporarily disabled. Please contact the administrator.'
  );
  const router = useRouter();
  const hasHandledDisabledRef = useRef(false);
  const hasHandledAuthInvalidRef = useRef(false);

  const showDisabledDialog = async (message?: string) => {
    if (hasHandledDisabledRef.current) return;
    hasHandledDisabledRef.current = true;
    setDisabledDialogMessage(
      message || 'Your account has been temporarily disabled. Please contact the administrator.'
    );
    setDisabledDialogOpen(true);
  };

  useEffect(() => {
    let isMounted = true;
    const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number): Promise<T | null> => {
      const timeoutPromise = new Promise<null>(resolve => {
        setTimeout(() => resolve(null), timeoutMs);
      });
      return Promise.race([promise, timeoutPromise]);
    };

    const forceLogoutForInvalidAuth = async (message?: string) => {
      if (hasHandledAuthInvalidRef.current || hasHandledDisabledRef.current) return;
      hasHandledAuthInvalidRef.current = true;

      await authService.logout().catch(() => {});
      if (!isMounted) return;

      setUser(null);
      toast({
        title: 'Unauthenticated',
        description: message || 'Your session has expired. Please log in again.',
        variant: 'destructive',
      });
      router.replace('/login');
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
          }).catch(async (error) => {
            if (!isMounted) return;
            if (error instanceof AccountDisabledError) {
              await showDisabledDialog(error.message);
            }
          });
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
        if (error instanceof AccountDisabledError) {
          await showDisabledDialog(error.message);
          return;
        }
        setUser(null);
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    checkAuth();

    const handleAccountDisabled = async (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>;
      await showDisabledDialog(customEvent.detail?.message);
    };
    const handleAuthInvalid = async (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>;
      await forceLogoutForInvalidAuth(customEvent.detail?.message);
    };
    window.addEventListener('accountDisabled', handleAccountDisabled as EventListener);
    window.addEventListener('authInvalid', handleAuthInvalid as EventListener);

    return () => {
      isMounted = false;
      window.removeEventListener('accountDisabled', handleAccountDisabled as EventListener);
      window.removeEventListener('authInvalid', handleAuthInvalid as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!user || !isAuthenticated() || hasHandledDisabledRef.current) return;

    const token = getToken();
    if (!token) return;

    const safeParse = (raw: string | null) => {
      try {
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    };
    const tenantContext = safeParse(localStorage.getItem('tenant_context'));
    const branchContext = safeParse(localStorage.getItem('branch_context'));

    const controller = new AbortController();

    const connect = async () => {
      while (!controller.signal.aborted && !hasHandledDisabledRef.current) {
        try {
          const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.ACCOUNT_STATUS_STREAM}`, {
            method: 'GET',
            headers: {
              Accept: 'text/event-stream',
              Authorization: `Bearer ${token}`,
              ...(tenantContext?.id ? { 'X-Tenant-ID': String(tenantContext.id) } : {}),
              ...(branchContext?.id ? { 'X-Branch-ID': String(branchContext.id) } : {}),
            },
            cache: 'no-store',
            signal: controller.signal,
          });

          if (!response.ok || !response.body) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            continue;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (!controller.signal.aborted) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const chunks = buffer.split('\n\n');
            buffer = chunks.pop() ?? '';

            for (const chunk of chunks) {
              const lines = chunk.split('\n');
              let eventType = '';
              let dataPayload = '';

              for (const line of lines) {
                if (line.startsWith('event:')) {
                  eventType = line.slice(6).trim();
                } else if (line.startsWith('data:')) {
                  dataPayload += line.slice(5).trim();
                }
              }

              if (eventType !== 'account-status' || !dataPayload) continue;

              try {
                const payload = JSON.parse(dataPayload) as { status?: string; message?: string };
                if (payload.status === 'disabled') {
                  await showDisabledDialog(payload.message);
                }
              } catch {
                // Ignore malformed stream payloads.
              }
            }
          }
        } catch {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    };

    void connect();

    return () => {
      controller.abort();
    };
  }, [user]);

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

  const handleDisabledDialogAcknowledge = async () => {
    setDisabledDialogOpen(false);
    await authService.logout().catch(() => {});
    setUser(null);
    router.replace('/login');
  };

  return (
    <>
      <AuthContext.Provider value={{ user, loading, login, logout }}>
        {children}
      </AuthContext.Provider>
      <Dialog open={disabledDialogOpen} onOpenChange={() => {}}>
        <DialogContent className="[&>button]:hidden border-destructive" aria-describedby="account-disabled-description">
          <DialogHeader>
            <DialogTitle>Account Disabled</DialogTitle>
            <DialogDescription id="account-disabled-description">
              {disabledDialogMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={handleDisabledDialogAcknowledge}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}