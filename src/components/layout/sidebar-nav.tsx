'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useSidebar } from '@/components/providers/sidebar-provider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAccessControl } from '@/components/providers/access-control-provider';
import {
  LayoutDashboard,
  Users,
  Building,
  Store,
  UserCog,
  PersonStanding,
  Warehouse,
  Package,
  History,
  ShoppingCart,
  ShoppingBag,
  BarChart2,
  Settings,
  Clock,
  Wallet,
  CalendarClock,
  CalendarCheck,
  CalendarDays,
  Percent,
  Settings2,
  SquareChartGantt,
  Landmark,
  FileText,
  Truck,
  User,
  Activity,
  ChevronRight,
  ChevronDown,
  Calculator,
  Receipt,
  Briefcase
} from 'lucide-react';

// Dynamic icon resolver - maps database icon_path to Lucide components
const getIconComponent = (iconPath: string) => {
  const iconMap: Record<string, any> = {
    'layout-dashboard': LayoutDashboard,
    'users': Users,
    'building': Building,
    'store': Store,
    'user-cog': UserCog,
    'person-standing': PersonStanding,
    'warehouse': Warehouse,
    'package': Package,
    'history': History,
    'shopping-cart': ShoppingCart,
    'shopping-bag': ShoppingBag,
    'bar-chart-2': BarChart2,
    'bar-chart-3': BarChart2, // Fallback for bar-chart-3
    'settings': Settings,
    'clock': Clock,
    'wallet': Wallet,
    'credit-card': Wallet, // Fallback for credit-card
    'calendar-clock': CalendarClock,
    'calendar-check': CalendarCheck,
    'calendar-days': CalendarDays,
    'percent': Percent,
    'settings-2': Settings2,
    'square-chart-gantt': SquareChartGantt,
    'landmark': Landmark,
    'file-text': FileText,
    'truck': Truck,
    'user': User,
    'activity': Activity,
    'calculator': Calculator,
    'receipt': Receipt,
    'briefcase': Briefcase,
  };
  
  return iconMap[iconPath] || Settings; // Default fallback
};

interface NavLink {
  href: string;
  label: string;
  icon: any;
  subLinks?: NavLink[];
}

// Normalize path by removing trailing slashes (except for root)
// This ensures consistent path comparison regardless of trailing slash differences
const normalizePath = (path: string): string => {
  if (path === '/' || path === '') return '/';
  return path.replace(/\/+$/, '') || '/';
};

// Check if a pathname matches a link href (handles exact matches and sub-path matches)
const isPathActive = (pathname: string, href: string): boolean => {
  const normalizedPathname = normalizePath(pathname);
  const normalizedHref = normalizePath(href);
  
  // Exact match
  if (normalizedPathname === normalizedHref) {
    return true;
  }
  
  // For sub-paths: check if pathname starts with href (e.g., /management/users/123 matches /management/users)
  // But ensure we don't match partial paths (e.g., /man shouldn't match /management)
  if (normalizedPathname.startsWith(normalizedHref + '/')) {
    return true;
  }
  
  return false;
};

// Function to build dynamic menu from user module groups (without permission filtering)
const buildDynamicMenu = (userModuleGroups: Record<string, any>): NavLink[] => {
  if (!userModuleGroups || typeof userModuleGroups !== 'object') {
    return [];
  }

  const menuItems: NavLink[] = [];

  // Sort groups by sort_order before processing
  const sortedGroups = Object.entries(userModuleGroups).sort(([, a], [, b]) => {
    return a.group.sort_order - b.group.sort_order;
  });

  // Process each group in sorted order
  for (const [groupId, groupData] of sortedGroups) {
    const { group, modules } = groupData;

    if (!modules || modules.length === 0) {
      continue; // Skip groups with no modules
    }

    // If only 1 module in group: display as single item (use module's icon/name)
    if (modules.length === 1) {
      const module = modules[0];
      const icon = getIconComponent(module.icon_path);
      const href = module.module_path;

      menuItems.push({
        href,
        label: module.menu_name,
        icon,
        // No subLinks - each module is a single route from the database
      } as NavLink);
    }
    // If 2+ modules in group: display as dropdown (use group's icon/name)
    else {
      const groupIcon = getIconComponent(group.icon_path);
      const subLinks: NavLink[] = modules.map((module: any) => {
        const icon = getIconComponent(module.icon_path);
        // Use the module path as-is (transactions are at /pos/transactions)
        const href = module.module_path;

        return {
          href,
          label: module.menu_name,
          icon,
          // No subLinks - each module is a single route from the database
        } as NavLink;
      });

      // Use the first module's href as the main group href (or create a default)
      const mainHref = modules[0]?.module_path || `/${group.display_name.toLowerCase()}`;

      menuItems.push({
        href: mainHref,
        label: group.display_name,
        icon: groupIcon,
        subLinks,
      } as NavLink);
    }
  }

  return menuItems;
};

