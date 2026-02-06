// src/services/floatingOrderService.ts
import { api } from "../../../../services/api";
import { API_ENDPOINTS } from "../../../../config/api.config";

export interface FloatingOrder {
  id: number;
  reference_no: string;
  table_number?: string;
  status: 'active' | 'in-progress' | 'billed' | 'cancelled';
  notes?: string;
  sub_total: number;
  grand_total: number;
  total_discount: number;
  total_tax: number;
  total_quantity?: number; // Sum of all order item quantities
  created_at: string;
  updated_at: string;
  creator?: {
    id: number;
    name: string | null;
  };
  customer?: any;
  branch?: {
    id: number;
    name: string;
  };
  order_items?: FloatingOrderItem[];
  taxes?: any[];
}

export interface FloatingOrderItem {
  id: number;
  quantity: number;
  price?: number; // Price from order item (if available)
  stock?: {
    id: number;
    price: number; // Backend returns 'price', not 'selling_price'
    selling_price?: number; // Keep for backward compatibility
    cost: number;
    quantity: number;
    variant?: string; // Legacy field, prefer variant_specification
    variant_specification?: {
      id: number;
      name: string;
    } | null;
    product?: {
      id: number;
      name: string;
      image?: string;
      category?: {
        id: number;
        name: string;
      };
    };
  };
  discounts?: any[];
}

export interface CreateFloatingOrderPayload {
  table_number?: string;
  customer_id?: number;
  branch_id?: number;
  created_by?: number;
  notes?: string;
}

export interface AddItemPayload {
  stock_id: number;
  quantity: number;
  discounts?: number[];
}

export interface BillOutPayload {
  payment_method_id: number;
  is_dine_in: boolean;
  paid_amount: number;
  change?: number;
  due_amount?: number;
}

// Fetch all active floating orders
export async function getFloatingOrders(): Promise<{ message: string; data: FloatingOrder[] }> {
  try {
    const response = await api(API_ENDPOINTS.FLOATING_ORDERS.BASE);
    return response;
  } catch (error: any) {
    console.error("Failed to fetch floating orders:", error);
    throw error;
  }
}

// Fetch a single floating order
export async function getFloatingOrder(id: number): Promise<{ message: string; data: FloatingOrder }> {
  try {
    const url = API_ENDPOINTS.FLOATING_ORDERS.GET.replace("{id}", id.toString());
    const response = await api(url);
    return response;
  } catch (error: any) {
    console.error(`Failed to fetch floating order ${id}:`, error);
    throw error;
  }
}

// Create a new floating order (or return existing if table already has active order)
export async function createFloatingOrder(payload: CreateFloatingOrderPayload): Promise<{ message: string; data: FloatingOrder; existing?: boolean }> {
  try {
    const response = await api(API_ENDPOINTS.FLOATING_ORDERS.CREATE, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });
    return response;
  } catch (error: any) {
    console.error("Failed to create floating order:", error);
    throw error;
  }
}

// Update a floating order
export async function updateFloatingOrder(id: number, payload: Partial<CreateFloatingOrderPayload & { status?: 'active' | 'in-progress' | 'billed' | 'cancelled' }>): Promise<{ message: string; data: FloatingOrder }> {
  try {
    const url = API_ENDPOINTS.FLOATING_ORDERS.UPDATE.replace("{id}", id.toString());
    const response = await api(url, {
      method: 'PUT',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });
    return response;
  } catch (error: any) {
    console.error(`Failed to update floating order ${id}:`, error);
    throw error;
  }
}

// Add item to floating order
export async function addItemToFloatingOrder(orderId: number, item: AddItemPayload): Promise<{ message: string; data: FloatingOrder }> {
  try {
    const url = API_ENDPOINTS.FLOATING_ORDERS.ADD_ITEM.replace("{id}", orderId.toString());
    const response = await api(url, {
      method: 'POST',
      body: JSON.stringify(item),
      headers: { 'Content-Type': 'application/json' },
    });
    return response;
  } catch (error: any) {
    console.error(`Failed to add item to floating order ${orderId}:`, error);
    throw error;
  }
}

// Update item in floating order
export async function updateFloatingOrderItem(orderId: number, itemId: number, quantity: number): Promise<{ message: string; data: FloatingOrder }> {
  try {
    const url = API_ENDPOINTS.FLOATING_ORDERS.UPDATE_ITEM
      .replace("{id}", orderId.toString())
      .replace("{itemId}", itemId.toString());
    const response = await api(url, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
      headers: { 'Content-Type': 'application/json' },
    });
    return response;
  } catch (error: any) {
    console.error(`Failed to update item in floating order ${orderId}:`, error);
    throw error;
  }
}

// Remove item from floating order
export async function removeItemFromFloatingOrder(orderId: number, itemId: number): Promise<{ message: string; data: FloatingOrder }> {
  try {
    const url = API_ENDPOINTS.FLOATING_ORDERS.REMOVE_ITEM
      .replace("{id}", orderId.toString())
      .replace("{itemId}", itemId.toString());
    const response = await api(url, {
      method: 'DELETE',
    });
    return response;
  } catch (error: any) {
    console.error(`Failed to remove item from floating order ${orderId}:`, error);
    throw error;
  }
}

// Add taxes to floating order
export async function addTaxesToFloatingOrder(orderId: number, taxIds: number[]): Promise<{ message: string; data: FloatingOrder }> {
  try {
    const url = API_ENDPOINTS.FLOATING_ORDERS.ADD_TAXES.replace("{id}", orderId.toString());
    const response = await api(url, {
      method: 'POST',
      body: JSON.stringify({ taxes: taxIds }),
      headers: { 'Content-Type': 'application/json' },
    });
    return response;
  } catch (error: any) {
    console.error(`Failed to add taxes to floating order ${orderId}:`, error);
    throw error;
  }
}

// Bill out floating order
export async function billOutFloatingOrder(orderId: number, payload: BillOutPayload): Promise<{ message: string; data: { transaction: any; floating_order: FloatingOrder } }> {
  try {
    const url = API_ENDPOINTS.FLOATING_ORDERS.BILL_OUT.replace("{id}", orderId.toString());
    const response = await api(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });
    return response;
  } catch (error: any) {
    console.error(`Failed to bill out floating order ${orderId}:`, error);
    throw error;
  }
}

// Cancel floating order
export async function cancelFloatingOrder(id: number): Promise<{ message: string }> {
  try {
    const url = API_ENDPOINTS.FLOATING_ORDERS.DELETE.replace("{id}", id.toString());
    const response = await api(url, {
      method: 'DELETE',
    });
    return response;
  } catch (error: any) {
    console.error(`Failed to cancel floating order ${id}:`, error);
    throw error;
  }
}

