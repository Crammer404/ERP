'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hook to protect routes from unauthenticated access
 * Prevents flash of protected content before redirect
 */
export function useRouteProtection() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // Redirect immediately if not authenticated
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Return loading state and auth status
  return {
    loading,
    isAuthenticated: !!user,
    user,
    shouldRender: loading || !!user, // Only render if loading or authenticated
  };
}
