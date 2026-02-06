import { api } from '../api';
import { API_ENDPOINTS } from '../../config/api.config';

export interface UserInfo {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  phone?: string;
  birth_date?: string;
  gender?: string;
  address_id?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateUserInfoRequest {
  user_id: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  phone?: string;
  birth_date?: string;
  gender?: string;
  address_id?: number;
}

export interface UpdateUserInfoRequest {
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  phone?: string;
  birth_date?: string;
  gender?: string;
  address_id?: number;
}

export const userInfoService = {
  // Get all user info records
  async getAll(): Promise<UserInfo[]> {
    return await api(API_ENDPOINTS.USER_INFO.BASE);
  },

  // Get user info by ID
  async getById(id: number): Promise<UserInfo> {
    return await api(`${API_ENDPOINTS.USER_INFO.BASE}/${id}`);
  },

  // Create new user info
  async create(userInfoData: CreateUserInfoRequest): Promise<UserInfo> {
    return await api(API_ENDPOINTS.USER_INFO.CREATE, {
      method: 'POST',
      body: JSON.stringify(userInfoData),
    });
  },

  // Update user info
  async update(id: number, userInfoData: UpdateUserInfoRequest): Promise<UserInfo> {
    return await api(`${API_ENDPOINTS.USER_INFO.BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userInfoData),
    });
  },

  // Delete user info
  async delete(id: number): Promise<void> {
    return await api(`${API_ENDPOINTS.USER_INFO.BASE}/${id}`, {
      method: 'DELETE',
    });
  },
};
