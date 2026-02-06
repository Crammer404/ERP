// === Permissions & User ===
export interface ModulePermission {
  create: boolean | number;
  read: boolean | number;
  update: boolean | number;
  delete: boolean | number;
}

export interface UserModuleSubmenu {
  id: number;
  module_path: string;
  menu_name: string;
  icon_path: string;
  permissions: ModulePermission;
}

export interface ModuleGroup {
  id: number;
  display_name: string;
  icon_path: string;
  sort_order: number;
}

export interface UserModuleGroup {
  group: ModuleGroup;
  modules: UserModuleSubmenu[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role_name: string; // Display name only
  permissions: Record<string, UserModuleGroup>; // Grouped modules: { "main": { group: {...}, modules: [...] } }
}

// === Discounts ===
export type DiscountType = 'none' | 'percentage' | 'fixed';

// === Backend API Types ===
// These match exactly what your backend sends
export interface ApiCategory {
  id: number;
  name: string;
}

export interface ApiBrand {
  id: number;
  name: string;
}

export interface ApiVariantSpec {
  id: number;
  name: string;
  variant_id: number;
}

export interface ApiProduct {
  id: number;
  name: string;
  description: string;
  display_image: string | null;
  branch_id: number;
  tenant_id: number;
  category: ApiCategory;
  brand: ApiBrand;
  images: string[];
  created_at?: string;
  updated_at?: string;
}

export interface ApiStock {
  id: number;
  product: ApiProduct;
  variant_specification: ApiVariantSpec;
  cost: string;
  profit_margin: number;
  selling_price: string;
  quantity: number;
  low_stock_threshold: number;
  
}

// === UI Types ===
// Flattened for POS/cart usage
export interface Product {
  id: number;
  name: string;
  price: number;
  cost: number;
  image: string;
  category: string;
  stock: number;

  // Optional extra fields for detail screens
  description?: string;
  brandName?: string;
  categoryName?: string;
  stocks?: ApiStock[];
  stockDiscountIds?: number[]; // Array of discount IDs applicable to this product
}

// === POS Types ===
export interface CartItem extends Product {
  quantity: number;
  cartItemId?: string;
  discountType: DiscountType;
  discountValue: number;
  // Extended multi-discount support
  percentageDiscounts?: number[];
  fixedDiscounts?: number[];
  
}

// === Local Storage Transaction (for cart/checkout) ===
export interface Transaction {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  totalDiscount: number;
  totalTax: number;
}

// === Backend API Transaction (from database) ===
export interface BackendTransaction {
  id: number;
  reference_no: number;
  status: string;
  is_dine_in: boolean;
  paid_amount: number;
  sub_total: number;
  grand_total: number;
  total_discount: number;
  total_tax: number;
  change: number;
  due_amount: number;
  created_at: string;
  creator?: {
    id: number;
    name: string | null;
  };
  customer?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    tin: string;
  };
  tenant?: {
    id: number;
    name: string;
  };
  branch?: {
    id: number;
    name: string;
  };
  payment_method?: {
    id: number;
    name: string;
    slug: string;
  };
  payment_breakdown?: {
    cash: number;
    online_card: number;
  };
  order_items: BackendOrderItem[];
  taxes: BackendTransactionTax[];
}

export interface BackendOrderItem {
  id: number;
  transaction_id: number;
  stock_id: number;
  quantity: number;
  discounts?: BackendOrderItemDiscount[];
  stock: {
    id: number;
    cost: string;
    price: string;
    selling_price: string;
    quantity: number;
    variant_specification?: {
      id: number;
      name: string;
    } | null;
    product: {
      id: number;
      name: string;
    };
  };
}

export interface BackendOrderItemDiscount {
  id: number;
  order_item_id: number;
  discount: {
    id: number;
    tenant_id: number;
    name: string;
    usage_limit: number;
    remaining_usage: number;
    start_date: string;
    end_date: string;
    value: string | null;
    value_in_percentage: number | null;
  };
}


export interface BackendTransactionTax {
  id: number;
  transaction_id: number;
  tax: {
    id: number;
    name: string;
    percentage: number;
  };
}
