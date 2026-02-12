import { api } from '../../../../services/api';
import { API_ENDPOINTS } from '../../../../config/api.config';
import { Address } from '../../../../services/address/addressService';

export interface Branch {
  id: number;
  tenant_id: number;
  name: string;
  branch_code?: string;
  email: string;
  contact_no: string;
  address: Address | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBranchRequest {
  tenant_id?: number;
  name: string;
  email?: string;
  contact_no?: string;
  address: {
    country: string;
    postal_code: string;
    region: string;
    province: string;
    city: string;
    street: string;
  };
}


export interface UpdateBranchRequest {
  name?: string;
  email?: string;
  contact_no?: string;
  address?: {
    country: string;
    postal_code: string;
    region: string;
    province: string;
    city: string;
    street: string;
  };
}

// Pagination response interface
export interface PaginationResponse {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
  has_more_pages: boolean;
}

export interface PaginatedBranchesResponse {
  branches: Branch[];
  pagination: PaginationResponse;
}


export const branchService = {
  async getAll(page: number = 1, perPage: number = 10, search: string = ''): Promise<PaginatedBranchesResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });
    
    if (search.trim()) {
      params.append('search', search.trim());
    }
    
    const response = await api(`${API_ENDPOINTS.BRANCHES.BASE}?${params}`);
    return {
      branches: response.branches || [],
      pagination: response.pagination || {
        current_page: 1,
        last_page: 1,
        per_page: perPage,
        total: 0,
        from: null,
        to: null,
        has_more_pages: false,
      },
    };
  },

  async getById(id: number): Promise<Branch> {
    const response = await api(`${API_ENDPOINTS.BRANCHES.BASE}/${id}`);
    return response.branch;
  },

  async create(branchData: CreateBranchRequest): Promise<Branch> {
    const response = await api(API_ENDPOINTS.BRANCHES.CREATE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(branchData),
    });
    return response.branch;
  },

  async update(id: number, branchData: UpdateBranchRequest): Promise<Branch> {
    const token = localStorage.getItem("token");

    const response = await api(`${API_ENDPOINTS.BRANCHES.BASE}/${id}`, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(branchData),
    });
    return response.branch;
  },

  async delete(id: number): Promise<void> {
    await api(`${API_ENDPOINTS.BRANCHES.BASE}/${id}`, {
      method: "DELETE",
    });
  },

  async getEmployees(id: number): Promise<{ users?: any[]; message?: string; branch_name?: string; email?: string; contact_no?: string; user_id?: number }> {
    return await api(API_ENDPOINTS.BRANCHES.EMPLOYEES.replace('{id}', id.toString()));
  },

  async assignUserToBranch(branchId: number, userId: number): Promise<any> {
    const response = await api(API_ENDPOINTS.BRANCHES.EMPLOYEES.replace('{id}', branchId.toString()), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    return response;
  },

  async removeUserFromBranch(branchId: number, userId: number): Promise<void> {
    await api(`${API_ENDPOINTS.BRANCHES.EMPLOYEES.replace('{id}', branchId.toString())}/${userId}`, {
      method: "DELETE",
    });
  },

  async transferUserToBranch(currentBranchId: number, newBranchId: number, userId: number): Promise<void> {
    // Use the backend transfer endpoint for atomic operation
    const endpoint = `${API_ENDPOINTS.BRANCHES.EMPLOYEES.replace('{id}', currentBranchId.toString())}/transfer/${newBranchId}`;
    await api(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
  },
};
