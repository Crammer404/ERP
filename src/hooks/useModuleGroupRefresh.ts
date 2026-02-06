import { useCallback } from 'react';
import { useAccessControl } from '@/components/providers/access-control-provider';

export function useModuleGroupRefresh() {
  const { refreshUserData } = useAccessControl();

  const refreshModuleGroups = useCallback(async () => {
    // Refresh user data to get updated module group order
    await refreshUserData();
  }, [refreshUserData]);

  return { refreshModuleGroups };
}
