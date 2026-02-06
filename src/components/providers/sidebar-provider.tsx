'use client';

import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useMemo,
  useEffect,
} from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  isMobile: boolean;
  isOpen: boolean;
  toggleSidebar: () => void;
  setIsCollapsed: (value: boolean) => void;
  setIsOpen: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Initialize with proper check to avoid layout shift
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return false;
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsOpen(prev => !prev);
    } else {
      setIsCollapsed(prev => !prev);
    }
  };

  // Handle mobile detection and responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const isMobileScreen = window.innerWidth <= 768;
      setIsMobile(isMobileScreen);
      
      if (isMobileScreen) {
        // On mobile: close overlay and reset collapsed state
        setIsOpen(false);
        setIsCollapsed(false);
      } else {
        // On desktop: close mobile overlay and use collapsed state
        setIsOpen(false);
      }
    };

    // Initial check
    checkMobile();

    // Watch for resize events (handles zoom and window resize)
    window.addEventListener('resize', checkMobile);
    
    // Also watch media query changes for better performance
    const mq = window.matchMedia('(max-width: 768px)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      checkMobile();
    };
    mq.addEventListener('change', handleMediaChange);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      mq.removeEventListener('change', handleMediaChange);
    };
  }, []);

  const value = useMemo(
    () => ({ isCollapsed, isMobile, isOpen, toggleSidebar, setIsCollapsed, setIsOpen }),
    [isCollapsed, isMobile, isOpen]
  );

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
