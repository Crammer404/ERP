'use client';

import { useRouteProtection } from '@/hooks/use-route-protection';
import { ReactNode } from 'react';

interface WithAuthProtectionProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Higher-order component to protect routes from unauthenticated access
 * Prevents flash of protected content before redirect
 */
export function WithAuthProtection({ children, fallback }: WithAuthProtectionProps) {
  const { loading, shouldRender } = useRouteProtection();

  // Don't render anything if not authenticated
  if (!shouldRender) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Render the protected content
  return <>{children}</>;
}

/**
 * HOC function to wrap components with auth protection
 */
export function withAuthProtection<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function AuthProtectedComponent(props: P) {
    return (
      <WithAuthProtection fallback={fallback}>
        <Component {...props} />
      </WithAuthProtection>
    );
  };
}
