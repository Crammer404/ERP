import { api } from '../api';
import { API_ENDPOINTS } from '../../config/api.config';

export interface Address {
  id: number;
  country: string;
  province: string;
  city: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAddressRequest {
  country: string;
  province: string;
  city: string;
}

export interface UpdateAddressRequest {
  country?: string;
  province?: string;
  city?: string;
}

export const addressService = {
  async getAll(): Promise<Address[]> {
    return await api(API_ENDPOINTS.ADDRESSES.BASE);
  },

  async getById(id: number): Promise<Address> {
    return await api(`${API_ENDPOINTS.ADDRESSES.BASE}/${id}`);
  },

  async create(addressData: CreateAddressRequest): Promise<Address> {
    const response = await api(API_ENDPOINTS.ADDRESSES.CREATE, {
      method: 'POST',
      body: JSON.stringify(addressData),
    });

    return response.address || response.data || response;
  },

  async update(id: number, addressData: UpdateAddressRequest): Promise<Address> {
    return await api(`${API_ENDPOINTS.ADDRESSES.BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(addressData),
    });
  },

  async delete(id: number): Promise<void> {
    return await api(`${API_ENDPOINTS.ADDRESSES.BASE}/${id}`, {
      method: 'DELETE',
    });
  },
};
