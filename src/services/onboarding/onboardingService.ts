import { api, setToken } from '../api';
import { API_ENDPOINTS } from '@/config/api.config';
import type { User } from '@/lib/types';

export interface OnboardingData {
  // User Account Information
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  
  // User Address (optional)
  user_address?: {
    country: string;
    postal_code?: string;
    region?: string;
    province: string;
    city: string;
    street?: string;
  };
  
  // Tenant/Business Information
  tenant_name: string;
  tenant_email?: string;
  tenant_phone?: string;
  
  // Tenant Address (Business Address)
  tenant_address: {
    country: string;
    postal_code?: string;
    region?: string;
    province: string;
    city: string;
    street?: string;
  };
  
  // Optional Branch Name
  branch_name?: string;
  
  // Additional onboarding fields (for future use)
  primary_color?: string;
  receipt_header_message?: string;
  receipt_footer_message?: string;
  selected_plan?: string;
}

export interface OnboardingResponse {
  message: string;
  token_type: string;
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role_name: string;
  };
  tenant: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
  };
  branch: {
    id: number;
    name: string;
  };
}

export const onboardingService = {
  /**
   * Complete the onboarding process
   * Creates user, tenant, and default branch
   */
  async complete(data: OnboardingData | FormData): Promise<OnboardingResponse> {
    // Detect if data is FormData and handle accordingly
    const isFormData = data instanceof FormData;
    
    const response = await api('/onboarding/complete', {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
      // Don't set Content-Type header for FormData - browser will set it with boundary
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    });
    
    console.log('OnboardingService: Raw API response:', response);
    
    // Store token after successful onboarding (auto-login)
    if (response.token) {
      setToken(response.token);
      
      // Cache user data in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_data', JSON.stringify(response.user));
        localStorage.setItem('user_data_timestamp', Date.now().toString());
        
        // Store tenant and branch context
        if (response.tenant) {
          localStorage.setItem('tenant_context', JSON.stringify(response.tenant));
        }
        if (response.branch) {
          localStorage.setItem('branch_context', JSON.stringify(response.branch));
        }
      }
    }
    
    return response;
  },

  /**
   * Send OTP for email verification during onboarding
   */
  async sendOtp(email: string): Promise<{ message: string }> {
    const response = await api(API_ENDPOINTS.ONBOARDING.SEND_OTP, {
      method: 'POST',
      body: JSON.stringify({ email }),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    return response;
  },

  /**
   * Verify OTP for email verification during onboarding
   */
  async verifyOtp(email: string, otp: string): Promise<{ message: string }> {
    const response = await api(API_ENDPOINTS.ONBOARDING.VERIFY_OTP, {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    return response;
  },
};

