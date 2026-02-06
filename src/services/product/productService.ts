 import { api } from '../api';
import { API_ENDPOINTS } from '../../config/api.config';

export interface Product {
  id: number;
  name: string;
  description: string;
  display_image?: string;
  branch_id: number;
  tenant_id: number;
  low_stock_threshold?: number;
  category?: {
    id: number;
    name: string;
  };
  brand?: {
    id: number;
    name: string;
  };
  supplier?: {
    id: number;
    name: string;
  } | null;
  images?: ProductImage[];
  stocks?: Stock[];
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image: string;
  created_at: string;
  updated_at: string;
}

export interface Stock {
  id: number;
  product_id: number;
  variant_specification_id?: number | null;
  variant_specification?: {
    id: number;
    name: string;
    variant: {
      id: number;
      name: string;
    };
  };
  cost: number;
  profit_margin: number;
  selling_price: number;
  quantity: number;
  low_stock_threshold?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProductRequest {
   name: string;
   description?: string;
   branch_id: number;
   tenant_id: number;
   low_stock_threshold?: number;
   category_id?: number;
   brand_id?: number;
   supplier_id?: number;
   display_image?: string | File;
   images?: File[];
   stocks?: {
     cost: number;
     profit_margin: number;
     selling_price: number;
     quantity: number;
     low_stock_threshold?: number;
     variant_specification_id?: number | null;
   }[];
 }

export interface UpdateProductRequest {
    name?: string;
    description?: string;
    branch_id?: number;
    tenant_id?: number;
    low_stock_threshold?: number;
   category_id?: number;
   brand_id?: number;
   supplier_id?: number;
   display_image?: File;
   images?: File[];
   image_ids_to_keep?: number[];
   stocks?: {
     cost: number;
     profit_margin: number;
     selling_price: number;
     quantity: number;
     low_stock_threshold?: number;
     variant_specification_id?: number | null;
   }[];
   _method?: "PATCH";
 }

export interface ProductCategory {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductStock {
  productId: number;
  currentStock: number;
  minStock: number;
  maxStock: number;
  lastUpdated: string;
}

export interface ProductVariant {
  id: number;
  name: string;
  tenant_id: number;
  createdAt: string;
  updatedAt: string;
  specifications: ProductVariantSpecification[];
}

export interface ProductVariantSpecification {
  id: number;
  variant_id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// === UIProduct for table display ===
export interface UIProduct extends Product {
   price: number;
   cost: number;
   stock: number;
   image: string;
   categoryName: string;
   branch?: { id: number; name: string } | null;
   tenant?: { id: number; name: string } | null;
   supplier?: { id: number; name: string } | null;

 }

// Helper to map Product → UIProduct
function mapProductToUI(data: Product): UIProduct {
   const firstStock = data.stocks?.[0];

   return {
     ...data,
     price: firstStock?.selling_price ?? 0,
     cost: firstStock?.cost ?? 0,
     stock: firstStock?.quantity ?? 0,
     image: data.display_image || 'https://placehold.co/100x100.png',
     categoryName: data.category?.name ?? 'Uncategorized',
     branch: (data as any).branch ?? null,
     tenant: (data as any).tenant ?? null,
     supplier: data.supplier ?? null,
   };
 }

// Helper to convert request data to FormData
function createFormData(data: CreateProductRequest | UpdateProductRequest): FormData {
    const formData = new FormData();

    // === Basic fields ===
    if (data.name) formData.append("name", data.name);
    if (data.description) formData.append("description", data.description ?? "");
    if ("branch_id" in data && data.branch_id != null)
      formData.append("branch_id", data.branch_id.toString());
    if ("tenant_id" in data && data.tenant_id != null)
      formData.append("tenant_id", data.tenant_id.toString());
    if ("low_stock_threshold" in data && data.low_stock_threshold != null)
      formData.append("low_stock_threshold", data.low_stock_threshold.toString());
    if (data.category_id != null)
      formData.append("category_id", data.category_id.toString());
    if (data.brand_id != null)
      formData.append("brand_id", data.brand_id.toString());
    if (data.supplier_id != null)
      formData.append("supplier_id", data.supplier_id.toString());

  // === Images ===
  if (data.display_image) {
    if (data.display_image instanceof File) {
      formData.append("display_image", data.display_image);
    } else if (typeof data.display_image === "string" && data.display_image.trim() !== "") {
      // Only append string if your API supports existing image paths
      formData.append("display_image", data.display_image);
    }
  }
  if (data.images?.length) {
    data.images.forEach((image, index) =>
      formData.append(`images[${index}]`, image)
    );
  }
  if ("image_ids_to_keep" in data && data.image_ids_to_keep?.length) {
    data.image_ids_to_keep.forEach((id, index) =>
      formData.append(`image_ids_to_keep[${index}]`, id.toString())
    );
  }

  // === Stocks ===
  if (data.stocks?.length) {
    data.stocks.forEach((stock, index) => {
      formData.append(`stocks[${index}][cost]`, stock.cost.toString());
      formData.append(
        `stocks[${index}][profit_margin]`,
        stock.profit_margin.toString()
      );
      formData.append(
        `stocks[${index}][selling_price]`,
        stock.selling_price.toString()
      );
      formData.append(`stocks[${index}][quantity]`, stock.quantity.toString());

      if (stock.low_stock_threshold != null) {
        formData.append(
          `stocks[${index}][low_stock_threshold]`,
          stock.low_stock_threshold.toString()
        );
      }

      // ✅ Append only for variant products
      if (stock.variant_specification_id != null) {
        formData.append(
          `stocks[${index}][variant_specification_id]`,
          stock.variant_specification_id.toString()
        );
      }
    });
  }

  return formData;
}


// === Service ===
export const productService = {
  async getAll(params?: { page?: number; per_page?: number; branch_id?: number }): Promise<{ data: UIProduct[]; message: string; total?: number; current_page?: number; per_page?: number }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.branch_id) queryParams.append('branch_id', params.branch_id.toString());

