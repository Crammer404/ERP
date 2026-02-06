import { api } from '../api';
import { API_ENDPOINTS } from '../../config/api.config';

export interface SystemSettings {
  id: number;
  key: string;
  value: string;
  description: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface BranchSettings {
  id: number;
  branch_id: number;
  key: string;
  value: string;
  description: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateSettingsRequest {
  value: string;
}

export const settingsService = {
  // Get system settings
  async getSystemSettings(): Promise<SystemSettings[]> {
    return await api(API_ENDPOINTS.SETTINGS.SYSTEM);
  },

  // Update system setting
  async updateSystemSetting(key: string, value: string): Promise<SystemSettings> {
    return await api(`${API_ENDPOINTS.SETTINGS.SYSTEM}/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  },

  // Get branch settings
  async getBranchSettings(branchId: number): Promise<BranchSettings[]> {
    return await api(API_ENDPOINTS.SETTINGS.BRANCH.replace('{id}', branchId.toString()));
  },

  // Update branch setting
  async updateBranchSetting(branchId: number, key: string, value: string): Promise<BranchSettings> {
    return await api(`${API_ENDPOINTS.SETTINGS.BRANCH.replace('{id}', branchId.toString())}/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  },

  // Save branding settings (create/update) at /settings/system
  async saveBranding(payload: {
    branch_id?: number
    brand_color: string
    brand_logo: string | null
    brand_banner: string | null
    receipt_header: string
    receipt_footer: string
  }): Promise<any> {
    return await api(API_ENDPOINTS.SETTINGS.SYSTEM, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Get branding settings for current branch
  async getBranding(): Promise<{
    message: string
    data: {
      id: number
      branch_id: number
      brand_color: string
      brand_logo: string | null
      brand_banner: string | null
      receipt_header: string
      receipt_footer: string
    }
    branch: {
      id: number
      name: string
      email: string | null
      contact_no: string | null
      address: {
        street: string | null
        barangay: string | null
        city: string | null
        province: string | null
        region: string | null
        zip_code: string | null
      } | null
    } | null
  } | null> {
    return await api(API_ENDPOINTS.SETTINGS.BRANDING);
  },
};
