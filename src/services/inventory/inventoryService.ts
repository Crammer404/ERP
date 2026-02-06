import { api } from '../api';
import { API_ENDPOINTS } from '../../config/api.config';

export interface Inventory {
  id: number;
  branch_id: number;
  product_id: number;
  quantity: number;
  min_stock: number;
  max_stock: number;
  unit_price: number;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInventoryRequest {
  branch_id: number;
  product_id: number;
  quantity: number;
  min_stock: number;
  max_stock: number;
  unit_price: number;
}

export interface UpdateInventoryRequest {
  quantity?: number;
  min_stock?: number;
  max_stock?: number;
  unit_price?: number;
}

export const inventoryService = {
  // Get all inventory records
  async getAll(): Promise<Inventory[]> {
    return await api(API_ENDPOINTS.INVENTORY.BASE);
  },

  // Get inventory by ID
  async getById(id: number): Promise<Inventory> {
    return await api(`${API_ENDPOINTS.INVENTORY.BASE}/${id}`);
  },

  // Create new inventory record
  async create(inventoryData: CreateInventoryRequest): Promise<Inventory> {
    return await api(API_ENDPOINTS.INVENTORY.CREATE, {
      method: 'POST',
      body: JSON.stringify(inventoryData),
    });
  },

  // Update inventory record
  async update(id: number, inventoryData: UpdateInventoryRequest): Promise<Inventory> {
    return await api(`${API_ENDPOINTS.INVENTORY.BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(inventoryData),
    });
  },

  // Delete inventory record
  async delete(id: number): Promise<void> {
    return await api(`${API_ENDPOINTS.INVENTORY.BASE}/${id}`, {
      method: 'DELETE',
    });
  },

  // Get inventory products
  async getProducts(id: number): Promise<any[]> {
    return await api(API_ENDPOINTS.INVENTORY.PRODUCTS.replace('{id}', id.toString()));
  },

  // Get inventory stock
  async getStock(id: number): Promise<any> {
    return await api(API_ENDPOINTS.INVENTORY.STOCK.replace('{id}', id.toString()));
  },
};
