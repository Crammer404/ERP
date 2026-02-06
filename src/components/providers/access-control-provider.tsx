'use client';

import { createContext, useContext, useState, ReactNode, useMemo, useCallback, useEffect } from 'react';
import type { User, UserModuleSubmenu, UserModuleGroup } from '@/lib/types';
import { authService } from '@/services';

interface AccessControlContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  getUserModules: () => UserModuleSubmenu[];
  getUserModuleGroups: () => Record<string, UserModuleGroup>;
  updateUserFromAuth: (userData: User | null) => void;
  refreshUserData: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AccessControlContext = createContext<AccessControlContextType | undefined>(undefined);

export function AccessControlProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize loading state - user data will be synced via AuthRoleSync
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Get all user module submenus (flattened from all groups)
  const getUserModules = useCallback(() => {
    if (!user?.permissions) return [];
    
    const allModuleSubmenus: UserModuleSubmenu[] = [];
    for (const groupData of Object.values(user.permissions)) {
      allModuleSubmenus.push(...groupData.modules);
    }
    return allModuleSubmenus;
  }, [user]);

  // Get user module groups
  const getUserModuleGroups = useCallback(() => {
    const moduleGroups = user?.permissions || {};
    console.log('AccessControlProvider: getUserModuleGroups returning:', moduleGroups);
    return moduleGroups;
  }, [user]);

  // Update user data from auth
  const updateUserFromAuth = useCallback((userData: User | null) => {
    console.log('AccessControlProvider: updateUserFromAuth called with:', userData);
    setUser(userData);
  }, []);

  // Refresh user data from API
  const refreshUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      const userData = await authService.refreshUserData();
      console.log('AccessControlProvider: refreshUserData API response:', userData);
      setUser(userData);
    } catch (error) {
      console.error('Error refreshing user data:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout user
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(() => ({ 
    user, 
    setUser, 
    getUserModules,
    getUserModuleGroups,
    updateUserFromAuth,
    refreshUserData,
    logout,
    isLoading
  }), [
    user, 
    getUserModules,
    getUserModuleGroups,
    updateUserFromAuth,
    refreshUserData,
    logout,
    isLoading
  ]);

  return (
    <AccessControlContext.Provider value={value}>
      {children}
    </AccessControlContext.Provider>
  );
}

export function useAccessControl() {
  const context = useContext(AccessControlContext);
  if (context === undefined) {
    throw new Error('useAccessControl must be used within an AccessControlProvider');
  }
  return context;
}
