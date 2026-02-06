import { api, setToken, clearToken } from '../api';
import { API_ENDPOINTS } from '../../config/api.config';
import type { User, UserModuleSubmenu } from '@/lib/types';
import { tenantContextService } from '../tenant/tenantContextService';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface SendOtpRequest {
  email: string;
}

export interface SendOtpResponse {
  message: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  token: string;
  user: User;
}

export interface ResetPasswordRequest {
  userId: number;
  password: string;
  token: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export const authService = {
  // Login user
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    console.log('AuthService: Raw login API response:', response);

    // Store token after successful login
    if (response.token) {
      setToken(response.token);
      // Cache user data
      this.cacheUserData(response.user);

      // Immediately fetch and store default tenant/branch context
      try {
        await tenantContextService.fetchTenantContext();
        console.log('AuthService: Default tenant/branch context stored after login');
      } catch (error) {
        console.warn('AuthService: Failed to fetch default context after login:', error);
      }
    }

    return response;
  },

  // Logout user
  async logout(): Promise<void> {
    try {
      await api(API_ENDPOINTS.AUTH.LOGOUT, {
        method: 'POST',
      });
    } finally {
      // Always clear token and cached data, even if logout request fails
      clearToken();
      this.clearCachedData();
      // Clear tenant and branch context to prevent persistence across users
      tenantContextService.clearTenantContext();
    }
  },

  // Get current user (from cache or API)
  async getCurrentUser(): Promise<User | null> {
    // First try to get from cache
    const cachedUser = this.getCachedUserData();
    if (cachedUser) {
      return cachedUser;
    }

    // If no cache, fetch from API
    try {
      const user = await api(API_ENDPOINTS.AUTH.ME);
      this.cacheUserData(user);
      return user;
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  },

  // Cache user data in localStorage
  cacheUserData(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_data', JSON.stringify(user));
      localStorage.setItem('user_data_timestamp', Date.now().toString());
    }
  },

  // Get cached user data
  getCachedUserData(): User | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const cachedData = localStorage.getItem('user_data');
      const timestamp = localStorage.getItem('user_data_timestamp');
      
      if (!cachedData || !timestamp) {
        return null;
      }

      // Check if cache is still valid (24 hours)
      const cacheAge = Date.now() - parseInt(timestamp);
      const maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours

      if (cacheAge > maxCacheAge) {
        this.clearCachedData();
        return null;
      }

      return JSON.parse(cachedData);
    } catch (error) {
      console.error('Error reading cached user data:', error);
      this.clearCachedData();
      return null;
    }
  },

  // Clear all cached data
  clearCachedData(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_data_timestamp');
    }
  },

  // Send OTP to email
  async sendOtp(credentials: SendOtpRequest): Promise<SendOtpResponse> {
    const response = await api(API_ENDPOINTS.AUTH.SEND_OTP, {
      method: 'POST',
      body: JSON.stringify(credentials),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    return response;
  },

  // Verify OTP (for password reset - don't login user)
  async verifyOtp(credentials: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    const response = await api(API_ENDPOINTS.AUTH.VERIFY_OTP, {
      method: 'POST',
      body: JSON.stringify(credentials),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    console.log('AuthService: Raw verify OTP API response:', response);

    // Don't store token or cache user data for password reset flow
    // The token will be used only for password reset, not for authentication

    return response;
  },

  // Reset password using OTP token
  async resetPassword(credentials: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    const response = await api(`${API_ENDPOINTS.USERS.BASE}/${credentials.userId}`, {
      method: 'POST',
      body: JSON.stringify({
        password: credentials.password,
        password_confirmation: credentials.password,
        _method: 'PATCH',
      }),
      headers: {
        'Authorization': `Bearer ${credentials.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    return response;
  },

  // Refresh user data from API with retry logic
  async refreshUserData(): Promise<User | null> {
    const maxRetries = 2;
    const retryDelay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`AuthService: Refreshing user data (attempt ${attempt}/${maxRetries})`);
        const user = await api(API_ENDPOINTS.AUTH.ME);
        console.log('AuthService: Raw API response from /me endpoint:', user);

        // Validate user data before caching
        if (user && user.id) {
          this.cacheUserData(user);
          return user;
        } else {
          console.warn('AuthService: Invalid user data received:', user);
          return null;
        }
      } catch (error) {
        console.error(`Error refreshing user data (attempt ${attempt}/${maxRetries}):`, error);

        // If this is the last attempt or it's a non-retryable error, fail
        if (attempt === maxRetries || (error instanceof Error && error.message.includes('401'))) {
          console.error('AuthService: Final attempt failed or unauthorized - clearing cache');
          this.clearCachedData();
          return null;
        }

        // Wait before retrying (except on last attempt)
        if (attempt < maxRetries) {
          console.log(`AuthService: Waiting ${retryDelay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    return null;
  },
};
