import { api } from '../../../../services/api';

// ===========================
// 📦 TYPES
// ===========================
export interface PurchaseItem {
  product: {
    name: string;
    status: string;
  };
  quantity: number;
  discount: number;
  pricePerUnit?: number;
  subtotal?: number;
}

export interface PurchaseOrder {
  id: number;
  supplier: string;
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  invoice_no?: string;
  paid_amount?: number;
  due?: number;
  change?: number;
  branch?: { id: number; name: string };
  items?: PurchaseItem[];
}

// ===========================
// 📦 SERVICE
// ===========================
export const purchaseService = {
  // ===========================
  // 📦 ORDERS
  // ===========================
  async getOrders(): Promise<PurchaseOrder[]> {
    const response = await api('/purchases');

    // Laravel ResourceCollection returns data directly in response.data
    const ordersData = response?.data || [];

    if (!Array.isArray(ordersData)) {
      console.error('Invalid API response structure - expected array:', response);
      return [];
    }

    return ordersData.map((o: any) => ({
      id: o.id,
      supplier: o.supplier?.name || 'Unknown Supplier',
      total: o.grand_total,
      status: o.status || 'pending',
      createdAt: o.created_at,
      updatedAt: o.updated_at,
      invoice_no: o.invoice_no,
      paid_amount: o.paid_amount,
      due: o.due,
      change: o.change,
      branch: o.branch ? { id: o.branch.id, name: o.branch.name } : undefined,
      items: o.purchase_items?.map((item: any) => ({
        product: {
          name: item.product?.name || 'Unknown Product',
          status: item.product?.status || 'inactive'
        },
        quantity: item.quantity,
        discount: item.discount || 0,
        pricePerUnit: Number(item.product?.stocks?.[0]?.cost) || 0,
        subtotal: item.subtotal || 0,
      })) || [],
    }));
  },

  async createOrder(data: any): Promise<PurchaseOrder> {
    const response = await api('/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    return {
      id: response.data.id,
      supplier: response.data.supplier?.name || response.data.supplier,
      total: response.data.grand_total || response.data.total,
      status: response.data.status,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at,
    };
  },

  async updateOrder(id: number, data: { supplier?: string; total?: number; status?: string }): Promise<PurchaseOrder> {
    const response = await api(`/purchases/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    return {
      id: response.data.id,
      supplier: response.data.supplier?.name || response.data.supplier,
      total: response.data.grand_total || response.data.total,
      status: response.data.status,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at,
    };
  },

  async deleteOrder(id: number): Promise<{ message: string }> {
    const response = await api(`/purchases/${id}`, { method: 'DELETE' });
    return { message: response.data?.message || 'Order deleted successfully' };
  },

  async approveOrder(id: number): Promise<PurchaseOrder> {
    const response = await api(`/purchases/${id}/approve`, { method: 'PATCH' });
    return {
      id: response.data.id,
      supplier: response.data.supplier?.name || response.data.supplier,
      total: response.data.grand_total || response.data.total,
      status: response.data.status,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at,
    };
  },

  async rejectOrder(id: number): Promise<PurchaseOrder> {
    const response = await api(`/purchases/${id}/reject`, { method: 'PATCH' });
    return {
      id: response.data.id,
      supplier: response.data.supplier?.name || response.data.supplier,
      total: response.data.grand_total || response.data.total,
      status: response.data.status,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at,
    };
  },
};