'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Info } from 'lucide-react';
import { ProductForm, ProductFormValues } from '@/app/inventory/products/components/ProductForm';
import type { Product } from '@/services/product/productService';
import { productService, CreateProductRequest } from '@/services/product/productService';
import { Loader } from '@/components/ui/loader';
import { useToast } from '@/hooks/use-toast';
import { tenantContextService } from '@/services/tenant/tenantContextService';
import { authService } from '@/services/auth/authService';
import { monitorStockChange } from '@/lib/stockMonitor';

interface ProductDialogProps {
  product?: Product | null;
  onSave: (payload: any, id?: number) => void;
  onRefresh?: () => void;
  children: React.ReactNode;
}

export function ProductDialog({ product, onSave, onRefresh, children }: ProductDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProduct, setIsFetchingProduct] = useState(false);
  const [fetchedProduct, setFetchedProduct] = useState<Product | null>(null);
  const [currentBranch, setCurrentBranch] = useState<{ id: number; name: string } | null>(null);
  const [currentTenant, setCurrentTenant] = useState<{ id: number; name: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isInfoPopoverOpen, setIsInfoPopoverOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadContext = () => {
      const cachedUser = authService.getCachedUserData();
      if (cachedUser) {
        setCurrentUser(cachedUser);
      }

      const storedBranch = tenantContextService.getStoredBranchContext();
      if (storedBranch) {
        setCurrentBranch(storedBranch);
      }

      const storedTenant = tenantContextService.getStoredTenantContext();
      if (storedTenant) {
        setCurrentTenant(storedTenant);
      }
    };

    loadContext();

    const handleBranchChange = () => {
      loadContext();
    };

    window.addEventListener('branchChanged', handleBranchChange);
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'branch_context' || e.key === 'tenant_context') {
        loadContext();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('branchChanged', handleBranchChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (isOpen && product?.id && !fetchedProduct) {
        console.log('ProductDialog: Fetching product details for product ID:', product.id);
        setIsFetchingProduct(true);
        try {
          const response = await productService.getById(product.id);
          console.log('ProductDialog: Fetched product details:', {
            id: response.product.id,
            name: response.product.name,
            hasStocks: !!response.product.stocks,
            stocksCount: response.product.stocks?.length || 0,
            hasCategory: !!response.product.category,
            hasBrand: !!response.product.brand,
            hasSupplier: !!response.product.supplier,
          });
          setFetchedProduct(response.product);
        } catch (error) {
          console.error('Error fetching product details:', error);
          toast({
            title: 'Error',
            description: 'Failed to load product details. Using cached data.',
            variant: 'destructive',
          });
          console.log('ProductDialog: Using fallback product from prop:', product);
          setFetchedProduct(product);
        } finally {
          setIsFetchingProduct(false);
        }
      }
    };

    fetchProductDetails();
  }, [isOpen, product?.id]);

  useEffect(() => {
    if (!isOpen) {
      setFetchedProduct(null);
    }
  }, [isOpen]);

  const handleSave = async (payload: any) => {
    setIsLoading(true);
    setIsOpen(false);

    try {
      if (!product) {
        const allProducts = await productService.getAll();
        const duplicate = allProducts.data.find(
          (p) => p.name.toLowerCase().trim() === payload.name.toLowerCase().trim()
        );

        if (duplicate) {
          toast({
            title: "Duplicate product",
            description: `A product named "${payload.name}" already exists.`,
            variant: "destructive",
          });
          if (onRefresh) await onRefresh();
          setIsLoading(false);
          return;
        }
      }

      let response;
      const productToUpdate = fetchedProduct || product;
      if (productToUpdate) {
        const updatePayload: CreateProductRequest = {
          name: payload.name ?? "",
          description: payload.description ?? "",
          branch_id: currentBranch?.id || 1,
          tenant_id: currentTenant?.id || 1,
          category_id: payload.category_id ? Number(payload.category_id) : undefined,
          brand_id: payload.brand_id ? Number(payload.brand_id) : undefined,
          supplier_id: payload.supplier_id ? Number(payload.supplier_id) : undefined,
          display_image: payload.image instanceof File ? payload.image : undefined,
          stocks: payload.stocks || [],
        };

        response = await productService.update(productToUpdate.id, updatePayload);
      } else {
        const createPayload: CreateProductRequest = {
          name: payload.name ?? "",
          description: payload.description ?? "",
          branch_id: currentBranch?.id || 1,
          tenant_id: currentTenant?.id || 1,
          category_id: payload.category_id ? Number(payload.category_id) : undefined,
          brand_id: payload.brand_id ? Number(payload.brand_id) : undefined,
          supplier_id: payload.supplier_id ? Number(payload.supplier_id) : undefined,
          display_image: payload.image instanceof File ? payload.image : undefined,
          stocks: payload.stocks || [],
        };

        response = await productService.create(createPayload);
      }

      if (onRefresh) await onRefresh();

      toast({
        title: productToUpdate ? "Product Updated" : "Product Added",
        description: productToUpdate
          ? "Product has been updated successfully"
          : "Product has been added successfully",
        variant: "success",
      });

      monitorStockChange(response.product);

      window.dispatchEvent(new CustomEvent('stockUpdated'));
    } catch (error: any) {
      console.error("Error saving product:", error);

      if (error.response?.status === 409) {
        toast({
          title: "Duplicate product",
          description: `A product with the name "${payload.name}" already exists.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save product. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const displayProduct = fetchedProduct || product;
  
  useEffect(() => {
    if (isOpen && displayProduct) {
      console.log('ProductDialog: displayProduct being passed to ProductForm:', {
        id: displayProduct.id,
        name: displayProduct.name,
        hasStocks: !!displayProduct.stocks,
        stocksCount: displayProduct.stocks?.length || 0,
        hasCategory: !!displayProduct.category,
        hasBrand: !!displayProduct.brand,
        hasSupplier: !!displayProduct.supplier,
        isFetched: !!fetchedProduct,
      });
    }
  }, [isOpen, displayProduct, fetchedProduct]);

  return (
    <>
      {(isLoading || isFetchingProduct) && <Loader overlay={true} size="lg" />}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[1300px] max-h-[90vh] flex flex-col p-0 rounded-lg" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader className="shrink-0 sticky top-0 bg dark:bg px-6 py-3 border-b border dark:border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DialogTitle>{displayProduct ? "Edit Product Information" : "Add Product"}</DialogTitle>
                <Popover open={isInfoPopoverOpen} onOpenChange={setIsInfoPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 rounded-full opacity-70 hover:opacity-100"
                      onClick={() => setIsInfoPopoverOpen(!isInfoPopoverOpen)}
                    >
                      <Info className="h-4 w-4" />
                      <span className="sr-only">
                        {displayProduct ? "How to edit product" : "How to add product"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="max-w-md text-left" align="start">
                    {displayProduct ? (
                      <>
                        <p className="mb-2 font-semibold">Editing a product</p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li>Update name, description, image, or variants.</li>
                          <li>Changing stock values affects availability in branches.</li>
                        </ul>
                      </>
                    ) : (
                      <>
                        <p className="mb-2 font-semibold">Adding a product</p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li>Provide name, description, image, and optionally variants.</li>
                          <li>Products without stock in a branch cannot be sold in that branch.</li>
                        </ul>
                      </>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isFetchingProduct ? (
              <div className="flex items-center justify-center py-12">
                <Loader size="md" />
              </div>
            ) : (
              <ProductForm
                product={displayProduct}
                onSave={handleSave}
                onCancel={() => setIsOpen(false)}
              />
            )}
          </div>

          <div className="shrink-0 bg dark:bg border-t border dark:border px-6 py-3 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isLoading || isFetchingProduct}>
              Cancel
            </Button>
            <Button type="submit" form="product-form" disabled={isLoading || isFetchingProduct}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
