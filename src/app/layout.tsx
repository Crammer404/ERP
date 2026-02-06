import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { ClientRoot } from './client-root';
import { BRANDING_CONFIG } from './website/config/brand.config';

export const metadata: Metadata = {
  title: BRANDING_CONFIG.name,
  description: BRANDING_CONFIG.tagline,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Immediate auth check script - runs before React hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Public routes that don't require auth
                const publicRoutes = ['/', '/login', '/signup', '/onboarding'];
                const marketingRoutes = ['/website', '/about', '/features', '/pricing', '/contact'];
                
                // Get current path and normalize it
                const path = window.location.pathname;
                // Normalize: remove trailing slash except for root
                const normalizedPath = path === '/' ? '/' : (path.endsWith('/') ? path.slice(0, -1) : path) || '/';
                
                // CRITICAL: For Next.js App Router in static export mode, we need to ensure
                // the router initializes with the correct pathname on reload
                // Set up Next.js router data structure before React hydrates
                if (typeof window !== 'undefined') {
                  // Initialize __NEXT_DATA__ if it doesn't exist
                  if (!window.__NEXT_DATA__) {
                    window.__NEXT_DATA__ = {
                      page: normalizedPath,
                      query: {},
                      buildId: 'static',
                      isFallback: false,
                      gssp: false,
                      customServer: false,
                      appGip: true,
                      routeLoaderData: {}
                    };
                  } else {
                    // Update the page path
                    window.__NEXT_DATA__.page = normalizedPath;
                  }
                  
                  // Store initial pathname for router
                  sessionStorage.setItem('__next_initial_pathname', normalizedPath);
                  
                  // Set history state to help router detect the pathname
                  if (window.history.state === null || !window.history.state.as) {
                    window.history.replaceState(
                      { ...window.history.state, as: normalizedPath, url: normalizedPath },
                      '',
                      normalizedPath
                    );
                  }
                }
                
                // Check if current path is a public route
                const isPublicRoute = publicRoutes.includes(normalizedPath) || 
                  marketingRoutes.some(prefix => {
                    return normalizedPath === prefix || normalizedPath.startsWith(prefix + '/');
                  });
                
                // Check for auth token
                const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
                const hasAuth = !!token;
                
                // If user is authenticated and on root path '/', redirect to dashboard
                if (hasAuth && normalizedPath === '/') {
                  window.location.replace('/dashboard');
                  return;
                }
                
                // If user is authenticated and on other public routes (except onboarding and login/signup), redirect to dashboard
                if (hasAuth && isPublicRoute && normalizedPath !== '/onboarding' && normalizedPath !== '/login' && normalizedPath !== '/signup') {
                  window.location.replace('/dashboard');
                  return;
                }
                
                // If user is NOT authenticated and on a protected route, redirect to login
                // IMPORTANT: Root path '/' is a public route, so unauthenticated users should see it
                if (!hasAuth && !isPublicRoute) {
                  window.location.replace('/login');
                  return;
                }
                
                // If user is NOT authenticated and on root '/' or other public routes (like /login, /onboarding)
                // DO NOT redirect - let Next.js router handle the routing to the correct page
                // The router will read window.location.pathname and render the appropriate page component
              })();
            `,
          }}
        />
      </head>
      <body className={cn('min-h-screen bg-background font-sans antialiased')}>
        {/* 👇 delegate client-side logic */}
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  );
}
