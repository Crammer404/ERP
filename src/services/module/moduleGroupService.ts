import { api } from '../api';
import type { ModuleGroup } from '@/lib/types';

export interface UpdateSortOrderRequest {
  groups: Array<{
    id: number;
    sort_order: number;
  }>;
}

export interface CreateModuleGroupRequest {
  display_name: string;
  icon_path: string;
  sort_order?: number;
}

export interface UpdateModuleGroupRequest {
  display_name?: string;
  icon_path?: string;
  sort_order?: number;
}

class ModuleGroupService {
  /**
   * Get all module groups
   */
  async getModuleGroups(): Promise<ModuleGroup[]> {
    const response = await api.get('/modules/module-groups');
    return response.data.data;
  }

  /**
   * Get a specific module group by ID
   */
  async getModuleGroup(id: number): Promise<ModuleGroup> {
    const response = await api.get(`/modules/module-groups/${id}`);
    return response.data.data;
  }

  /**
   * Create a new module group
   */
  async createModuleGroup(data: CreateModuleGroupRequest): Promise<ModuleGroup> {
    const response = await api.post('/modules/module-groups', data);
    return response.data.data;
  }

  /**
   * Update a module group
   */
  async updateModuleGroup(id: number, data: UpdateModuleGroupRequest): Promise<ModuleGroup> {
    const response = await api.put(`/modules/module-groups/${id}`, data);
    return response.data.data;
  }

  /**
   * Delete a module group
   */
  async deleteModuleGroup(id: number): Promise<void> {
    await api.delete(`/modules/module-groups/${id}`);
  }

  /**
   * Update sort order for multiple module groups
   */
  async updateSortOrder(data: UpdateSortOrderRequest): Promise<void> {
    await api.post('/modules/module-groups/update-sort-order', data);
  }
}

export const moduleGroupService = new ModuleGroupService();
