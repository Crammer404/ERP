'use client';

import { createContext, ReactNode, useEffect } from 'react';
import type { CartItem, Product, DiscountType } from '@/lib/types';
import useLocalStorage from '@/hooks/use-local-storage';

export interface CartItemToAdd {
  product: Product;
  quantity?: number;
  discountType?: DiscountType;
  discountValue?: number;
  percentageDiscounts?: number[];
  fixedDiscounts?: number[];
  stockDiscountIds?: number[];
}

export interface CartContextType {
  items: CartItem[];
  addItem: (
    product: Product,
    quantity?: number,
    discountType?: DiscountType,
    discountValue?: number,
    percentageDiscounts?: number[],
    fixedDiscounts?: number[],
    stockDiscountIds?: number[]
  ) => void;
  addItems: (itemsToAdd: CartItemToAdd[]) => void;
  replaceItems: (itemsToAdd: CartItemToAdd[]) => void;
  removeItem: (cartItemId: string) => void;
  updateItemQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  totalDiscount: number;
  cartCount: number;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useLocalStorage<CartItem[]>('cart_items', []);

  // Clear cart when branch changes
  useEffect(() => {
    const handleBranchChange = () => {
      console.log('Branch changed, clearing cart globally');
      setItems([]);
    };

    window.addEventListener('branchChanged', handleBranchChange);
    return () => window.removeEventListener('branchChanged', handleBranchChange);
  }, [setItems]);

  const addItem = (
    product: Product,
    quantity: number = 1,
    discountType: DiscountType = 'none',
    discountValue: number = 0,
    percentageDiscounts: number[] = [],
    fixedDiscounts: number[] = [],
    stockDiscountIds: number[] = []
  ) => {
    setItems((prevItems) => {
      const newItem: CartItem = {
        ...product,
        quantity,
        cartItemId: `${product.id}-${new Date().getTime()}-${Math.random()}`,
        discountType,
        discountValue,
        percentageDiscounts,
        fixedDiscounts,
        stockDiscountIds,
      };
      return [...prevItems, newItem];
    });
  };

  const addItems = (itemsToAdd: CartItemToAdd[]) => {
    setItems((prevItems) => {
      const newItems: CartItem[] = itemsToAdd.map(({ product, quantity = 1, discountType = 'none', discountValue = 0, percentageDiscounts = [], fixedDiscounts = [], stockDiscountIds = [] }) => ({
        ...product,
        quantity,
        cartItemId: `${product.id}-${Date.now()}-${Math.random()}`,
        discountType,
        discountValue,
        percentageDiscounts,
        fixedDiscounts,
        stockDiscountIds,
      }));
      return [...prevItems, ...newItems];
    });
  };

  const replaceItems = (itemsToAdd: CartItemToAdd[]) => {
    setItems(() => {
      const newItems: CartItem[] = itemsToAdd.map(({ product, quantity = 1, discountType = 'none', discountValue = 0, percentageDiscounts = [], fixedDiscounts = [], stockDiscountIds = [] }) => ({
        ...product,
        quantity,
        cartItemId: `${product.id}-${Date.now()}-${Math.random()}`,
        discountType,
        discountValue,
        percentageDiscounts,
        fixedDiscounts,
        stockDiscountIds,
      }));
      return newItems;
    });
  };

  const removeItem = (cartItemId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.cartItemId !== cartItemId));
  };

  const updateItemQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(cartItemId);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalDiscount = items.reduce((total, item) => {
    const subtotal = item.price * item.quantity;
    const sumPercent = (item.percentageDiscounts || []).reduce((a, b) => a + b, 0);
    const sumFixed = (item.fixedDiscounts || []).reduce((a, b) => a + b, 0);
    let itemDiscount = subtotal * (sumPercent / 100) + sumFixed;
    // Backward-compat single discount fields
    if (item.discountType === 'percentage') {
      itemDiscount += subtotal * (item.discountValue / 100);
    } else if (item.discountType === 'fixed') {
      itemDiscount += item.discountValue;
    }
    return total + itemDiscount;
  }, 0);

  const cartTotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  ) - totalDiscount;

  const cartCount = items.reduce((count, item) => count + item.quantity, 0);

  const value = {
    items,
    addItem,
    addItems,
    replaceItems,
    removeItem,
    updateItemQuantity,
    clearCart,
    cartTotal,
    totalDiscount,
    cartCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}