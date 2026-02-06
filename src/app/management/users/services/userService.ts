import { api } from "../../../../services/api";
import { API_ENDPOINTS } from "../../../../config/api.config";
import { Address } from "../../../../services/address/addressService";

export interface UserInfo {
  first_name: string;
  middle_name?: string;
  last_name: string;
  address?: Partial<Address>;
  profile_pic?: string;
}

export interface Role {
  id: number;
  name: string;
}

export interface UserEntity {
  id: number;
  name?: string;
  email: string;
  role: string | number | Role | null;
  created_at?: string;
  updated_at?: string;
  user_info?: UserInfo;
  branches?: Array<{
    id: number;
    name: string;
    tenant?: {
      id: number;
      name: string;
    };
  }>;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  password_confirmation: string;
  role_id: string | number;
  branch_ids: number[];
  user_info: UserInfo;
  profile_picture?: File;
}

export interface UpdateUserRequest {
  email?: string;
  password?: string;
  password_confirmation?: string;
  role_id?: string | number;
  profile_picture?: File;
  user_info?: {
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    address?: Partial<Address>;
  };
}

export interface PaginationResponse {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
  has_more_pages: boolean;
}

export interface PaginatedUsersResponse {
  users: UserEntity[];
  pagination: PaginationResponse;
}

export const userService = {
  async getAll(page: number = 1, perPage: number = 10, search: string = ''): Promise<PaginatedUsersResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });
    
    if (search.trim()) {
      params.append('search', search.trim());
    }
    
    const response = await api(`${API_ENDPOINTS.USERS.BASE}?${params}`);
    return {
      users: response.users || [],
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

  async getById(id: number): Promise<UserEntity> {
    const response = await api(`${API_ENDPOINTS.USERS.BASE}/${id}`);
    return response.user;
  },

  async create(userData: CreateUserRequest | FormData): Promise<UserEntity> {
    const isFormData = userData instanceof FormData;
    return await api(API_ENDPOINTS.USERS.CREATE, {
      method: "POST",
      body: isFormData ? userData : JSON.stringify(userData),
      headers: isFormData ? {} : { "Content-Type": "application/json" },
    });
  },

  async update(id: number, userData: any): Promise<UserEntity> {
    if (userData.profile_picture) {
      const formData = new FormData();

      const { profile_picture, ...rest } = userData;
      formData.append("user", JSON.stringify(rest));
      formData.append("profile_picture", profile_picture);

      return await api(`${API_ENDPOINTS.USERS.BASE}/${id}`, {
        method: "POST",
        body: (() => {
          formData.append("_method", "PATCH");
          return formData;
        })(),
      });
    } else {
      return await api(`${API_ENDPOINTS.USERS.BASE}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(userData),
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  async delete(id: number): Promise<void> {
    return await api(`${API_ENDPOINTS.USERS.BASE}/${id}`, {
      method: "DELETE",
    });
  },

  async getRoles(): Promise<Role[]> {
    const response = await api(API_ENDPOINTS.ROLES.BASE, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return response.data || [];
  },
};
