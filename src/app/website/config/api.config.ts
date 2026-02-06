export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3
} as const;

export const API_ENDPOINTS = {
  CONTACT: '/api/website/contact',
  NEWSLETTER: '/api/website/newsletter',
  DEMO_REQUEST: '/api/website/demo-request',
  ANALYTICS: '/api/website/analytics'
} as const;
