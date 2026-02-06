import { api } from '../../../../services/api';
import { API_ENDPOINTS } from '../../../../config/api.config';

export interface Role {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRoleRequest {
  name: string;
  description: string;
  permissions: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: string[];
}

export const roleService = {
  // Get all roles
  async getAll(): Promise<Role[]> {
    const response = await api(API_ENDPOINTS.ROLES.BASE);

    if (Array.isArray(response)) {
      return response; // already an array
    }

    if (response && Array.isArray(response.data)) {
      return response.data; // Laravel Resource Collection
    }

    return [];
  },

  // Get role by ID
  async getById(id: number): Promise<Role> {
    return await api(`${API_ENDPOINTS.ROLES.BASE}/${id}`);
  },

  // Create new role
  async create(roleData: CreateRoleRequest): Promise<Role> {
    return await api(API_ENDPOINTS.ROLES.CREATE, {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
  },

  // Update role
  async update(id: number, roleData: UpdateRoleRequest): Promise<Role> {
    return await api(`${API_ENDPOINTS.ROLES.BASE}/${id}`, {
      method: 'PATCH', // <-- use PATCH
      body: JSON.stringify(roleData),
    });
  },


  // Delete role
  async delete(id: number): Promise<void> {
    return await api(`${API_ENDPOINTS.ROLES.BASE}/${id}`, {
      method: 'DELETE',
    });
  },
};
