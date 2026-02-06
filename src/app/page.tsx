'use client'

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/components/providers/auth-provider';
import { Loader } from '@/components/ui/loader';

// Dynamic import for better performance
const HomePage = dynamic(() => import('./website/page/page'));

export default function MainPage() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  // Get the actual pathname immediately (for SSR/initial load, use window.location)
  // This is critical for SPA mode where pathname might be null initially on reload
  const getCurrentPath = () => {
    if (typeof window === 'undefined') return '/';
    // Use window.location.pathname as the source of truth for initial load
    const actualPath = window.location.pathname;
    // Normalize: remove trailing slash except for root
    const normalized = actualPath === '/' ? '/' : (actualPath.endsWith('/') ? actualPath.slice(0, -1) : actualPath);
    // If Next.js pathname is available and different, use it (for client-side navigation)
    return pathname || normalized;
  };
  
  const currentPath = getCurrentPath();
  
  // CRITICAL: If we're NOT on the root path, immediately return null
  // This allows Next.js router to render the correct page component (like /login, /onboarding)
  // We check window.location.pathname directly to avoid waiting for usePathname() to initialize
  if (typeof window !== 'undefined' && currentPath !== '/') {
    return null;
  }
  
  // Only handle root path '/' logic below
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (currentPath !== '/') return;
    
    // Check for auth token immediately
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const hasAuth = !!token;
    
    // If authenticated and on root path, redirect immediately
    if (hasAuth) {
      window.location.replace('/dashboard');
      setShouldRedirect(true);
      return;
    }
  }, [currentPath]);
  
  // Also check with auth provider once it loads
  useEffect(() => {
    if (currentPath !== '/') return; // Only check if on root path
    
    if (!loading && user) {
      window.location.replace('/dashboard');
      setShouldRedirect(true);
    }
  }, [user, loading, currentPath]);
  
  // Don't render anything if redirecting
  if (shouldRedirect || (loading && currentPath === '/') || (user && currentPath === '/')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="lg" />
      </div>
    );
  }
  
  // Only render homepage if we're on the root path
  // This component should ONLY render for '/'
  if (currentPath === '/') {
    return <HomePage />;
  }
  
  // Fallback: don't render anything
  return null;
}
