'use client';

import { useState, useEffect, useMemo } from 'react';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Package, Tag, X, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Discount, discountService } from '../services/discountService';
import { productService, Product, Stock } from '@/services/product/productService';
import { useToast } from '@/hooks/use-toast';
import { invalidateProductsCache } from '@/app/pos/sales/hooks/useProducts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DialogFooter, DialogDescription } from '@/components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { PaginationInfo } from '@/components/ui/pagination-info';

interface AssignDiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  discount: Discount | null;
}

interface ProductWithStocks extends Product {
  stocks: Stock[];
  categoryName: string;
}

interface AssignedStockItem {
  productId: number;
  productName: string;
  productImage: string;
  stockId: number;
  variantName: string;
}

export function AssignDiscountModal({
  isOpen,
  onClose,
  discount
}: AssignDiscountModalProps) {
  const [products, setProducts] = useState<ProductWithStocks[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [assignedSearchTerm, setAssignedSearchTerm] = useState('');
  const [selectedStocks, setSelectedStocks] = useState<Set<number>>(new Set());
  const [assignedStocks, setAssignedStocks] = useState<Set<number>>(new Set());
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [allProductsPage, setAllProductsPage] = useState(1);
  const [allProductsPerPage, setAllProductsPerPage] = useState(10);
  const [assignedPage, setAssignedPage] = useState(1);
  const [assignedPerPage, setAssignedPerPage] = useState(10);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<AssignedStockItem | null>(null);
  const [removing, setRemoving] = useState(false);
  const { toast } = useToast();

  // Fetch products and stocks when modal opens
  useEffect(() => {
    if (isOpen && discount) {
      fetchProducts();
      fetchAssignedStocks();
    }
  }, [isOpen, discount]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productService.getAll();
      // Map products to include categoryName for display
      const productsWithCategoryName = response.data.map((product: any) => ({
        ...product,
        categoryName: product.category?.name ?? 'Uncategorized'
      }));
      setProducts(productsWithCategoryName);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedStocks = async () => {
    if (!discount) return;
    try {
      const data = await discountService.fetchDiscountedStocks(discount.id);
      const assignedStockIds = new Set<number>(data.data.map((stock: any) => stock.id));
      setAssignedStocks(assignedStockIds);
      setSelectedStocks(assignedStockIds);
    } catch (error) {
      console.error('Error fetching assigned stocks:', error);
    }
  };

  const handleStockToggle = (stockId: number, checked: boolean) => {
    const newSelectedStocks = new Set(selectedStocks);
    if (checked) {
      newSelectedStocks.add(stockId);
    } else {
      newSelectedStocks.delete(stockId);
    }
    setSelectedStocks(newSelectedStocks);
  };

  const handleProductToggle = (product: ProductWithStocks, checked: boolean) => {
    // If single variant product, select all (including Default)
    // If multiple variants, only select non-default variants
    let stockIdsToToggle: number[];
    if (product.stocks.length === 1) {
      // Single variant product - include even if it's Default
      stockIdsToToggle = product.stocks.map(stock => stock.id);
    } else {
      // Multiple variants - exclude Default
      stockIdsToToggle = product.stocks
        .filter(stock => {
          const variantName = stock.variant_specification?.name || 'Default';
          return variantName !== 'Default';
        })
        .map(stock => stock.id);
    }
    
    const newSelectedStocks = new Set(selectedStocks);
    if (checked) {
      stockIdsToToggle.forEach(id => newSelectedStocks.add(id));
    } else {
      stockIdsToToggle.forEach(id => newSelectedStocks.delete(id));
    }
    setSelectedStocks(newSelectedStocks);
  };

  const handleSelectAll = (checked: boolean) => {
    const newSelectedStocks = new Set(selectedStocks);
    
    filteredProducts.forEach(product => {
      // Use the same logic as handleProductToggle
      let stockIdsToToggle: number[];
      if (product.stocks.length === 1) {
        // Single variant product - include even if it's Default
        stockIdsToToggle = product.stocks.map(stock => stock.id);
      } else {
        // Multiple variants - exclude Default
        stockIdsToToggle = product.stocks
          .filter(stock => {
            const variantName = stock.variant_specification?.name || 'Default';
            return variantName !== 'Default';
          })
          .map(stock => stock.id);
      }
      
      if (checked) {
        stockIdsToToggle.forEach(id => newSelectedStocks.add(id));
      } else {
        stockIdsToToggle.forEach(id => newSelectedStocks.delete(id));
      }
    });
    
    setSelectedStocks(newSelectedStocks);
  };

  const handleUnassignStock = (stockId: number) => {
    // Find the item to remove
    const item = assignedItems.find(item => item.stockId === stockId);
    if (item) {
      setItemToRemove(item);
      setRemoveConfirmOpen(true);
    }
  };

  const confirmUnassignStock = async () => {
    if (!itemToRemove || !discount) return;

    setRemoving(true);
    try {
      await discountService.unassignDiscountFromStock(itemToRemove.stockId, discount.id);
      
      // Update the selected stocks to remove this one
      handleStockToggle(itemToRemove.stockId, false);
      
      // Refresh assigned stocks from backend
      await fetchAssignedStocks();
      
      // Invalidate products cache to refresh POS sales
      invalidateProductsCache();

      toast({
        title: "Success",
        description: "Product removed from discount successfully",
      });

      setRemoveConfirmOpen(false);
      setItemToRemove(null);
    } catch (error: any) {
      console.error('Error removing product from discount:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to remove product from discount",
        variant: "destructive",
      });
    } finally {
      setRemoving(false);
    }
  };

  const handleAssign = async () => {
    if (!discount || selectedStocks.size === 0) return;

    setAssigning(true);
    try {
      const stockIds = Array.from(selectedStocks);
      const result = await discountService.assignDiscountToMultipleStocks(stockIds, discount.id);

      if (result.failed > 0) {
        toast({
          title: "Partial Success",
          description: `Discount assigned to ${result.successful} stock(s), ${result.failed} failed`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Discount assigned to ${result.successful} stock(s)`,
        });
      }

      // Invalidate products cache to refresh POS sales with new discounts
      invalidateProductsCache();

      // Refresh assigned stocks after assignment
      await fetchAssignedStocks();

      onClose();
      setSelectedStocks(new Set());
      setAssignedStocks(new Set());
      setSearchTerm('');
    } catch (error) {
      console.error('Error assigning discount:', error);
      toast({
        title: "Error",
        description: "Failed to assign discount",
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  };

  // Get unique categories from products
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    products.forEach(product => {
      if (product.categoryName && product.categoryName !== 'Uncategorized') {
        categories.add(product.categoryName);
      }
    });
    return Array.from(categories).sort();
  }, [products]);

  // Filter products for left column
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || product.categoryName === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // Reset All Products pagination when filters change
  useEffect(() => {
    setAllProductsPage(1);
  }, [searchTerm, selectedCategory]);

  // Get assigned products/stocks for right column
  const assignedItems = useMemo(() => {
    const items: AssignedStockItem[] = [];
    
    products.forEach(product => {
      product.stocks.forEach(stock => {
        if (selectedStocks.has(stock.id)) {
          items.push({
            productId: product.id,
            productName: product.name,
            productImage: product.display_image || 'https://placehold.co/40x40.png',
            stockId: stock.id,
            variantName: stock.variant_specification?.name || 'Default'
          });
        }
      });
    });
    
    return items;
  }, [products, selectedStocks]);

  // Filter assigned items based on search term
  const filteredAssignedItems = useMemo(() => {
    if (!assignedSearchTerm) return assignedItems;
    
    const search = assignedSearchTerm.toLowerCase();
    return assignedItems.filter(item =>
      item.productName.toLowerCase().includes(search) ||
      item.variantName.toLowerCase().includes(search)
    );
  }, [assignedItems, assignedSearchTerm]);

  // Reset Assigned pagination when search changes
  useEffect(() => {
    setAssignedPage(1);
  }, [assignedSearchTerm]);

  const selectedCount = selectedStocks.size;
  const totalStocks = products.reduce((total, product) => total + product.stocks.length, 0);

  // Calculate select all state for filtered products
  const selectAllState = useMemo(() => {
    if (filteredProducts.length === 0) {
      return { checked: false, indeterminate: false };
    }

    let allSelected = true;
    let someSelected = false;

    filteredProducts.forEach(product => {
      let stockIdsToCheck: number[];
      if (product.stocks.length === 1) {
        stockIdsToCheck = product.stocks.map(stock => stock.id);
      } else {
        stockIdsToCheck = product.stocks
          .filter(stock => {
            const variantName = stock.variant_specification?.name || 'Default';
            return variantName !== 'Default';
          })
          .map(stock => stock.id);
      }

      const allSelectedForProduct = stockIdsToCheck.length > 0 && stockIdsToCheck.every(id => selectedStocks.has(id));
      const someSelectedForProduct = stockIdsToCheck.some(id => selectedStocks.has(id));

      if (!allSelectedForProduct) {
        allSelected = false;
      }
      if (someSelectedForProduct) {
        someSelected = true;
      }
    });

    return {
      checked: allSelected,
      indeterminate: someSelected && !allSelected,
    };
  }, [filteredProducts, selectedStocks]);

  // Helper function to generate page numbers array
  // Limit the visible page numbers to a maximum of 2
  const getPageNumbers = (currentPage: number, totalPages: number): (number | 'ellipsis')[] => {
    const maxVisible = 1;

    // If total pages are less than or equal to the max visible, just show all
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: number[] = [];
    const half = Math.floor(maxVisible / 2); // 1 when maxVisible is 2

    let start = Math.max(1, currentPage - half);
    let end = start + maxVisible - 1;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  // Calculate total variants count for All Products
  const totalVariantsCount = useMemo(() => {
    return filteredProducts.reduce((total, product) => {
      if (product.stocks.length === 1) {
        // Single variant product counts as 1
        return total + 1;
      } else {
        // Multiple variants - count only non-default variants
        const nonDefaultStocks = product.stocks.filter(stock => {
          const variantName = stock.variant_specification?.name || 'Default';
          return variantName !== 'Default';
        });
        return total + nonDefaultStocks.length;
      }
    }, 0);
  }, [filteredProducts]);

  // Pagination: All Products
  const allProductsTotalPages = Math.max(1, Math.ceil(filteredProducts.length / allProductsPerPage));
  const allProductsPageSafe = Math.min(allProductsPage, allProductsTotalPages);
  
  // Calculate from/to based on variant count
  const allProductsFrom = totalVariantsCount === 0 ? 0 : (allProductsPageSafe - 1) * allProductsPerPage + 1;
  const allProductsTo = Math.min(allProductsPageSafe * allProductsPerPage, totalVariantsCount);
  
  const allProductsPageNumbers = useMemo(() => getPageNumbers(allProductsPageSafe, allProductsTotalPages), [allProductsPageSafe, allProductsTotalPages]);
  const pagedProducts = useMemo(() => {
    const start = (allProductsPageSafe - 1) * allProductsPerPage;
    return filteredProducts.slice(start, start + allProductsPerPage);
  }, [filteredProducts, allProductsPageSafe, allProductsPerPage]);

  // Pagination: Assigned Products
  const assignedTotalPages = Math.max(1, Math.ceil(filteredAssignedItems.length / assignedPerPage));
  const assignedPageSafe = Math.min(assignedPage, assignedTotalPages);
  const assignedFrom = filteredAssignedItems.length === 0 ? 0 : (assignedPageSafe - 1) * assignedPerPage + 1;
  const assignedTo = Math.min(assignedPageSafe * assignedPerPage, filteredAssignedItems.length);
  const assignedPageNumbers = useMemo(() => getPageNumbers(assignedPageSafe, assignedTotalPages), [assignedPageSafe, assignedTotalPages]);
  const pagedAssignedItems = useMemo(() => {
    const start = (assignedPageSafe - 1) * assignedPerPage;
    return filteredAssignedItems.slice(start, start + assignedPerPage);
  }, [filteredAssignedItems, assignedPageSafe, assignedPerPage]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-[1300px] max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-lg [&>button]:top-[1.75rem] [&>button]:-translate-y-1/2">
        <DialogHeader className="shrink-0 sticky top-0 bg dark:bg px-6 py-4 border-b border dark:border">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Tag className="h-5 w-5" />
            Assign "{discount?.name}" to Products
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Two Column Layout */}
          <div className="flex-1 flex gap-4 px-6 pb-1 pt-1 overflow-hidden">
            {/* LEFT COLUMN - All Products */}
            <div className="flex-1 flex flex-col space-y-4 min-w-0 overflow-hidden">
              <div className="flex-shrink-0">
                <h3 className="text-sm font-semibold mb-2">All Products</h3>
                
                {/* Search */}
                <div className="relative mx-2 mb-4">
                  <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Category Filter */}
                {uniqueCategories.length > 0 && (
                  <div className="mx-2">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-foreground">Categories</h4>
                      {selectedCategory && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCategory(null)}
                          className="h-7 px-3 text-xs rounded-full flex items-center gap-1"
                        >
                          <X className="h-3.5 w-3.5" />
                          Clear Filter
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-3 overflow-x-auto py-2 px-2 scrollbar-hide">
                      {uniqueCategories.map((category) => {
                        const isSelected = selectedCategory === category;
                        return (
                          <Card
                            key={category}
                            className={cn(
                              "flex-shrink-0 cursor-pointer transition-all duration-200 hover:shadow-md",
                              isSelected
                                ? "ring-2 ring-primary bg-primary/5 border-primary/20"
                                : "hover:bg-secondary/50"
                            )}
                            onClick={() => setSelectedCategory(isSelected ? null : category)}
                          >
                            <CardContent className="flex flex-col items-center justify-center py-2 px-3 min-w-[70px]">
                              <Package
                                className={cn(
                                  "h-5 w-5 mb-1",
                                  isSelected ? "text-primary" : "text-muted-foreground"
                                )}
                              />
                              <span
                                className={cn(
                                  "text-[11px] text-center font-medium",
                                  isSelected ? "text-primary" : "text-muted-foreground"
                                )}
                              >
                                {category}
                              </span>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>

              {/* Products List */}
              <div className="flex-1 border rounded-md min-h-0 overflow-hidden flex flex-col">
              <ScrollArea className="flex-1 min-h-0">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2 text-sm">Loading products...</span>
                  </div>
                ) : pagedProducts.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    <Package className="h-6 w-6 mr-2" />
                    <span className="text-sm">No products found</span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-left align-middle">
                          <div className="flex items-center justify-start gap-3 w-full pl-6">
                            <Checkbox
                              checked={selectAllState.indeterminate ? "indeterminate" : selectAllState.checked}
                              onCheckedChange={(checked) => handleSelectAll(checked !== false)}
                              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span>Product</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-center align-middle">Category</TableHead>
                        <TableHead className="text-center align-middle">No. of Variants</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedProducts.map((product) => {
                        // Check if product has multiple non-default variants
                        const nonDefaultStocks = product.stocks.filter(stock => {
                          const variantName = stock.variant_specification?.name || 'Default';
                          return variantName !== 'Default';
                        });
                        const nonDefaultStockIds = nonDefaultStocks.map(stock => stock.id);
                        const hasMultipleVariants = product.stocks.length > 1 && nonDefaultStocks.length > 0;
                        const isExpanded = expandedProducts.has(product.id);
                        
                        // Determine checkbox state and count
                        let checkboxChecked: boolean;
                        let variantCount: number;
                        
                        if (product.stocks.length === 1) {
                          // Single variant product - check if that stock is selected, count is 1
                          checkboxChecked = selectedStocks.has(product.stocks[0].id);
                          variantCount = 1;
                        } else {
                          // Multiple variants - check if all non-default are selected, count excludes Default
                          checkboxChecked = nonDefaultStockIds.length > 0 && nonDefaultStockIds.every(id => selectedStocks.has(id));
                          variantCount = nonDefaultStocks.length;
                        }
                        
                        return (
                          <React.Fragment key={product.id}>
                            <TableRow 
                              className="hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                              onClick={() => {
                                if (hasMultipleVariants) {
                                  setExpandedProducts((prev: Set<number>) => {
                                    const newSet = new Set(prev);
                                    if (newSet.has(product.id)) {
                                      newSet.delete(product.id);
                                    } else {
                                      newSet.add(product.id);
                                    }
                                    return newSet;
                                  });
                                }
                              }}
                            >
                              <TableCell className="align-middle">
                                <div className="flex items-center justify-start gap-3 w-full pl-6">
                                  <Checkbox
                                    checked={checkboxChecked}
                                    onCheckedChange={(checked) => handleProductToggle(product, !!checked)}
                                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <img
                                    src={product.display_image || 'https://placehold.co/40x40.png'}
                                    alt={product.name}
                                    className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                                  />
                                  <span className="font-medium text-sm">{product.name}</span>
                                  {hasMultipleVariants && (
                                    <ChevronDown 
                                      className={cn(
                                        "h-4 w-4 shrink-0 transition-transform duration-200",
                                        isExpanded && "rotate-180"
                                      )} 
                                    />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center align-middle">
                                <span className="text-sm">{product.categoryName || '-'}</span>
                              </TableCell>
                              <TableCell className="text-center align-middle">
                                <span className="text-sm">{variantCount}</span>
                              </TableCell>
                            </TableRow>
                            {hasMultipleVariants && isExpanded && (
                              <TableRow>
                                <TableCell colSpan={3} className="p-4">
                                  <div className="space-y-2 pl-12">
                                    {product.stocks.map((stock) => {
                                      const variantName = stock.variant_specification?.name || 'Default';
                                      // Hide if default variant
                                      if (variantName === 'Default') {
                                        return null;
                                      }
                                      return (
                                        <div key={stock.id} className="flex items-center justify-start gap-3 p-2 rounded-md hover:bg-muted/50">
                                          <Checkbox
                                            checked={selectedStocks.has(stock.id)}
                                            onCheckedChange={(checked) => handleStockToggle(stock.id, !!checked)}
                                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                          />
                                          <span className="text-sm">{variantName}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
              {!loading && filteredProducts.length > 0 && (
                <div className="border-t px-3 py-2 flex items-center justify-between gap-3 text-xs">
                  <PaginationInfo
                    from={allProductsFrom}
                    to={allProductsTo}
                    total={totalVariantsCount}
                    itemsPerPage={allProductsPerPage}
                    onItemsPerPageChange={(value) => {
                      setAllProductsPerPage(parseInt(value));
                      setAllProductsPage(1);
                    }}
                    className="min-w-0"
                    textSize="xs"
                    compact={true}
                    showItemsPerPage={false}
                  />
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (allProductsPageSafe > 1) setAllProductsPage(allProductsPageSafe - 1);
                          }}
                          className={cn("text-xs h-7 px-2", allProductsPageSafe <= 1 ? "pointer-events-none opacity-50" : "")}
                        />
                      </PaginationItem>
                      {allProductsPageNumbers.map((page, index) => (
                        <PaginationItem key={index}>
                          {page === 'ellipsis' ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setAllProductsPage(page);
                              }}
                              isActive={page === allProductsPageSafe}
                              className="text-xs h-7 px-2"
                            >
                              {page}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (allProductsPageSafe < allProductsTotalPages) setAllProductsPage(allProductsPageSafe + 1);
                          }}
                          className={cn("text-xs h-7 px-2", allProductsPageSafe >= allProductsTotalPages ? "pointer-events-none opacity-50" : "")}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="w-px bg-border"></div>

            {/* RIGHT COLUMN - Assigned Products */}
            <div className="flex-1 flex flex-col space-y-4 min-w-0 overflow-hidden">
              <div className="flex-shrink-0">
                <h3 className="text-sm font-semibold mb-2">Assigned Products</h3>
                
                {/* Search */}
                <div className="relative mx-2">
                  <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search assigned products..."
                    value={assignedSearchTerm}
                    onChange={(e) => setAssignedSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Assigned Items List */}
              <div className="flex-1 border rounded-md min-h-0 overflow-hidden flex flex-col">
              <ScrollArea className="flex-1 p-4 min-h-0">
                {assignedItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <Package className="h-8 w-8 mb-2 opacity-50" />
                    <span className="text-sm">No products assigned yet</span>
                    <span className="text-xs mt-1">Select products from the left column</span>
                  </div>
                ) : filteredAssignedItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <Package className="h-8 w-8 mb-2 opacity-50" />
                    <span className="text-sm">No products found</span>
                    <span className="text-xs mt-1">Try adjusting your search</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pagedAssignedItems.map((item) => (
                      <div key={`${item.productId}-${item.stockId}`} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start gap-3">
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">{item.productName}</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Variant: {item.variantName}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 flex-shrink-0 flex items-center justify-center"
                                onClick={() => handleUnassignStock(item.stockId)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              {assignedItems.length > 0 && filteredAssignedItems.length > 0 && (
                <div className="border-t px-3 py-2 flex items-center justify-between gap-3 text-xs">
                  <PaginationInfo
                    from={assignedFrom}
                    to={assignedTo}
                    total={filteredAssignedItems.length}
                    itemsPerPage={assignedPerPage}
                    onItemsPerPageChange={(value) => {
                      setAssignedPerPage(parseInt(value));
                      setAssignedPage(1);
                    }}
                    className="min-w-0"
                    textSize="xs"
                    compact={true}
                    showItemsPerPage={false}
                  />
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (assignedPageSafe > 1) setAssignedPage(assignedPageSafe - 1);
                          }}
                          className={cn("text-xs h-7 px-2", assignedPageSafe <= 1 ? "pointer-events-none opacity-50" : "")}
                        />
                      </PaginationItem>
                      {assignedPageNumbers.map((page, index) => (
                        <PaginationItem key={index}>
                          {page === 'ellipsis' ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setAssignedPage(page);
                              }}
                              isActive={page === assignedPageSafe}
                              className="text-xs h-7 px-2"
                            >
                              {page}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (assignedPageSafe < assignedTotalPages) setAssignedPage(assignedPageSafe + 1);
                          }}
                          className={cn("text-xs h-7 px-2", assignedPageSafe >= assignedTotalPages ? "pointer-events-none opacity-50" : "")}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="shrink-0 bg dark:bg border-t border dark:border px-6 py-4 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={selectedCount === 0 || assigning}
            >
              {assigning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                `Assign to ${selectedCount} stock(s)`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>

      {removeConfirmOpen && (
        <Dialog open={removeConfirmOpen} onOpenChange={(open) => {
          if (!open && !removing) {
            setRemoveConfirmOpen(false);
            setItemToRemove(null);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Product</DialogTitle>
              <DialogDescription>
                This product "{itemToRemove?.productName}{itemToRemove?.variantName !== 'Default' ? ` (${itemToRemove?.variantName})` : ''}" will be removed from "{discount?.name}".
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  if (!removing) {
                    setRemoveConfirmOpen(false);
                    setItemToRemove(null);
                  }
                }}
                disabled={removing}
              >
                Cancel
              </Button>
              <Button 
                variant="default"
                onClick={confirmUnassignStock}
                disabled={removing}
              >
                {removing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Removing...
                  </>
                ) : (
                  "Remove"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
