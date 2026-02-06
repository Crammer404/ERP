export const CACHE_CONFIG = {
  DURATION: 5 * 60 * 1000, // 5 minutes in milliseconds
  TENANT_CACHE_DURATION: 5 * 60 * 1000, // 5 minutes for tenant data
  BRANCH_CACHE_DURATION: 5 * 60 * 1000, // 5 minutes for branch data
  USER_CACHE_DURATION: 5 * 60 * 1000, // 10 minutes for user data
  SETTINGS_CACHE_DURATION: 15 * 60 * 1000, // 15 minutes for settings data
} as const;

export const CACHE_KEYS = {
  TENANTS: 'tenants',
  BRANCHES: 'branches',
  USERS: 'users',
  SETTINGS: 'settings',
} as const;