    const url = `/inventory/products${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await api(url);
    return {
      data: response.data.map((p: Product) => mapProductToUI(p)),
      message: response.message,
      total: response.total,
      current_page: response.current_page,
      per_page: response.per_page,
    };
  },

  async getById(id: number): Promise<{ product: UIProduct; message: string }> {
    const response = await api(`/inventory/products/${id}`);
    return {
      product: mapProductToUI(response.product),
      message: response.message,
    };
  },

  async create(productData: CreateProductRequest): Promise<{ product: UIProduct; message: string }> {
    const formData = createFormData(productData);
    const response = await api('/inventory/products', { method: 'POST', body: formData });
    return {
      product: mapProductToUI(response.product),
      message: response.message,
    };
  },

  async update(id: number, data: CreateProductRequest) {
    const formData = new FormData();

    // Append all values (like create)
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item, idx) => {
          if (typeof item === "object" && item !== null) {
            Object.entries(item).forEach(([subKey, subValue]) => {
              formData.append(`${key}[${idx}][${subKey}]`, String(subValue ?? ""));
            });
          } else {
            formData.append(`${key}[]`, String(item ?? ""));
          }
        });
      } else if (value !== undefined && value !== null) {
        formData.append(key, value instanceof File ? value : String(value));
      }
    });

    // Laravel-style method override
    formData.append("_method", "PATCH");

    const response = await api(`/inventory/products/${id}`, {
      method: "POST", // must be POST with _method=PATCH
      body: formData,
    });

    return response;
  },

  async delete(id: number): Promise<{ message: string }> {
    const response = await api(`/inventory/products/${id}`, { method: 'DELETE' });
    return { message: response.message };
  },

  async updateStock(stockId: number, data: any) {
    try {
      const response = await api(`/inventory/stocks/${stockId}`, {
        method: "PATCH", // ✅ Laravel expects PATCH
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      return response;
    } catch (error) {
      console.error("Error updating stock:", error);
      throw error;
    }
  },

  async getCategories(branchId?: number): Promise<ProductCategory[]> {
    const queryParams = branchId ? `?branch_id=${branchId}` : '';
    const response = await api(`/inventory/categories${queryParams}`);
    return response.data.map((c: any) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));
  },

  async getBrands(branchId?: number): Promise<ProductCategory[]> {
    const queryParams = branchId ? `?branch_id=${branchId}` : '';
    const response = await api(`/inventory/brands${queryParams}`);
    return response.data.map((b: any) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    }));
  },

  async getVariants(branchId?: number): Promise<ProductVariant[]> {
    const queryParams = branchId ? `?branch_id=${branchId}` : '';
    const response = await api(`/inventory/variants${queryParams}`);
    // tolerate either response.data or response.data.data
    const items = Array.isArray(response.data) ? response.data : (Array.isArray(response.data?.data) ? response.data.data : []);
    return items.map((v: any) => ({
      id: Number(v.id),
      name: v.name,
      tenant_id: Number(v.tenant_id),
      createdAt: v.created_at,
      updatedAt: v.updated_at,
      specifications: (v.specifications ?? []).map((s: any) => ({
        id: Number(s.id),
        variant_id: Number(s.variant_id ?? s.variantId ?? 0),
        name: s.name,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      })),
    }));
  },

  async createCategory(data: { name: string; description?: string }): Promise<ProductCategory> {
    const response = await api('/inventory/categories', {
      method: 'POST',
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

  async createBrand(data: { name: string; description?: string }): Promise<ProductCategory> {
    const response = await api('/inventory/brands', {
      method: 'POST',
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

  async createVariant(
    data: { 
      name: string; 
      tenant_id: number; 
      specifications?: { name: string }[] 
    }
  ): Promise<ProductVariant> {
    const response = await api('/inventory/variants', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return {
      id: response.data.id,
      name: response.data.name,
      tenant_id: response.data.tenant_id,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at,
      specifications: response.data.specifications?.map((s: any) => ({
        id: s.id,
        variant_id: s.variant_id,
        name: s.name,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      })) ?? [],
    };
  },
 
  async createVariantSpecification(
    data: { variant_id: number; value: string }
  ): Promise<ProductVariantSpecification> {
    const response = await api('/inventory/variant-specifications', {
      method: 'POST',
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

  async deleteStock(stockId: number): Promise<{ message: string }> {
    const response = await api(`/inventory/stocks/${stockId}`, { method: 'DELETE' });
    return { message: response.message };
  },

  async getSuppliers(): Promise<ProductCategory[]> {
    try {
      const response = await api('/suppliers');
      console.log('Suppliers API response:', response); // Debug log
      const suppliers = response.suppliers || response.data || [];
      console.log('Raw suppliers data:', suppliers); // Debug log
      console.log('First supplier item:', suppliers[0]); // Debug log
      return suppliers.map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description || '',
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      }));
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      return [];
    }
  },
};