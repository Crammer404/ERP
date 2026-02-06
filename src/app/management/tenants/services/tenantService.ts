import { api } from '../../../../services/api';
import { API_ENDPOINTS } from '../../../../config/api.config';
import { CACHE_CONFIG } from '../../../../config/cache.config';
import type { Branch } from "../../../../app/management/branches/services/branchService";

export interface TenantAddress {
  street: string;
  city: string;
  province: string;
  region: string;
  postal_code: string;
  country: string;
}

export interface Tenant {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: TenantAddress | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTenantRequest {
  name: string;
  email: string;
  phone: string;
  address: TenantAddress;
}

export interface UpdateTenantRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: TenantAddress;
}

export interface TenantSettings {
  id: number;
  tenant_id: number;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TenantPaginationResponse {
  tenants: Tenant[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    has_more_pages: boolean;
  };
}

interface TenantCacheEntry {
  data: Tenant[];
  timestamp: number;
  total: number;
  lastPage: number;
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    has_more_pages: boolean;
  };
}

interface TenantCache {
  [key: string]: TenantCacheEntry;
}

const tenantCache: TenantCache = {};

export const tenantService = {
  async getAll(page: number = 1, perPage: number = 10, search: string = ''): Promise<TenantPaginationResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
        ...(search && { search })
      });
      
      const url = `${API_ENDPOINTS.TENANTS.BASE}?${params}`;
      const response = await api(url);
      
      if (response && response.tenants && response.pagination) {
        return {
          tenants: response.tenants,
          pagination: response.pagination
        };
      }
      
      if (response && response.tenants) {
        const tenants = response.tenants;
        const startIndex = (page - 1) * perPage;
        const endIndex = startIndex + perPage;
        const paginatedTenants = tenants.slice(startIndex, endIndex);
        
        return {
          tenants: paginatedTenants,
          pagination: {
            current_page: page,
            last_page: Math.ceil(tenants.length / perPage),
            per_page: perPage,
            total: tenants.length,
            from: tenants.length > 0 ? startIndex + 1 : null,
            to: Math.min(endIndex, tenants.length),
            has_more_pages: endIndex < tenants.length,
          }
        };
      }
      
      return {
        tenants: [],
        pagination: {
          current_page: 1,
          last_page: 1,
          per_page: perPage,
          total: 0,
          from: null,
          to: null,
          has_more_pages: false,
        }
      };
    } catch (error) {
      console.error('Error fetching tenants:', error);
      return {
        tenants: [],
        pagination: {
          current_page: 1,
          last_page: 1,
          per_page: perPage,
          total: 0,
          from: null,
          to: null,
          has_more_pages: false,
        }
      };
    }
  },

  async getLazyLoaded(page: number = 1, perPage: number = 10, search: string = ''): Promise<TenantPaginationResponse> {
    const cacheKey = `tenants_${search}_${perPage}_${page}`;
    const now = Date.now();
    
    if (tenantCache[cacheKey] && (now - tenantCache[cacheKey].timestamp) < CACHE_CONFIG.TENANT_CACHE_DURATION) {
      const cached = tenantCache[cacheKey];
      return {
        tenants: cached.data,
        pagination: cached.pagination
      };
    }

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
        ...(search && { search })
      });
      
      const url = `${API_ENDPOINTS.TENANTS.BASE}?${params}`;
      const response = await api(url);
      
      if (response && response.tenants && response.pagination) {
        tenantCache[cacheKey] = {
          data: response.tenants,
          timestamp: now,
          total: response.pagination.total,
          lastPage: response.pagination.last_page,
          pagination: response.pagination
        };
        
        return {
          tenants: response.tenants,
          pagination: response.pagination
        };
      }
      
      if (response && response.tenants) {
        const tenants = response.tenants;
        const startIndex = (page - 1) * perPage;
        const endIndex = startIndex + perPage;
        const paginatedTenants = tenants.slice(startIndex, endIndex);
        
        const pagination = {
          current_page: page,
          last_page: Math.ceil(tenants.length / perPage),
          per_page: perPage,
          total: tenants.length,
          from: tenants.length > 0 ? startIndex + 1 : null,
          to: Math.min(endIndex, tenants.length),
          has_more_pages: endIndex < tenants.length,
        };
        
        tenantCache[cacheKey] = {
          data: paginatedTenants,
          timestamp: now,
          total: tenants.length,
          lastPage: pagination.last_page,
          pagination: pagination
        };
        
        return {
          tenants: paginatedTenants,
          pagination: pagination
        };
      }
      
      return {
        tenants: [],
        pagination: {
          current_page: 1,
          last_page: 1,
          per_page: perPage,
          total: 0,
          from: null,
          to: null,
          has_more_pages: false,
        }
      };
    } catch (error) {
      console.error('Error in lazy loading tenants:', error);
      return {
        tenants: [],
        pagination: {
          current_page: 1,
          last_page: 1,
          per_page: perPage,
          total: 0,
          from: null,
          to: null,
          has_more_pages: false,
        }
      };
    }
  },

  clearCache(search?: string, perPage?: number): void {
    if (search && perPage) {
      const cacheKey = `tenants_${search}_${perPage}`;
      delete tenantCache[cacheKey];
    } else {
      Object.keys(tenantCache).forEach(key => delete tenantCache[key]);
    }
  },

  getCacheStats(): { size: number; keys: string[]; entries: Array<{key: string; timestamp: number; dataLength: number}> } {
    const keys = Object.keys(tenantCache);
    const entries = keys.map(key => ({
      key,
      timestamp: tenantCache[key].timestamp,
      dataLength: tenantCache[key].data.length
    }));
    
    return {
      size: keys.length,
      keys,
      entries
    };
  },

  async getById(id: number): Promise<Tenant> {
    try {
      const response = await api(`${API_ENDPOINTS.TENANTS.BASE}/${id}`);
      
      if (response && response.tenant) {
        return response.tenant;
      }
      
      return response;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  },

  async create(tenantData: CreateTenantRequest): Promise<Tenant> {
    return await api(API_ENDPOINTS.TENANTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(tenantData),
    });
  },

  async update(id: number, tenantData: UpdateTenantRequest): Promise<Tenant> {
    return await api(`${API_ENDPOINTS.TENANTS.BASE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(tenantData),
    });
  },

  async delete(id: number): Promise<void> {
    return await api(`${API_ENDPOINTS.TENANTS.BASE}/${id}`, {
      method: 'DELETE',
    });
  },

  async getSettings(id: number): Promise<TenantSettings> {
    return await api(API_ENDPOINTS.TENANTS.SETTINGS.replace('{id}', id.toString()));
  },

  async getBranches(id: number): Promise<Branch[]> {
    return await api(API_ENDPOINTS.TENANTS.BRANCHES.replace('{id}', id.toString()));
  },

  async getUsers(id: number): Promise<any[]> {
    return await api(API_ENDPOINTS.TENANTS.USERS.replace('{id}', id.toString()));
  },
};
