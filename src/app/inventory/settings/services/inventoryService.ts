import { api } from '../../../../services/api';
import { API_ENDPOINTS } from '../../../../config/api.config';

// 📦 TYPES
export interface InventoryCategory {
  id: number;
  name: string;
  description: string;
  branch_id?: number;
  branch?: { id: number; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface InventoryBrand {
  id: number;
  name: string;
  description: string;
  branch_id?: number;
  branch?: { id: number; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface InventoryVariant {
  id: number;
  name: string;
  tenant_id: number;
  branch_id?: number;
  branch?: { id: number; name: string };
  createdAt: string;
  updatedAt: string;
  specifications: InventoryVariantSpecification[];
}

export interface InventoryVariantSpecification {
  id: number;
  variant_id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMeasurement {
  id: number;
  name: string;
  description?: string;
  unit_type: string;
  symbol: string;
  multiplier_to_base: number;
  createdAt: string;
  updatedAt: string;
}

export const inventoryService = {
  async getCategories(branchId?: number): Promise<InventoryCategory[]> {
    const url = branchId ? `/inventory/categories?branch_id=${branchId}` : '/inventory/categories';
    const response = await api(url);
    return response.data.map((c: any) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      branch_id: c.branch_id,
      branch: c.branch,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));
  },

  async createCategory(data: { name: string; description?: string; branch_id?: number; tenant_id?: number }): Promise<InventoryCategory> {
    const response = await api('/inventory/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    return {
      id: response.data.id,
      name: response.data.name,
      description: response.data.description,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at,
    };
  },

  async updateCategory(id: number, data: { name: string; description?: string }): Promise<InventoryCategory> {
    const response = await api(`/inventory/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    return {
      id: response.data.id,
      name: response.data.name,
      description: response.data.description,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at,
    };
  },

  async deleteCategory(id: number): Promise<{ message: string }> {
    const response = await api(`/inventory/categories/${id}`, { method: 'DELETE' });
    return { message: response.data?.message || 'Category deleted successfully' };
  },

  async getBrands(branchId?: number): Promise<InventoryBrand[]> {
    const url = branchId ? `/inventory/brands?branch_id=${branchId}` : '/inventory/brands';
    const response = await api(url);
    return response.data.map((b: any) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      branch_id: b.branch_id,
      branch: b.branch,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    }));
  },

  async createBrand(data: { name: string; description?: string; branch_id?: number; tenant_id?: number }): Promise<InventoryBrand> {
    const response = await api('/inventory/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    return {
      id: response.data.id,
      name: response.data.name,
      description: response.data.description,
      branch_id: response.data.branch_id,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at,
    };
  },

  async updateBrand(id: number, data: { name: string; description?: string }): Promise<InventoryBrand> {
    const response = await api(`/inventory/brands/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    return {
      id: response.data.id,
      name: response.data.name,
      description: response.data.description,
      branch_id: response.data.branch_id,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at,
    };
  },

  async deleteBrand(id: number): Promise<{ message: string }> {
    const response = await api(`/inventory/brands/${id}`, { method: 'DELETE' });
    return { message: response.data?.message || 'Brand deleted successfully' };
  },

  async getVariants(branchId?: number): Promise<InventoryVariant[]> {
    const url = branchId ? `/inventory/variants?branch_id=${branchId}` : '/inventory/variants';
    const response = await api(url);
    const items = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.data)
      ? response.data.data
      : [];

    return items.map((v: any) => ({
      id: v.id,
      name: v.name,
      tenant_id: v.tenant_id,
      branch_id: v.branch_id,
      branch: v.branch,
      createdAt: v.created_at,
      updatedAt: v.updated_at,
      specifications: (v.specifications ?? []).map((s: any) => ({
        id: s.id,
        variant_id: s.variant_id,
        name: s.name,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      })),
    }));
  },

  async createVariant(data: {
    name: string;
    tenant_id: number;
    branch_id?: number;
    specifications?: { name: string }[];
  }): Promise<InventoryVariant> {
    const response = await api('/inventory/variants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    return {
      id: response.data.id,
      name: response.data.name,
      tenant_id: response.data.tenant_id,
      branch_id: response.data.branch_id,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at,
      specifications:
        response.data.specifications?.map((s: any) => ({
          id: s.id,
          variant_id: s.variant_id,
          name: s.name,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        })) ?? [],
    };
  },

    async updateVariant(
    id: number,
    data: { name: string; tenant_id?: number; specifications?: { name: string }[] }
    ): Promise<InventoryVariant> {
    const response = await api(`/inventory/variants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    return {
        id: response.data.id,
        name: response.data.name,
        tenant_id: response.data.tenant_id,
        createdAt: response.data.created_at,
        updatedAt: response.data.updated_at,
        specifications: (response.data.specifications ?? []).map((s: any) => ({
        id: s.id,
        variant_id: s.variant_id,
        name: s.name,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
        })),
    };
    },

  async createVariantSpecification(data: {
    variant_id: number;
    value: string;
  }): Promise<InventoryVariantSpecification> {
    const response = await api('/inventory/variant-specifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    return {
      id: response.data.id,
      variant_id: response.data.variant_id,
      name: response.data.name,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at,
    };
  },

  async deleteVariant(id: number): Promise<{ message: string }> {
    const response = await api(`/inventory/variants/${id}`, { method: 'DELETE' });
    return { message: response.data?.message || 'Variant deleted successfully' };
  },

  async getMeasurements(branchId?: number): Promise<InventoryMeasurement[]> {
    const response = await api('/inventory/measurements');
    return response.data.map((m: any) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      unit_type: m.unit_type,
      symbol: m.symbol,
      multiplier_to_base: m.multiplier_to_base,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }));
  },

  async createMeasurement(data: { name: string; description?: string; unit_type: string; symbol: string; multiplier_to_base: number }): Promise<InventoryMeasurement> {
    const response = await api('/inventory/measurements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    return {
      id: response.data.id,
      name: response.data.name,
      description: response.data.description,
      unit_type: response.data.unit_type,
      symbol: response.data.symbol,
      multiplier_to_base: response.data.multiplier_to_base,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at,
    };
  },

  async updateMeasurement(id: number, data: { name?: string; description?: string; unit_type?: string; symbol?: string; multiplier_to_base?: number }): Promise<InventoryMeasurement> {
    const response = await api(`/inventory/measurements/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    return {
      id: response.data.id,
      name: response.data.name,
      description: response.data.description,
      unit_type: response.data.unit_type,
      symbol: response.data.symbol,
      multiplier_to_base: response.data.multiplier_to_base,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at,
    };
  },

  async deleteMeasurement(id: number): Promise<{ message: string }> {
    const response = await api(`/inventory/measurements/${id}`, { method: 'DELETE' });
    return { message: response.data?.message || 'Measurement deleted successfully' };
  },
};
