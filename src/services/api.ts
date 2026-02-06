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

const setStoredToken = (newToken: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", newToken);
};

const clearStoredToken = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
};

// Token management with better race condition handling
let tokenPromise: Promise<string | null> | null = null;

export const setToken = (newToken: string): void => {
  token = newToken;
  setStoredToken(newToken);
  // Clear any pending token fetch
  tokenPromise = null;
};

export const getToken = (): string | null => {
  // If we already have a token in memory, return it
  if (token) return token;

  // Otherwise get from storage
  return getStoredToken();
};

export const clearToken = (): void => {
  token = null;
  clearStoredToken();
  // Clear any pending token fetch
  tokenPromise = null;
};

export const isAuthenticated = (): boolean => {
  const token = getToken();
  return !!token;
};

// ==================== MAIN API CLIENT ====================
// Track ongoing requests to prevent duplicate calls
const ongoingRequests = new Map<string, Promise<any>>();

// Cleanup function to prevent memory leaks
const cleanupOngoingRequests = () => {
  const now = Date.now();
  for (const [key, promise] of ongoingRequests.entries()) {
    // If promise is still pending after 30 seconds, remove it
    promise.catch(() => {
      // Remove failed requests after 30 seconds
      setTimeout(() => {
        ongoingRequests.delete(key);
      }, 30000);
    });
  }
};

// Run cleanup every 60 seconds
if (typeof window !== 'undefined') {
  setInterval(cleanupOngoingRequests, 60000);
}

export const api = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  console.log('API call:', { endpoint, baseUrl: API_CONFIG.BASE_URL, fullUrl: url });

  // Create a request key for deduplication
  const requestKey = `${options.method || 'GET'}:${url}:${JSON.stringify(options.body || {})}`;

  // Check if this exact request is already in progress
  if (ongoingRequests.has(requestKey)) {
    console.log('API call deduplicated:', requestKey);
    return ongoingRequests.get(requestKey);
  }

  // Ensure we have a valid token
  if (!token) {
    token = getStoredToken();
  }

  const isFormData = options.body instanceof FormData;

  // Get tenant and branch context
  const tenantContext = getStoredTenantContext();
  const branchContext = getStoredBranchContext();

  // Create the request promise
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
          // Let AuthProvider handle the redirect instead of forcing it here
        }
        const errText = await response.text();

        // Create an error object that preserves the response structure
        const error = new Error(`API error: ${response.status}`);
        (error as any).response = {
          status: response.status,
          data: (() => {
            try {
              return errText ? JSON.parse(errText) : null;
            } catch {
              return { message: errText };
            }
          })()
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
      // Clean up the ongoing request tracking
      ongoingRequests.delete(requestKey);
    }
  })();

  // Track this request
  ongoingRequests.set(requestKey, requestPromise);

  return requestPromise;
};


