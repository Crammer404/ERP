/** Client-safe Pusher settings (use NEXT_PUBLIC_* in .env.local). */

const scheme = process.env.NEXT_PUBLIC_PUSHER_SCHEME ?? 'https';

export const BROADCASTING_CONFIG = {
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY ?? '',
  cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER ?? '',
  forceTLS: scheme !== 'http',
} as const;
