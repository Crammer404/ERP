import { api } from '../api';
import { API_ENDPOINTS } from '@/config/api.config';

export interface Tenant {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

export interface Branch {
  id: number;
  name: string;
  branch_code?: string;
  email?: string;
  contact_no?: string;
  tenant_id: number;
}

export interface UserInfo {
  first_name?: string;
  last_name?: string;
  middle_name?: string;
}

export interface Employee {
  id: number;
  email: string;
  name?: string;
  user_info?: UserInfo;
  role?: {
    id: number;
    name: string;
  };
}

class ManagementService {
  /**
   * Fetch tenants visible to current user.
   * Backend returns all for super admin, scoped set for non-global roles.
   */
  async fetchAllTenants(): Promise<Tenant[]> {
    try {
      const response = await api('/management/tenants?per_page=10000');
      return response.tenants || [];
    } catch (error) {
      console.error('Error fetching tenants:', error);
      return [];
    }
  }

  /**
   * Fetch branches for a specific tenant
   */
  async fetchTenantBranches(tenantId: number): Promise<Branch[]> {
    try {
      console.log(`🔍 Fetching branches for tenant ID: ${tenantId}`);
      const response = await api(`/management/tenants/${tenantId}/branches`);
      console.log('📦 API Response:', response);
      
      // Handle the direct response structure
      const branches = response.branches || [];
      console.log('🌿 Extracted branches:', branches);
      console.log('🌿 Branch count:', branches.length);
      return branches;
    } catch (error) {
      console.error('❌ Error fetching tenant branches:', error);
      return [];
    }
  }

  /**
   * Fetch all branches for current user's tenant (filtered by backend)
   * Uses /auth/users/branches endpoint which doesn't require module permissions
   * This ensures the site header always works regardless of branch management module permissions
   */
  async fetchUserBranches(): Promise<Branch[]> {
    try {
      const response = await api('/auth/users/branches');
      console.log('🔍 fetchUserBranches response:', response);
      return response.branches || [];
    } catch (error) {
      console.error('Error fetching branches:', error);
      return [];
    }
  }

  /**
   * Get a specific branch
   */
  async fetchBranch(branchId: number): Promise<Branch | null> {
    try {
      const response = await api(`/management/branches/${branchId}`);
      return response.branch || null;
    } catch (error) {
      console.error('Error fetching branch:', error);
      return null;
    }
  }

  /**
   * Fetch employees for the current branch context
   * Returns users filtered by the current branch (via X-Branch-ID header)
   */
  async fetchBranchEmployees(): Promise<Employee[]> {
    try {
      const perPage = 100;
      let page = 1;
      let users: Employee[] = [];
      let hasMore = true;

      while (hasMore) {
        const params = new URLSearchParams({
          page: page.toString(),
          per_page: perPage.toString(),
        });

        const response = await api(`${API_ENDPOINTS.USERS.BASE}?${params.toString()}`);
        const pageUsers = response.users || [];
        users = users.concat(pageUsers);

        const pagination = response.pagination;
        if (!pagination) {
          hasMore = false;
        } else {
          hasMore = Boolean(pagination.has_more_pages);
          page += 1;
        }
      }

      return users;
    } catch (error) {
      console.error('Error fetching branch employees:', error);
      return [];
    }
  }
}

export const managementService = new ManagementService();

