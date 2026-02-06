'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { LoginClient } from './login-client';

/* ---------------- Main Page ---------------- */
export default function AuthenticationPage() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();

  // If user is already authenticated, redirect (but don't block rendering)
  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  // Always render the login form - RouteGuard handles the protection
  // If user is authenticated, the redirect will happen via useEffect above
  return <LoginClient />;
}