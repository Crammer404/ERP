'use client';

import { useEffect } from 'react';
import { useAuth } from './auth-provider';
import { useAccessControl } from './access-control-provider';

export function AuthRoleSync() {
  const { user } = useAuth();
  const { updateUserFromAuth } = useAccessControl();

  useEffect(() => {
    if (user) {
      updateUserFromAuth(user);
    }
  }, [user, updateUserFromAuth]);

  return null; // This component doesn't render anything
}
