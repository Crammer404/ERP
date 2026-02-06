'use client';

import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { productService, type Product as APIProduct, type CreateProductRequest, type UpdateProductRequest } from '@/services/product/productService';
import { tenantContextService } from '@/services/tenant/tenantContextService';
import { authService } from '@/services/auth/authService';
import { monitorProducts, clearProductStatus } from '@/lib/stockMonitor';

// Extended Product type for compatibility with existing components
interface Product {
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
  images?: any[];
  stocks?: any[];
  created_at: string;
  updated_at: string;
  // Compatibility fields
  price: number;
  cost: number;
  image: string;
  stock: number;
  categoryName: string;
}
import { ProductFormValues } from '../components/ProductForm';

const DEFAULT_ROWS_PER_PAGE = 10;

// Transform API product to extended format for compatibility
function transformProduct(apiProduct: APIProduct): Product {
  return {
    ...apiProduct,
    // Compatibility fields
    price: apiProduct.stocks?.[0]?.selling_price || 0,
    cost: apiProduct.stocks?.[0]?.cost || 0,
    image: apiProduct.display_image || 'https://placehold.co/100x100.png',
    stock: apiProduct.stocks?.[0]?.quantity || 0,
    categoryName: apiProduct.category?.name || 'No Category',
    low_stock_threshold: apiProduct.low_stock_threshold,
  } as Product;
}

