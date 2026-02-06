
'use client';

import { CartProvider } from './providers/cart-provider';
import { AccessControlProvider } from './providers/access-control-provider';
import { AuthProvider } from './providers/auth-provider';
import { ThemeColorProvider } from './providers/theme-color-provider';
import { AuthRoleSync } from './providers/auth-role-sync';
import { RouteGuard } from './guards/route-guard';
import { SidebarProvider } from './providers/sidebar-provider';
import { PermissionProvider } from '@/contexts/PermissionContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { Sidebar } from './layout/sidebar';
import { SiteHeader } from './layout/site-header';
import { Toaster } from './ui/toaster';
import { usePathname } from 'next/navigation';

// Define which routes are public and which are private
const publicRoutes = ['/login', '/signup'];

const AppContent = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isPublic = publicRoutes.includes(pathname);
  return (
    <>
      {children}
      <Toaster />
    </>
  );
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeColorProvider>
        <AuthProvider>
            <AccessControlProvider>
                <PermissionProvider>
                    <CurrencyProvider>
                        <SidebarProvider>
                            <AuthRoleSync />
                            <RouteGuard>
                              <AppContent>
                                <CartProvider>{children}</CartProvider>
                              </AppContent>
                            </RouteGuard>
                        </SidebarProvider>
                    </CurrencyProvider>
                </PermissionProvider>
            </AccessControlProvider>
        </AuthProvider>
    </ThemeColorProvider>
  );
}
