// src/hooks/useProducts.ts
'use client';

import { useEffect, useState } from 'react';
import { fetchProducts } from '../services/salesService';
import { tenantContextService } from '@/services/tenant/tenantContextService';

// Global cache for products data
let productsCache: Product[] | null = null;
let productsCacheTimestamp: number | null = null;
let productsCacheBranchId: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// ✅ Define stock discount shape (matches backend structure)
export interface StockDiscount {
  id: number; // Primary key of stock_discounts table
  stock_id: number;
  discount: {
    id: number;
    tenant_id: number;
    name: string;
    usages: number;
    start_date: string;
    end_date: string;
    value: string | null;
    value_in_percentage: number | null;
  };
}

// ✅ Define stock shape
export interface Stock {
  id: number;
  variant: string;
  cost: number;
  profitMargin: number;
  sellingPrice: number;
  quantity: number;
  lowStockThreshold: number;
  stockDiscounts: StockDiscount[];
}

// ✅ Define category shape
export interface Category {
  id: number;
  name: string;
}

// ✅ Define product shape
export interface Product {
  id: number;
  name: string;
  description: string;
  image: string;
  category: Category;
  stocks: Stock[];
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);

        // Check if we have valid cached data
        const now = Date.now();
        const currentBranch = tenantContextService.getStoredBranchContext();
        const currentBranchId = currentBranch?.id || null;

        if (productsCache && productsCacheTimestamp && productsCacheBranchId === currentBranchId && (now - productsCacheTimestamp) < CACHE_DURATION) {
          console.log('Using cached products data for branch:', currentBranchId);
          setProducts(productsCache);
          setLoading(false);
          return;
        }

        console.log('Fetching fresh products data from API');
        const response = await fetchProducts(); // API call
        console.log('API raw products:', response);

        // ✅ Map backend → frontend Product type (with stocks & discounts)
        const mappedProducts: Product[] = (response.data || []).map((p: any) => {
          let imageUrl = p.display_image || 'https://placehold.co/100x100.png';

          // ⚡ Normalize hostname for Next.js <Image /> config
          if (imageUrl.startsWith('http://127.0.0.1')) {
            imageUrl = imageUrl.replace('127.0.0.1', 'localhost');
          }

          return {
            id: p.id,
            name: p.name,
            description: p.description || '',
            image: imageUrl,
            category: p.category || { id: 0, name: 'Uncategorized' },
            stocks: (p.stocks || []).map((s: any) => ({
              id: s.id,
              variant: s.variant_specification?.name || 'Default',
              cost: parseFloat(s.cost),
              profitMargin: s.profit_margin,
              sellingPrice: parseFloat(s.selling_price),
              quantity: s.quantity,
              lowStockThreshold: s.low_stock_threshold,
              // Keep the original stock_discounts structure
              stockDiscounts: s.stock_discounts || [],
            }))
          };
        });

        console.log('Mapped products:', mappedProducts);

        // Cache the data
        productsCache = mappedProducts;
        productsCacheTimestamp = now;
        productsCacheBranchId = currentBranchId;

        setProducts(mappedProducts);
      } catch (err: any) {
        console.error('Failed to fetch products:', err);
        setError(err.message || 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Refresh products when branch changes
  useEffect(() => {
    const handleBranchChange = (event: CustomEvent) => {
      console.log('Branch changed, refreshing products...', event.detail);
      // Invalidate cache and reload
      productsCache = null;
      productsCacheTimestamp = null;
      // Reload
      (async () => {
        try {
          const response = await fetchProducts();
          const mappedProducts: Product[] = (response.data || []).map((p: any) => {
            let imageUrl = p.display_image || 'https://placehold.co/100x100.png';
            if (imageUrl.startsWith('http://127.0.0.1')) {
              imageUrl = imageUrl.replace('127.0.0.1', 'localhost');
            }
            return {
              id: p.id,
              name: p.name,
              description: p.description || '',
              image: imageUrl,
              category: p.category || { id: 0, name: 'Uncategorized' },
              stocks: (p.stocks || []).map((s: any) => ({
                id: s.id,
                variant: s.variant_specification?.name || 'Default',
                cost: parseFloat(s.cost),
                profitMargin: s.profit_margin,
                sellingPrice: parseFloat(s.selling_price),
                quantity: s.quantity,
                lowStockThreshold: s.low_stock_threshold,
                stockDiscounts: s.stock_discounts || [],
              }))
            };
          });
          productsCache = mappedProducts;
          productsCacheTimestamp = Date.now();
          setProducts(mappedProducts);
        } catch (e) {
          console.error('Failed to refresh products on branch change:', e);
        }
      })();
    };

    window.addEventListener('branchChanged', handleBranchChange as EventListener);
    return () => window.removeEventListener('branchChanged', handleBranchChange as EventListener);
  }, []);

  return { products, loading, error };
}

// Function to invalidate products cache (call this after creating/updating products)
export function invalidateProductsCache() {
  productsCache = null;
  productsCacheTimestamp = null;
  productsCacheBranchId = null;
  console.log('Products cache invalidated');
}