export function useProducts() {
  const [isMounted, setIsMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentBranch, setCurrentBranch] = useState<{ id: number; name: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedVariantTypes, setSelectedVariantTypes] = useState<string[]>([]);

  useEffect(() => {
    setIsMounted(true);
    loadProducts();

    // Listen for branch change events
    const handleBranchChange = () => loadProducts();
    window.addEventListener('branchChanged', handleBranchChange);

    return () => {
      window.removeEventListener('branchChanged', handleBranchChange);
    };
  }, []);

  // Get stored user and branch context (no API calls)
  useEffect(() => {
    // Get stored user data
    const cachedUser = authService.getCachedUserData();
    if (cachedUser) {
      setCurrentUser(cachedUser);
    }

    // Get stored branch context
    const storedBranch = tenantContextService.getStoredBranchContext();
    if (storedBranch) {
      setCurrentBranch(storedBranch);
    }
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current branch for filtering products
      const currentBranch = tenantContextService.getStoredBranchContext();
      const branchId = currentBranch?.id;

      // Fetch all products by setting a very high per_page value
      const response = await productService.getAll({
        per_page: 10000,
        branch_id: branchId
      });
      const transformedProducts = response.data.map(transformProduct);
      setProducts(transformedProducts);

      // Monitor products for stock level changes
      monitorProducts(transformedProducts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p: Product) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (p.categoryName && p.categoryName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(p.categoryName || '');

      // Calculate total quantity and low stock threshold
      const totalQuantity = p.stocks?.reduce((sum, stock) => sum + (stock.quantity || 0), 0) || 0;
      const lowStockThreshold = Math.max(
        ...(p.stocks?.map((s) => s.low_stock_threshold ?? 0) ?? [0])
      );

      // For variant products, check individual variant statuses
      const hasVariants = p.stocks && p.stocks.length > 1;
      let matchesStatus = selectedStatuses.length === 0;

      if (!matchesStatus) {
        if (hasVariants && p.stocks) {
          // Check if any variant matches the selected statuses
          const variantStatuses: string[] = p.stocks.map(stock => {
            const qty = stock.quantity || 0;
            const threshold = stock.low_stock_threshold ?? lowStockThreshold;
            if (qty === 0) return 'Out of Stock';
            if (qty <= threshold) return 'Low Stock';
            return 'In Stock';
          });

          matchesStatus = selectedStatuses.some(status => variantStatuses.includes(status));
        } else {
          // Single product logic
          matchesStatus = (selectedStatuses.includes('In Stock') && totalQuantity > lowStockThreshold) ||
                          (selectedStatuses.includes('Low Stock') && totalQuantity <= lowStockThreshold && totalQuantity > 0) ||
                          (selectedStatuses.includes('Out of Stock') && totalQuantity === 0);
        }
      }

      const matchesBranch = selectedBranches.length === 0 || selectedBranches.includes(currentBranch?.name || 'Main Branch');
      const matchesVariantType = selectedVariantTypes.length === 0 ||
                                (selectedVariantTypes.includes('single') && (!p.stocks || p.stocks.length <= 1)) ||
                                (selectedVariantTypes.includes('variant') && p.stocks && p.stocks.length > 1);
      return matchesSearch && matchesCategory && matchesStatus && matchesBranch && matchesVariantType;
    });
  }, [products, searchTerm, selectedCategories, selectedStatuses, selectedBranches, selectedVariantTypes]);

  const paginatedProducts = useMemo(() => {
    let filtered = filteredProducts;

    if (sortDirection) {
      filtered = [...filtered].sort((a: Product, b: Product) => {
        if (a.name.toLowerCase() < b.name.toLowerCase()) {
          return sortDirection === 'asc' ? -1 : 1;
        }
        if (a.name.toLowerCase() > b.name.toLowerCase()) {
          return sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));

  const handleSaveProduct = async (payload: any) => {
    try {
      // Prepare the data for API call
      const apiData: CreateProductRequest = {
        name: payload.name,
        description: payload.description,
        branch_id: currentBranch?.id || 1,
        tenant_id: 1, // TODO: Get from context/auth
        low_stock_threshold: payload.lowStockThreshold,
        category_id: payload.category_id ? parseInt(payload.category_id) : undefined,
        brand_id: payload.brand_id ? parseInt(payload.brand_id) : undefined,
        supplier_id: payload.supplier_id,
        display_image: payload.image && typeof payload.image === 'object' && 'name' in payload.image ? payload.image as File : undefined,
        images: undefined,
        stocks: payload.stocks, // Use the stocks directly from payload
      };

      if (payload.id) {
        // Update existing product
        const response = await productService.update(payload.id, apiData);
        toast({ title: 'Product Updated', description: response.message });

        // Trigger notification refresh for stock changes
        window.dispatchEvent(new CustomEvent('stockUpdated'));

        await loadProducts(); // Reload products
      } else {
        // Create new product
        console.log('About to call productService.create with:', apiData);
        const response = await productService.create(apiData);
        console.log('Product created successfully:', response);
        toast({ title: 'Product Added', description: response.message });
        await loadProducts(); // Reload products
      }
    } catch (err) {
      console.error('Error saving product:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save product',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      const response = await productService.delete(id);
      toast({
        title: 'Product Deleted',
        description: response.message,
        variant: 'destructive'
      });

      // Clear stock monitoring and trigger notification refresh
      clearProductStatus(id);
      window.dispatchEvent(new CustomEvent('stockUpdated'));

      await loadProducts();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete product',
        variant: 'destructive',
      });
    }
  };

  const handleMassDelete = async () => {
    try {
      const deletePromises = selectedProductIds.map(id => productService.delete(id));
      await Promise.all(deletePromises);

      // Clear stock monitoring and trigger notification refresh
      selectedProductIds.forEach(id => clearProductStatus(id));
      window.dispatchEvent(new CustomEvent('stockUpdated'));

      toast({
        title: `${selectedProductIds.length} Products Deleted`,
        description: 'The selected products have been removed from your inventory.',
        variant: 'destructive',
      });
      setSelectedProductIds([]);
      await loadProducts();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete products',
        variant: 'destructive',
      });
    }
  };

  const handleSortByName = () => {
    if (sortDirection === 'asc') {
      setSortDirection('desc');
    } else if (sortDirection === 'desc') {
      setSortDirection(null);
    } else {
      setSortDirection('asc');
    }
  };

  const handleSelectionChange = (ids: number[]) => {
    setSelectedProductIds(ids);
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: string) => {
    const perPage = parseInt(newItemsPerPage);
    setItemsPerPage(perPage);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
    setCurrentPage(1);
  };

  const handleBranchFilter = (branch: string) => {
    setSelectedBranches(prev =>
      prev.includes(branch)
        ? prev.filter(b => b !== branch)
        : [...prev, branch]
    );
    setCurrentPage(1);
  };

  const handleVariantTypeFilter = (variantType: string) => {
    setSelectedVariantTypes(prev =>
      prev.includes(variantType)
        ? prev.filter(v => v !== variantType)
        : [...prev, variantType]
    );
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedStatuses([]);
    setSelectedBranches([]);
    setSelectedVariantTypes([]);
    setCurrentPage(1);
  };

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(products.map(p => p.categoryName || '').filter(Boolean)));
  }, [products]);

  const uniqueBranches = useMemo(() => {
    return currentBranch ? [currentBranch.name] : ['Main Branch'];
  }, [currentBranch]);

  const handleDeleteStock = async (stockId: number) => {
    try {
      await productService.deleteStock(stockId);
      toast({
        title: 'Stock Deleted',
        description: 'The stock variation has been removed.',
        variant: 'destructive',
      });

      // Stock deletion may affect product stock status
      window.dispatchEvent(new CustomEvent('stockUpdated'));
      await loadProducts();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete stock',
        variant: 'destructive',
      });
    }
  };

  return {
    // State
    products,
    paginatedProducts,
    selectedProductIds,
    currentPage,
    totalPages,
    itemsPerPage,
    searchTerm,
    sortDirection,
    isMounted,
    loading,
    error,
    selectedCategories,
    selectedStatuses,
    selectedBranches,
    selectedVariantTypes,
    uniqueCategories,
    uniqueBranches,

    // Actions
    handleSaveProduct,
    handleDeleteProduct,
    handleMassDelete,
    handleSortByName,
    handleSelectionChange,
    handleSearchChange,
    handlePageChange,
    handleItemsPerPageChange,
    loadProducts,
    handleDeleteStock,
    handleCategoryFilter,
    handleStatusFilter,
    handleBranchFilter,
    handleVariantTypeFilter,
    clearFilters,
  };
}