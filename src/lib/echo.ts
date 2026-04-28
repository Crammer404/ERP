'use client';

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { BROADCASTING_CONFIG } from '@/config/broadcasting.config';

/**
 * Laravel Echo + Pusher for public account-status channels.
 * Requires NEXT_PUBLIC_PUSHER_APP_KEY and NEXT_PUBLIC_PUSHER_APP_CLUSTER.
 */
export function createAccountStatusEcho(): InstanceType<typeof Echo> | null {
  if (typeof window === 'undefined') return null;

  const { key, cluster, forceTLS } = BROADCASTING_CONFIG;
  if (!key || !cluster) {
    console.warn(
      '[Pusher] NEXT_PUBLIC_PUSHER_APP_KEY or NEXT_PUBLIC_PUSHER_APP_CLUSTER is missing; realtime account status is disabled.'
    );
    return null;
  }

  if (process.env.NODE_ENV === 'development') {
    console.info(
      '[Pusher] Echo starting (realtime uses WebSockets — not your REST api.ts logs). Check DevTools → Network → filter WS.'
    );
  }

  return new Echo({
    broadcaster: 'pusher',
    key,
    cluster,
    forceTLS,
    encrypted: forceTLS,
    Pusher,
  });
}

export function destroyEchoInstance(echo: InstanceType<typeof Echo> | null | undefined): void {
  if (!echo) return;
  try {
    echo.disconnect();
  } catch {
    // ignore
  }
}
