import { api } from '../../../../services/api';
import { API_ENDPOINTS } from '../../../../config/api.config';

export interface RoleUserBranch {
  id: number;
  name: string;
}

export interface RoleUser {
  id: number;
  name: string;
  email?: string;
  branches?: RoleUserBranch[];
}

export interface Role {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  users?: RoleUser[];
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
  async getAll(): Promise<Role[]> {
    const response = await api(API_ENDPOINTS.ROLES.BASE);

    if (Array.isArray(response)) {
      return response;
    }

    if (response && Array.isArray(response.data)) {
      return response.data;
    }

    return [];
  },

  async getById(id: number): Promise<Role> {
    return await api(`${API_ENDPOINTS.ROLES.BASE}/${id}`);
  },

  async create(roleData: CreateRoleRequest): Promise<Role> {
    return await api(API_ENDPOINTS.ROLES.CREATE, {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
  },

  async update(id: number, roleData: UpdateRoleRequest): Promise<Role> {
    return await api(`${API_ENDPOINTS.ROLES.BASE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(roleData),
    });
  },

  async delete(id: number): Promise<void> {
    return await api(`${API_ENDPOINTS.ROLES.BASE}/${id}`, {
      method: 'DELETE',
    });
  },
};
