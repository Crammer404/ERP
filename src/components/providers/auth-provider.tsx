'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/services/api';
import { authService } from '@/services';
import { AccountDisabledError } from '@/services/auth/authService';
import type { User } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createAccountStatusEcho, destroyEchoInstance } from '@/lib/echo';

const ACCOUNT_DISABLED_DEFAULT_MESSAGE =
  'Your session has been closed and your account has been disabled. Please contact your administrator if you need access.';

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
  const [disabledDialogMessage, setDisabledDialogMessage] = useState(ACCOUNT_DISABLED_DEFAULT_MESSAGE);
  const router = useRouter();
  const hasHandledDisabledRef = useRef(false);
  const hasHandledAuthInvalidRef = useRef(false);
  const echoInstanceRef = useRef<ReturnType<typeof createAccountStatusEcho>>(null);

  const disconnectEcho = useCallback(() => {
    if (echoInstanceRef.current) {
      destroyEchoInstance(echoInstanceRef.current);
      echoInstanceRef.current = null;
    }
  }, []);

  /** Must reset after logout / login so Echo can subscribe again (refs survive SPA navigation). */
  const resetAuthGuardRefs = useCallback(() => {
    hasHandledDisabledRef.current = false;
    hasHandledAuthInvalidRef.current = false;
  }, []);

  const showDisabledDialog = useCallback(async (message?: string) => {
    if (hasHandledDisabledRef.current) return;
    hasHandledDisabledRef.current = true;
    setDisabledDialogMessage(message || ACCOUNT_DISABLED_DEFAULT_MESSAGE);
    setDisabledDialogOpen(true);
  }, []);

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
  }, [showDisabledDialog]);

  useEffect(() => {
    type BroadcastPayload = { status?: string; message?: string; user_id?: number };

    if (!user?.id || !isAuthenticated() || hasHandledDisabledRef.current) {
      disconnectEcho();
      return;
    }

    const echo = createAccountStatusEcho();
    if (!echo) return;

    echoInstanceRef.current = echo;

    const channelName = `users.${user.id}.account-status`;
    const channel = echo.channel(channelName);
    channel.listen('.account.status.changed', async (payload: BroadcastPayload) => {
      if (payload?.status === 'disabled') {
        await showDisabledDialog(payload.message);
      }
    });

    if (process.env.NODE_ENV === 'development') {
      channel.subscribed(() => {
        console.info('[Pusher] Subscribed to', channelName, '— events appear here when Laravel broadcasts to this user id.');
      });
      channel.error((status: unknown) => {
        console.error('[Pusher] Channel error:', channelName, status);
      });
    }

    return () => {
      try {
        echo.leaveChannel(channelName);
      } catch {
        // ignore
      }
      destroyEchoInstance(echo);
      if (echoInstanceRef.current === echo) {
        echoInstanceRef.current = null;
      }
    };
  }, [user?.id, showDisabledDialog, disconnectEcho]);

  const login = (userData: User) => {
    resetAuthGuardRefs();
    setUser(userData);
    router.replace('/dashboard');
  };

  const logout = async () => {
    disconnectEcho();
    resetAuthGuardRefs();
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
    disconnectEcho();
    resetAuthGuardRefs();
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
            <DialogTitle>Session closed</DialogTitle>
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