const NavItem = ({ 
  link, 
  isActive, 
  isCollapsed, 
  onClick,
  isOpen,
  hasSubLinks
}: { 
  link: NavLink; 
  isActive: boolean; 
  isCollapsed: boolean;
  onClick?: () => void;
  isOpen?: boolean;
  hasSubLinks?: boolean;
}) => {
  const Icon = link.icon;
  const router = useRouter();
  
  const handleClick = () => {
    if (onClick) {
      // If onClick is provided (for dropdowns), use it
      onClick();
    } else {
      // If no onClick, navigate directly to the link
      router.push(link.href);
    }
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isActive ? 'default' : 'ghost'}
            size={isCollapsed ? 'icon' : 'default'}
            className={cn(
              !isCollapsed && 'w-full justify-start px-3'
            )}
            onClick={handleClick}
          >
            <Icon className={cn('h-4 w-4', !isCollapsed && 'mr-2')} />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">{link.label}</span>
                {hasSubLinks && (
                  <span className="ml-auto">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 opacity-70" />
                    ) : (
                      <ChevronRight className="h-4 w-4 opacity-70" />
                    )}
                  </span>
                )}
              </>
            )}
          </Button>
        </TooltipTrigger>
        {isCollapsed && (
          <TooltipContent side="right">
            <p>{link.label}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

export function SidebarNav() {
  const { isCollapsed } = useSidebar();
  const { user } = useAccessControl();
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | undefined>(undefined);
  
  // CRITICAL: Initialize currentPath immediately with window.location if available
  // This is the root cause - if currentPath is empty, highlighting won't work
  const getInitialPath = (): string => {
    if (typeof window !== 'undefined' && window.location) {
      return window.location.pathname;
    }
    return pathname || '';
  };
  
  const [currentPath, setCurrentPath] = useState<string>(getInitialPath);
  
  // Immediately sync on mount - this ensures currentPath is never empty
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initialPath = window.location.pathname;
      if (initialPath && initialPath !== currentPath) {
        console.log('SidebarNav - Initializing currentPath:', initialPath);
        setCurrentPath(initialPath);
      }
    }
  }, []); // Run only on mount

  // Sync current path with actual browser location
  // This is critical for static exports where Next.js router pathname might not update correctly
  // We use window.location.pathname as the source of truth since it always reflects the actual URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updatePath = () => {
      const newPath = window.location.pathname;
      setCurrentPath(prev => {
        // Only update if path actually changed to avoid unnecessary re-renders
        if (prev !== newPath) {
          console.log('SidebarNav - Path updated:', prev, '->', newPath);
          return newPath;
        }
        return prev;
      });
    };
    
    // Initialize on mount - use window.location as it's most reliable for static exports
    // Set immediately to avoid delay
    const initialPath = window.location.pathname;
    if (currentPath !== initialPath) {
      setCurrentPath(initialPath);
    }
    
    // Always use window.location.pathname as the source of truth
    // This ensures consistency between dev and production static exports
    // The pathname prop from Next.js router is useful, but window.location is more reliable
    
    // Listen for browser back/forward navigation
    window.addEventListener('popstate', updatePath);
    
    // Use a lightweight interval as a fallback to catch navigation in static exports
    // This is necessary because Next.js static export might not fire all expected events
    // We use a reasonable interval (500ms) to balance responsiveness and performance
    const checkInterval = setInterval(updatePath, 500);
    
    return () => {
      window.removeEventListener('popstate', updatePath);
      clearInterval(checkInterval);
    };
  }, [pathname]);

  // Build dynamic menu from user module groups (backend already filtered by permissions)
  const dynamicMenu = useMemo(() => {
    if (!user?.permissions) {
      return [];
    }
    
    const menu = buildDynamicMenu(user.permissions);
    return menu;
  }, [user?.permissions]);

  useEffect(() => {
    // Always log to diagnose - check if currentPath is empty
    console.log('SidebarNav - useEffect triggered:', {
      currentPath,
      pathname,
      windowPath: typeof window !== 'undefined' ? window.location.pathname : 'N/A',
      hasDynamicMenu: dynamicMenu.length > 0
    });
    
    if (!currentPath) {
      console.warn('SidebarNav - currentPath is empty! This is the root cause.');
      // Try to get path from window.location immediately
      if (typeof window !== 'undefined') {
        const windowPath = window.location.pathname;
        console.log('SidebarNav - Setting currentPath from window.location:', windowPath);
        setCurrentPath(windowPath);
      }
      return;
    }
    
    const activeParent = dynamicMenu.find(link => {
      // Check if current path matches the link or any of its sublinks
      const linkMatches = isPathActive(currentPath, link.href);
      const subLinkMatches = link.subLinks?.some(sub => isPathActive(currentPath, sub.href));
      
      // Special handling for transactions routes
      const posMatches = normalizePath(link.href) === '/pos' && currentPath.startsWith('/pos/transactions');
      const transactionsMatches = link.subLinks?.some(sub => normalizePath(sub.href) === '/pos/transactions') && currentPath.startsWith('/pos/transactions');
      
      // Also check if any sublink's path starts with the current path (for nested routes)
      const nestedMatches = link.subLinks?.some(sub => {
        const normalizedSub = normalizePath(sub.href);
        const normalizedCurrent = normalizePath(currentPath);
        return normalizedCurrent.startsWith(normalizedSub + '/') || normalizedCurrent === normalizedSub;
      });
      
      const isMatch = linkMatches || subLinkMatches || posMatches || transactionsMatches || nestedMatches;
      
      if (process.env.NODE_ENV === 'development' && isMatch) {
        console.log('SidebarNav - Active parent found:', link.label, link.href);
      }
      
      return isMatch;
    });

    if (activeParent) {
      setOpenMenu(activeParent.href);
    } else {
      // If no active parent found, close any open menus
      setOpenMenu(undefined);
    }
  }, [currentPath, dynamicMenu]);


  const handleToggle = (menuHref: string) => {
    setOpenMenu(prev => (prev === menuHref ? undefined : menuHref));
  };

    return (
    <ScrollArea className="flex-1">
      <nav className={cn(
        "flex flex-col gap-1 p-2",
        isCollapsed && "items-center"
      )}>
        {dynamicMenu.map((link) => {
          // Check if this link or any of its sublinks are active
          const linkIsActive = isPathActive(currentPath, link.href);
          const subLinkIsActive = link.subLinks?.some(subLink => isPathActive(currentPath, subLink.href));
          
          // Check for nested routes (e.g., /inventory/products/123 should highlight /inventory/products)
          const nestedMatch = link.subLinks?.some(sub => {
            const normalizedSub = normalizePath(sub.href);
            const normalizedCurrent = normalizePath(currentPath);
            return normalizedCurrent.startsWith(normalizedSub + '/') || normalizedCurrent === normalizedSub;
          });
          
          // Special handling for transactions routes
          const posMatch = normalizePath(link.href) === '/pos' && currentPath.startsWith('/pos/transactions');
          const transactionsMatch = link.subLinks?.some(sub => normalizePath(sub.href) === '/pos/transactions') && currentPath.startsWith('/pos/transactions');
          
          const isActive = Boolean(
            linkIsActive ||
            subLinkIsActive ||
            nestedMatch ||
            posMatch ||
            transactionsMatch
          );
          
          // Debug logging - always log to help diagnose the issue
          console.log(`SidebarNav - ${link.label}:`, {
            currentPath,
            linkHref: link.href,
            isActive,
            linkIsActive,
            subLinkIsActive,
            nestedMatch,
            hasSubLinks: !!link.subLinks,
            subLinks: link.subLinks?.map(s => s.href)
          });

          // Determine if dropdown is open - either manually toggled or auto-opened due to active sublink
          const isDropdownOpen = link.subLinks ? (openMenu === link.href || subLinkIsActive || nestedMatch) : false;

          return (
            <div key={link.href} className={cn(
              isCollapsed && "flex flex-col items-center w-full"
            )}>
          <NavItem
            link={link}
            isActive={isActive}
            isCollapsed={isCollapsed}
            onClick={link.subLinks ? () => handleToggle(link.href) : undefined}
            isOpen={isDropdownOpen}
            hasSubLinks={!!link.subLinks}
          />
          {link.subLinks && isDropdownOpen && (
            <div className={cn(
              "mt-1 space-y-1",
              isCollapsed ? "flex flex-col items-center gap-1 px-2" : "ml-4"
            )}>
              {link.subLinks.map((subLink) => (
                <div key={subLink.href} className={cn(
                  isCollapsed && "flex justify-center w-full"
                )}>
                  <NavItem
                    link={subLink}
                    isActive={isPathActive(currentPath, subLink.href)}
                    isCollapsed={isCollapsed}
                    hasSubLinks={false}
                    isOpen={false}
                  />
                </div>
              ))}
            </div>
          )}
            </div>
          );
        })}
      </nav>
    </ScrollArea>
  );
}