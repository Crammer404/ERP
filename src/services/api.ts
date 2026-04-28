import { API_CONFIG } from "../config/api.config";

// ==================== TOKEN MANAGEMENT ====================
let token: string | null = null;

const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    const storedToken = localStorage.getItem("token");
    return storedToken;
  } catch (error) {
    console.error('Error getting stored token:', error);
    return null;
  }
};

// ==================== TENANT CONTEXT MANAGEMENT ====================
const getStoredTenantContext = (): any => {
  if (typeof window === "undefined") return null;
  try {
    const storedTenant = localStorage.getItem("tenant_context");
    return storedTenant ? JSON.parse(storedTenant) : null;
  } catch (error) {
    console.error('Error getting stored tenant context:', error);
    return null;
  }
};

const getStoredBranchContext = (): any => {
  if (typeof window === "undefined") return null;
  try {
    const storedBranch = localStorage.getItem("branch_context");
    return storedBranch ? JSON.parse(storedBranch) : null;
  } catch (error) {
    console.error('Error getting stored branch context:', error);
    return null;
  }
};

const waitForBranchContext = async (timeoutMs = 2000): Promise<any | null> => {
  const existing = getStoredBranchContext();
  if (existing?.id) {
    return existing;
  }

  if (typeof window === "undefined") {
    return null;
  }

  return await new Promise((resolve) => {
    let resolved = false;

    const cleanup = () => {
      window.removeEventListener('branchChanged', onBranchChanged as EventListener);
      window.removeEventListener('storage', onStorage);
    };

    const finish = (value: any | null) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve(value);
    };

    const onBranchChanged = () => {
      const latest = getStoredBranchContext();
      if (latest?.id) {
        finish(latest);
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key !== 'branch_context') return;
      const latest = getStoredBranchContext();
      if (latest?.id) {
        finish(latest);
      }
    };

    window.addEventListener('branchChanged', onBranchChanged as EventListener);
    window.addEventListener('storage', onStorage);

    setTimeout(() => {
      finish(getStoredBranchContext());
    }, timeoutMs);
  });
};

const isBranchOptionalEndpoint = (endpoint: string): boolean => {
  const normalized = endpoint.split('?')[0];

  if (normalized === '/auth/users/context') return true;
  if (normalized === '/auth/users/branches') return true;
  if (normalized.startsWith('/management/tenants')) return true;

  return false;
};

const setStoredToken = (newToken: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", newToken);
};

const clearStoredToken = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
};

let tokenPromise: Promise<string | null> | null = null;

export const setToken = (newToken: string): void => {
  token = newToken;
  setStoredToken(newToken);
  tokenPromise = null;
};

export const getToken = (): string | null => {
  if (token) return token;
  return getStoredToken();
};

export const clearToken = (): void => {
  token = null;
  clearStoredToken();
  tokenPromise = null;
};

export const isAuthenticated = (): boolean => {
  const token = getToken();
  return !!token;
};

// ==================== MAIN API CLIENT ====================
const ongoingRequests = new Map<string, Promise<any>>();

const cleanupOngoingRequests = () => {
  const now = Date.now();
  for (const [key, promise] of ongoingRequests.entries()) {
    promise.catch(() => {
      setTimeout(() => {
        ongoingRequests.delete(key);
      }, 30000);
    });
  }
};

if (typeof window !== 'undefined') {
  setInterval(cleanupOngoingRequests, 60000);
}

export const api = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  console.log('API call:', { endpoint, baseUrl: API_CONFIG.BASE_URL, fullUrl: url });

  const requestKey = `${options.method || 'GET'}:${url}:${JSON.stringify(options.body || {})}`;

  if (ongoingRequests.has(requestKey)) {
    console.log('API call deduplicated:', requestKey);
    return ongoingRequests.get(requestKey);
  }

  if (!token) {
    token = getStoredToken();
  }

  const isFormData = options.body instanceof FormData;
  const tenantContext = getStoredTenantContext();
  let branchContext = getStoredBranchContext();
  if (tenantContext?.id && !branchContext?.id && !isBranchOptionalEndpoint(endpoint)) {
    // Tenant switches can temporarily clear branch context while branches are refetched.
    // Wait briefly so requests don't race and fail with transient 400 responses.
    branchContext = await waitForBranchContext();
  }

  const requestPromise = (async () => {
    try {
      const response = await fetch(url, {
        ...options,
        credentials: "include",
        headers: {
          ...(isFormData ? {} : API_CONFIG.DEFAULT_HEADERS),
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(tenantContext && { 'X-Tenant-ID': tenantContext.id.toString() }),
          ...(branchContext && { 'X-Branch-ID': branchContext.id.toString() }),
          ...(options.headers || {}),
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('API: 401 Unauthorized - clearing token');
          clearToken();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('authInvalid', {
                detail: {
                  message: 'Your session has expired. Please log in again.',
                },
              })
            );
          }
        }
        const errText = await response.text();
        let parsedErrorData: any = null;
        try {
          parsedErrorData = errText ? JSON.parse(errText) : null;
        } catch {
          parsedErrorData = { message: errText };
        }

        const disabledMessage = String(parsedErrorData?.message || '').toLowerCase();
        if (response.status === 403 && (disabledMessage.includes('disabled') || disabledMessage.includes('inactive'))) {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('accountDisabled', {
                detail: {
                  message:
                    parsedErrorData?.message ||
                    'Your session has been closed and your account has been disabled. Please contact your administrator if you need access.',
                },
              })
            );
          }
        }

        const error = new Error(`API error: ${response.status}`);
        (error as any).response = {
          status: response.status,
          data: parsedErrorData,
        };
        throw error;
      }

      const text = await response.text();
      try {
        return text ? JSON.parse(text) : null;
      } catch {
        return text;
      }
    } finally {
      ongoingRequests.delete(requestKey);
    }
  })();
  ongoingRequests.set(requestKey, requestPromise);
  return requestPromise;
};


