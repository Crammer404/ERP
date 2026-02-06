import { api } from '../api';
import { API_ENDPOINTS } from '../../config/api.config';

export interface ModuleSubmenu {
  id: number;
  module_group_id: number;
  module_path: string;
  menu_name: string;
  icon_path: string;
  created_at: string;
  updated_at: string;
  module_group?: {
    id: number;
    display_name: string;
    icon_path: string;
    sort_order: number;
  };
}

export interface RolePermission {
  id: number;
  role_id: number;
  module_submenu_id: number;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  created_at: string;
  updated_at: string;
}

export interface ModuleSubmenuWithPermissions extends ModuleSubmenu {
  permissions?: Partial<RolePermission>;
}

class ModuleSubmenuService {
  /**
   * Get all module submenus
   */
  async getModuleSubmenus(): Promise<ModuleSubmenu[]> {
    const response = await api(API_ENDPOINTS.SETTINGS.MODULE_SUBMENUS);
    return response.data || [];
  }

  /**
   * Get module submenus with their permissions for a specific role
   */
  async getModuleSubmenusWithPermissions(roleId: number): Promise<ModuleSubmenuWithPermissions[]> {
    const endpoint = API_ENDPOINTS.ROLES.PERMISSIONS.replace('{id}', roleId.toString());
    const response = await api(endpoint);
    return response.data || [];
  }

  /**
   * Get all module submenus grouped by module group
   */
  async getModuleSubmenusGrouped(): Promise<Record<string, ModuleSubmenu[]>> {
    const submenus = await this.getModuleSubmenus();
    const grouped: Record<string, ModuleSubmenu[]> = {};
    
    submenus.forEach(submenu => {
      const groupName = submenu.module_group?.display_name || 'Other';
      if (!grouped[groupName]) {
        grouped[groupName] = [];
      }
      grouped[groupName].push(submenu);
    });
    
    return grouped;
  }

  /**
   * Update permissions for a specific role and module submenu (PATCH - Smart upsert)
   */
  async updateRolePermissions(roleId: number, permissions: Array<{
    module_submenu_id: number;
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  }>): Promise<void> {
    const endpoint = API_ENDPOINTS.ROLES.PERMISSIONS.replace('{id}', roleId.toString());
    await api(endpoint, {
      method: 'PATCH',
      body: JSON.stringify({ permissions }),
    });
  }
}

export const moduleSubmenuService = new ModuleSubmenuService();
