'use client';

import { productService } from "@/services/product/productService";
import { branchService } from '@/app/management/branches/services/branch-service';
import type { Branch } from '@/app/management/branches/services/branch-service';
import Image from 'next/image';
import { useState, Fragment, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { EllipsisVertical, NotebookPen, Package, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import type { UIProduct, ProductVariant, ProductVariantSpecification } from '@/services/product/productService';
import { ProductDialog } from './ProductDialog';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useCallback } from "react";
import { useCurrency } from '@/contexts/CurrencyContext';
import { inventoryService } from '@/app/inventory/settings/services/inventoryService';
import type { InventoryVariant } from '@/app/inventory/settings/services/inventoryService';
import { monitorStockChange } from '@/lib/stockMonitor';


// 🧩 Props definition
interface ProductTableProps {
  products: UIProduct[];
  selectedProductIds: number[];
  onSelectionChange: (ids: number[]) => void;
  onDeleteProduct: (id: number) => void;
  onSaveProduct: (values: any, id?: number) => void;
  onRefresh?: () => void;
  onSortByName: () => void;
  sortDirection: 'asc' | 'desc' | null;
  isMounted: boolean;
  searchTerm?: string;
  onDeleteStock?: (stockId: number) => void;
}

// 🧮 Stock badge color helper for individual variants
function getVariantStockBadgeClass(quantity: number, threshold: number) {
  if (quantity === 0)
    return 'bg-red-100 text-red-600';
  if (quantity <= threshold)
    return 'bg-yellow-100 text-yellow-700';
  return 'bg-green-100 text-green-700';
}

// 🧮 Stock badge color helper for total quantity
function getStockBadgeClass(totalQuantity: number, product: UIProduct) {
  const lowStockThreshold = Math.max(
    ...(product.stocks?.map((s) => s.low_stock_threshold ?? 0) ?? [0])
  );
  if (totalQuantity === 0)
    return 'bg-red-100 text-red-600';
  if (totalQuantity <= lowStockThreshold)
    return 'bg-yellow-100 text-yellow-700';
  return 'bg-green-100 text-green-700';
}

// 🧮 Calculate total quantity for products
function getTotalQuantity(product: UIProduct) {
  if (!product.stocks || product.stocks.length === 0) return 0;

  // Sum quantities of all variant stocks
  const variantStocks = product.stocks.filter(stock => stock.variant_specification_id);
  if (variantStocks.length > 0) {
    return variantStocks.reduce((total, stock) => total + (stock.quantity || 0), 0);
  }

  // For single products, use the first stock quantity
  return product.stocks[0]?.quantity ?? 0;
}

// 🆕 --- Stock Adjustment Modal ---
export function StockAdjustmentModal({
  stock,
  open,
  onOpenChange,
  onSave,
}: {
  stock: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updated: any) => void;
}) {
  const { defaultCurrency } = useCurrency();
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [profitMargin, setProfitMargin] = useState<number | undefined>(0);
  const [stockQty, setStockQty] = useState<number>(0);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(0);
  const [errors, setErrors] = useState<{ quantity?: string; threshold?: string; price?: string }>({});
  const [pop, setPop] = useState(false);

  // --- Sync stock data on open ---
  useEffect(() => {
    if (stock) {
      setCostPrice(Number(stock.cost_price ?? stock.costPrice ?? stock.cost ?? 0));
      setSellingPrice(Number(stock.selling_price ?? stock.sellingPrice ?? stock.price ?? 0));
      setProfitMargin(stock.profit_margin ?? stock.profitMargin ?? undefined);
      setStockQty(stock.quantity ?? 0);
      setLowStockThreshold(stock.low_stock_threshold ?? stock.lowStockThreshold ?? 0);
      setErrors({}); // reset errors
    }
  }, [stock]);


  // --- Validation helper ---
  const validate = () => {
    const newErrors: { quantity?: string; threshold?: string; price?: string } = {};

    // 🧮 Quantity validation
    if (stockQty < 0) {
      newErrors.quantity = "Stock quantity cannot be negative.";
    } else if (stockQty === 0) {
      newErrors.quantity = "Stock quantity cannot be zero.";
    }

    // 💰 Price validation
    if (sellingPrice < 0) {
      newErrors.price = "Selling price cannot be negative.";
    } else if (sellingPrice < costPrice) {
      newErrors.price = "Selling price cannot be lower than cost price.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!stock) return;
    if (!validate()) return; // stop if invalid

    onSave({
      ...stock,
      cost_price: costPrice,
      selling_price: sellingPrice,
      profit_margin: profitMargin ?? 0,
      quantity: stockQty,
      low_stock_threshold: lowStockThreshold,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onInteractOutside={(e) => {
          e.preventDefault();
          setPop(true);
          setTimeout(() => setPop(false), 300);
        }}
        className="max-w-2xl"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={open ? "open" : "closed"}
            animate={pop ? { scale: [1, 1.05, 1] } : { scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <DialogHeader>
              <DialogTitle>
                Stock Adjustment —{" "}
                {stock?.variant_specification?.name || stock?.productName}
              </DialogTitle>
            </DialogHeader>

            {stock && (
              <div className="space-y-6 mt-4">
                {/* --- Product Pricing --- */}
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200">
                    Product Pricing
                  </h3>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Cost</label>
                      <Input
                        type="text"
                        value={`${defaultCurrency?.symbol || '₱'}${Number(costPrice || 0).toFixed(2)}`}
                        readOnly
                        className="cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Selling Price</label>
                      <Input
                        type="number"
                        value={sellingPrice}
                        min={0}
                        step="0.01"
                        placeholder="Enter selling price"
                        onChange={(e) => {
                          const raw = e.target.value;
                          const selling = raw === "" ? 0 : parseFloat(raw);

                          setSellingPrice(selling);

                          // Always recalc profit margin if cost exists
                          if (costPrice) {
                            const margin = ((selling - costPrice) / costPrice) * 100;
                            setProfitMargin(Number.isFinite(margin) ? +margin.toFixed(2) : undefined);
                          } else {
                            setProfitMargin(undefined);
                          }
                        }}
                        className="
                          focus-visible:ring-2
                          focus-visible:ring-blue-500
                          focus-visible:ring-offset-1
                          border-gray-300
                          dark:border-gray-600
                          focus:border-blue-500
                          dark:focus:border-blue-400
                          dark:focus-visible:ring-blue-400
                          transition-all
                          duration-150
                        "
                      />
                        {errors.price && (
                            <p className="text-xs text-red-500 mt-1">{errors.price}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Profit Margin (%)</label>
                      <Input
                        type="text"
                        value={profitMargin !== undefined ? `${profitMargin}%` : ""}
                        placeholder="0%"
                        onChange={(e) => {
                          const raw = e.target.value.replace("%", "").trim();
                          const margin = Number(raw);

                          setProfitMargin(isNaN(margin) ? undefined : Math.max(0, margin));

                          // Recalculate selling price only if cost price > 0
                          if (costPrice > 0 && margin !== undefined) {
                            const selling = costPrice + (costPrice * margin) / 100;
                            setSellingPrice(Number.isFinite(selling) ? +selling.toFixed(2) : 0);
                          }
                        }}
                        className="
                          focus-visible:ring-2
                          focus-visible:ring-blue-500
                          focus-visible:ring-offset-1
                          border-gray-300
                          dark:border-gray-600
                          focus:border-blue-500
                          dark:focus:border-blue-400
                          dark:focus-visible:ring-blue-400
                          transition-all
                          duration-150
                        "
                      />
                    </div>
                  </div>
                </div>

                {/* --- Product Stocks --- */}
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200">
                    Product Stocks
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                  {/* Stock Quantity */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Stock Quantity</label>
                    <Input
                      type="number"
                      value={stockQty === 0 ? "" : stockQty}
                      placeholder="Enter stock amount"
                      min={0}
                      onFocus={(e) => {
                        if (e.target.value === "0") e.target.value = "";
                      }}
                      onBlur={(e) => {
                        if (e.target.value === "") setStockQty(0);
                      }}
                      onKeyDown={(e) => {
                        // Prevent typing negative sign or scientific notation
                        if (e.key === "-" || e.key === "e" || e.key === "E") {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        // Prevent setting negative numbers
                        if (value < 0) return;
                        setStockQty(value || 0);
                      }}
                      className="
                        focus-visible:ring-2
                        focus-visible:ring-blue-500
                        focus-visible:ring-offset-1
                        border-gray-300
                        dark:border-gray-600
                        focus:border-blue-500
                        dark:focus:border-blue-400
                        dark:focus-visible:ring-blue-400
                        transition-all
                        duration-150
                      "
                    />
                    {errors.quantity && (
                      <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>
                    )}
                  </div>

                    {/* Low Stock Threshold */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Low Stock Threshold</label>
                      <Input
                        type="number"
                        value={lowStockThreshold === 0 ? "" : lowStockThreshold}
                        placeholder="Enter threshold"
                        min={0}
                        onFocus={(e) => {
                          if (e.target.value === "0") e.target.value = "";
                        }}
                        onBlur={(e) => {
                          if (e.target.value === "") setLowStockThreshold(0);
                          else setLowStockThreshold(Number(e.target.value));
                        }}
                        onChange={(e) => {
                          const val = e.target.value;
                          // Allow empty input while typing
                          if (val === "") {
                            setLowStockThreshold(0);
                            return;
                          }

                          // Parse numeric input safely
                          const num = parseFloat(val);
                          if (!isNaN(num)) setLowStockThreshold(num);
                        }}
                        className="
                          focus-visible:ring-2
                          focus-visible:ring-blue-500
                          focus-visible:ring-offset-1
                          border-gray-300
                          dark:border-gray-600
                          focus:border-blue-500
                          dark:focus:border-blue-400
                          dark:focus-visible:ring-blue-400
                          transition-all
                          duration-150
                        "
                      />
                      {errors.threshold && (
                        <p className="text-xs text-red-500 mt-1">{errors.threshold}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="mt-6 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </DialogFooter>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}


// 🧩 Variant Expanded Row for Product Variants
function ProductVariantExpandedRow({ product }: { product: UIProduct }) {
  const variantStocks = product.stocks?.filter(stock => stock.variant_specification_id) || [];

  return (
    <TableRow className="bg-muted">
      <TableCell colSpan={9} className="p-0">
        <div className="px-6 py-4 border-l-2 border-primary/20 bg-muted/40 rounded-md space-y-4 text-sm text-foreground">
          <div className="bg-card border border-border rounded-lg p-4 shadow-sm space-y-3">
            <h4 className="font-semibold text-base text-primary flex items-center gap-2">
              Variant Specifications
            </h4>
            {variantStocks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {variantStocks.map((stock, idx) => (
                  <div
                    key={idx}
                    className="bg-muted/50 border border-border rounded-lg p-3 text-center"
                  >
                    <span className="font-medium">{stock.variant_specification?.name || 'Unknown'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No variant specifications available</p>
            )}
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

// 🧩 Add Variant Modal
function AddVariantModal({
  open,
  onOpenChange,
  productId,
  product,
  onVariantAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: number;
  product: UIProduct;
  onVariantAdded: () => void;
}) {
  const [variantAttributes, setVariantAttributes] = useState<Array<{ name: string; variations: { id: number; value: string }[] }>>([]);
  const [newAttribute, setNewAttribute] = useState("");
  const [newVariations, setNewVariations] = useState<string[]>([]);
  const [selectedVariations, setSelectedVariations] = useState<Array<{ id: number; name: string; costPrice: number; sellingPrice: number; profitMargin: number | undefined; stock: number; lowStockThreshold: number; isExisting?: boolean }>>([]);
  const [popVariant, setPopVariant] = useState(false);
  const [loading, setLoading] = useState(false);
  const [productLowStockThreshold, setProductLowStockThreshold] = useState<number>(0);
  const { toast } = useToast();

  // Fetch variant attributes and product low stock threshold
  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        try {
          // Get the product's current low stock threshold
          const existingThreshold = product.stocks?.[0]?.low_stock_threshold || 0;
          setProductLowStockThreshold(existingThreshold);

          // Check if this is a variant product
          const isVariantProduct = product.stocks && product.stocks.some(stock => stock.variant_specification_id || stock.variant_specification);

          // Always fetch variants for the modal
          const variants = await inventoryService.getVariants();
          const formattedVariants = variants.map(v => ({
            name: v.name,
            variations: v.specifications.map(s => ({
              id: s.id,
              value: s.name,
            })),
          }));
          setVariantAttributes(formattedVariants);

          if (isVariantProduct && product.stocks) {
            // For variant products, pre-populate existing variations and set the variant attribute
            const variantStocks = product.stocks.filter(stock => stock.variant_specification_id || stock.variant_specification);

            // Find the variant attribute from the first variant stock
            const firstVariantStock = variantStocks[0];
            console.log('First variant stock:', firstVariantStock);
            console.log('Variant spec:', firstVariantStock?.variant_specification);

            const specId = firstVariantStock?.variant_specification?.id || firstVariantStock?.variant_specification_id;
            console.log('Looking for spec ID:', specId);

            if (specId) {
              const foundVariant = variants.find(v =>
                v.specifications.some(s => s.id === specId)
              );
              if (foundVariant) {
                setNewAttribute(foundVariant.name);
                console.log('Found variant by spec ID:', foundVariant.name);
              } else {
                console.warn('Could not find variant for spec ID:', specId);
                // Try to find by variant ID if spec ID doesn't work
                const variantId = firstVariantStock?.variant_specification?.variant?.id;
                if (variantId) {
                  const foundByVariantId = variants.find((v: any) => v.id === variantId);
                  if (foundByVariantId) {
                    setNewAttribute(foundByVariantId.name);
                    console.log('Found variant by variant ID:', foundByVariantId.name);
                  }
                }
              }
            } else {
              console.warn('No variant_specification_id or variant_specification.id found');
            }

            const existingVariations = variantStocks.map(stock => ({
              id: stock.variant_specification_id || stock.variant_specification?.id!,
              name: stock.variant_specification?.name || 'Unknown',
              costPrice: stock.cost || 0,
              sellingPrice: stock.selling_price || 0,
              profitMargin: stock.profit_margin || 0,
              stock: stock.quantity || 0,
              lowStockThreshold: stock.low_stock_threshold || existingThreshold,
              isExisting: true, // Mark as existing variant
            }));

            setSelectedVariations(existingVariations);
          } else {
            // For single products, start with empty variations
            setSelectedVariations([]);
            setNewAttribute("");
          }

        } catch (error) {
          console.error('Failed to fetch data:', error);
          toast({
            title: 'Error',
            description: 'Failed to load variants.',
            variant: 'destructive',
          });
        }
      };
      fetchData();
    }
  }, [open, product.stocks, toast]);


  const handleAddVariant = async () => {
    if (selectedVariations.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one variation.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Create stocks only for new variations (not existing ones)
      const stocksToCreate = selectedVariations
        .filter(v => !v.isExisting) // Only include new variations
        .map(v => ({
          cost: Number(v.costPrice) || 0,
          profit_margin: Number(v.profitMargin) || 0,
          selling_price: Number(v.sellingPrice) || 0,
          quantity: Number(v.stock) || 0,
          low_stock_threshold: Number(v.lowStockThreshold) || 0,
          variant_specification_id: v.id,
        }));

      // For variant products, send all stocks (existing + new)
      // For single products, replace the single stock with variant stocks
      const isSingleProduct = product.stocks?.length === 1 && !product.stocks[0].variant_specification_id;

      let stocksToUpdate;
      if (isSingleProduct) {
        // Convert single product to variant: replace single stock with variant stocks
        stocksToUpdate = stocksToCreate;
      } else {
        // Add to existing variant product: only send new stocks
        // Existing stocks should not be included to avoid conflicts
        stocksToUpdate = stocksToCreate;
      }

      // Use a single approach for both single and variant products
      // For variant products, only send new stocks to avoid duplication
      const stocksToSend = !isSingleProduct ? stocksToCreate : stocksToUpdate;

      const updatePayload = {
        name: product.name,
        branch_id: product.branch_id || 1,
        tenant_id: product.tenant_id || 1,
        stocks: stocksToSend,
      };

      await productService.update(productId, updatePayload);

      toast({
        title: 'Success',
        description: isSingleProduct
          ? 'Variant added successfully. Product converted to variant product.'
          : 'Variant added successfully.',
        variant: 'success',
      });

      // Force refresh and close modal
      onVariantAdded();

      // Force notification refresh for new variants
      window.dispatchEvent(new CustomEvent('stockUpdated'));

      onOpenChange(false);
      setSelectedVariations([]);
      setNewAttribute("");
      setNewVariations([]);
      setProductLowStockThreshold(0);
    } catch (error) {
      console.error('Failed to add variant:', error);
      toast({
        title: 'Error',
        description: 'Failed to add variant.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          e.preventDefault();
          setPopVariant(true);
          setTimeout(() => setPopVariant(false), 300);
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={open ? "open" : "closed"}
            animate={popVariant ? { scale: [1, 1.05, 1] } : { scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <DialogHeader>
              <DialogTitle>Add Variant - {product.name}</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Product Stocks for Variants */}
              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-200">Product Stocks</h3>
                <div className="grid grid-cols-1 gap-4 mt-2">
                  {/* Low Stock Threshold */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Low Stock Threshold</label>
                    <Input
                      type="number"
                      placeholder="e.g. 10"
                      min={0}
                      value={productLowStockThreshold}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const threshold = raw === "" ? 0 : parseInt(raw);
                        const safeThreshold = threshold >= 0 ? threshold : 0;

                        setProductLowStockThreshold(safeThreshold);

                        // Update low stock threshold for all variations
                        setSelectedVariations((prev) =>
                          prev.map((v) => ({ ...v, lowStockThreshold: safeThreshold }))
                        );
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      This threshold will apply to all variations of this product
                    </p>
                  </div>
                </div>
              </div>

              {/* Attribute Definition */}
              <div className="w-full space-y-4">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200">
                  Attribute Definition
                </h3>

                <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
                  <div className="flex gap-4">
                    {/* Variant Attribute Selector */}
                    <div className="w-1/2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Variant</label>
                        <div className="flex gap-2">
                          <select
                            className={`w-full border rounded-md p-2 ${
                              product.stocks?.some(stock => stock.variant_specification_id)
                                ? "bg-gray-50 cursor-not-allowed opacity-50"
                                : ""
                            }`}
                            value={newAttribute}
                            disabled={product.stocks?.some(stock => stock.variant_specification_id)} // Only disabled for variant products
                            onChange={(e) => {
                              // Only allow changes for single products
                              if (!product.stocks?.some(stock => stock.variant_specification_id)) {
                                setNewAttribute(e.target.value);
                                setSelectedVariations([]);
                              }
                            }}
                          >
                            <option value="">
                              {newAttribute ? newAttribute : "Select Variant Attribute"}
                            </option>
                            {variantAttributes.map((attr, idx) => (
                              <option key={idx} value={attr.name}>
                                {attr.name}
                              </option>
                            ))}
                          </select>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={product.stocks?.some(stock => stock.variant_specification_id)} // Disable for variant products
                            title={
                              product.stocks?.some(stock => stock.variant_specification_id)
                                ? "Create new variant attribute (disabled for variant products)"
                                : "Create new variant attribute"
                            }
                          >
                            +
                          </Button>
                        </div>
                        {newAttribute && (
                          <p className="text-xs text-muted-foreground">
                            {product.stocks?.some(stock => stock.variant_specification_id)
                              ? "Cannot change variant type for existing variant products"
                              : "Select a variant attribute to add specifications"}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Specification Selector - Only show for adding new variants to variant products */}
                    {newAttribute && product.stocks?.some(stock => stock.variant_specification_id) && (
                      <div className="w-1/2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Add Specification</label>
                          <select
                            className="w-full border rounded-md p-2"
                            value=""
                            onChange={(e) => {
                              const selectedId = Number(e.target.value);
                              const selectedVariation = variantAttributes
                                .find((attr) => attr.name === newAttribute)
                                ?.variations.find((v) => v.id === selectedId);

                              if (
                                selectedVariation &&
                                !selectedVariations.find((v) => v.id === selectedVariation.id)
                              ) {
                                setSelectedVariations((prev) => [
                                  ...prev,
                                  {
                                    id: selectedVariation.id,
                                    name: selectedVariation.value,
                                    costPrice: 0,
                                    sellingPrice: 0,
                                    profitMargin: 0,
                                    stock: 0,
                                    lowStockThreshold: productLowStockThreshold,
                                    isExisting: false, // Mark as new variant
                                  },
                                ]);
                              }
                            }}
                          >
                            <option value="">Select Variation</option>
                            {variantAttributes
                              .find((attr) => attr.name === newAttribute)
                              ?.variations
                              .filter(v => !selectedVariations.find(sv => sv.id === v.id)) // Only show unused variations
                              .map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.value}
                                </option>
                              ))}
                          </select>
                          <p className="text-xs text-muted-foreground">
                            Add new specifications to this variant product
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Specification Selector - Show for single products */}
                    {newAttribute && !product.stocks?.some(stock => stock.variant_specification_id) && (
                      <div className="w-1/2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Specification</label>
                          <select
                            className="w-full border rounded-md p-2"
                            value=""
                            onChange={(e) => {
                              const selectedId = Number(e.target.value);
                              const selectedVariation = variantAttributes
                                .find((attr) => attr.name === newAttribute)
                                ?.variations.find((v) => v.id === selectedId);

                              if (
                                selectedVariation &&
                                !selectedVariations.find((v) => v.id === selectedVariation.id)
                              ) {
                                setSelectedVariations((prev) => [
                                  ...prev,
                                  {
                                    id: selectedVariation.id,
                                    name: selectedVariation.value,
                                    costPrice: 0,
                                    sellingPrice: 0,
                                    profitMargin: 0,
                                    stock: 0,
                                    lowStockThreshold: productLowStockThreshold,
                                    isExisting: false, // Mark as new variant
                                  },
                                ]);
                              }
                            }}
                          >
                            <option value="">Select Variation</option>
                            {variantAttributes
                              .find((attr) => attr.name === newAttribute)
                              ?.variations.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.value}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
              {/* Variations Table */}
              {selectedVariations.length > 0 && (
                <div className="w-full space-y-4">
                  <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
                    {/* Table Header */}
                    <div className="flex gap-2 font-semibold text-gray-700 items-center">
                      <span className="w-1/6">Variation</span>
                      <span className="w-1/6">Cost</span>
                      <span className="w-1/6">Selling Price</span>
                      <span className="w-1/6">Profit Margin (%)</span>
                      <span className="w-1/6">Stock</span>
                      <span className="w-1/6 text-center">Actions</span>
                    </div>

                    {selectedVariations.map((v, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        {/* Variation Name */}
                        <span className="w-1/6">{v.name}</span>

                        {/* Cost Price */}
                        <Input
                          type="number"
                          placeholder="0.00"
                          className={v.isExisting ? "w-1/6 cursor-not-allowed bg-gray-50" : "w-1/6"}
                          value={v.costPrice !== undefined ? String(v.costPrice) : ""}
                          readOnly={v.isExisting}
                          onChange={(e) => {
                            if (v.isExisting) return; // Prevent editing existing variants
                            const raw = e.target.value;
                            const cost = raw === "" ? undefined : parseFloat(raw);

                            setSelectedVariations((prev) => {
                              const updated = [...prev];
                              updated[idx].costPrice = cost && cost > 0 ? cost : 0;

                              // If profit margin exists → recalc selling price
                              if (updated[idx].profitMargin !== undefined && cost) {
                                const selling = cost + (cost * updated[idx].profitMargin) / 100;
                                updated[idx].sellingPrice = Number.isFinite(selling) ? +selling.toFixed(2) : 0;
                              } else {
                                // If no profit margin → default selling = cost
                                updated[idx].sellingPrice = cost || 0;
                              }

                              return updated;
                            });
                          }}
                        />

                        {/* Selling Price */}
                        <Input
                          type="number"
                          placeholder="0.00"
                          className={v.isExisting ? "w-1/6 cursor-not-allowed bg-gray-50" : "w-1/6"}
                          value={v.sellingPrice !== undefined ? String(v.sellingPrice) : ""}
                          readOnly={v.isExisting}
                          onChange={(e) => {
                            if (v.isExisting) return; // Prevent editing existing variants
                            const raw = e.target.value;
                            const selling = raw === "" ? undefined : parseFloat(raw);

                            setSelectedVariations((prev) => {
                              const updated = [...prev];
                              updated[idx].sellingPrice = selling && selling > 0 ? selling : 0;

                              // Always recalc profit margin if cost exists
                              const cost = updated[idx].costPrice;
                              if (cost) {
                                const margin = ((updated[idx].sellingPrice - cost) / cost) * 100;
                                updated[idx].profitMargin = Number.isFinite(margin)
                                  ? +margin.toFixed(2)
                                  : undefined;
                              } else {
                                updated[idx].profitMargin = undefined;
                              }

                              return updated;
                            });
                          }}
                        />

                        {/* Profit Margin */}
                        <div className="relative w-1/6">
                          <Input
                            type="text"
                            placeholder="0%"
                            className={v.isExisting ? "w-full pr-6 cursor-not-allowed bg-gray-50" : "w-full pr-6"}
                            value={v.profitMargin !== undefined ? `${v.profitMargin}%` : ""}
                            readOnly={v.isExisting}
                            onChange={(e) => {
                              if (v.isExisting) return; // Prevent editing existing variants
                              const raw = e.target.value.replace("%", "").trim();
                              const margin = Number(raw);

                              setSelectedVariations((prev) => {
                                const updated = [...prev];
                                updated[idx].profitMargin = isNaN(margin) ? undefined : Math.max(0, margin);

                                // Recalculate selling price
                                const cost = updated[idx].costPrice;
                                if (cost !== undefined && updated[idx].profitMargin !== undefined) {
                                  const selling = cost + (cost * updated[idx].profitMargin) / 100;
                                  updated[idx].sellingPrice = Number.isFinite(selling) ? +selling.toFixed(2) : 0;
                                }
                                return updated;
                              });
                            }}
                          />
                        </div>

                        {/* Stock */}
                        <Input
                          type="number"
                          placeholder="0"
                          className={v.isExisting ? "w-1/6 cursor-not-allowed bg-gray-50" : "w-1/6"}
                          value={v.stock !== undefined ? String(v.stock) : ""}
                          readOnly={v.isExisting}
                          onChange={(e) => {
                            if (v.isExisting) return; // Prevent editing existing variants
                            const raw = e.target.value;
                            const stock = raw === "" ? 0 : parseInt(raw);

                            setSelectedVariations((prev) => {
                              const updated = [...prev];
                              updated[idx].stock = stock >= 0 ? stock : 0;
                              return updated;
                            });
                          }}
                        />

                        {/* Delete button - only show for new variants */}
                        {!v.isExisting && (
                          <div className="w-1/6 flex justify-center">
                            <button
                              type="button"
                              onClick={() => setSelectedVariations((prev) => prev.filter((_, i) => i !== idx))}
                              className="p-2 rounded-md text-red-600 hover:bg-red-100">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        {v.isExisting && <div className="w-1/6"></div>} {/* Empty space for existing variants */}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddVariant} disabled={loading}>
                {loading ? 'Adding...' : 'Add Variant'}
              </Button>
            </DialogFooter>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

// 🧩 Expanded Row
function ProductExpandedRow({
  product,
  onAdjustStock,
  onDeleteStock,
}: {
  product: UIProduct;
  onAdjustStock: (stock: any) => void;
  onDeleteStock: (stockId: number) => void;
}) {
  const { defaultCurrency } = useCurrency();
  const totalQuantity = getTotalQuantity(product);

  const isSingleProduct = product.stocks?.length === 1 && !product.stocks[0].variant_specification_id;

  return (
    <TableRow className="bg-muted">
      <TableCell colSpan={9} className="p-0">
        <div className="px-6 py-4 border-l-2 border-primary/20 bg-muted/40 rounded-md space-y-6 text-sm text-foreground">

          {/* Stocks Section */}
          {product.stocks && product.stocks.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-base text-blue-600 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Variants
              </h4>
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-5 gap-4 p-3 bg-muted/50 font-medium text-sm border-b">
                  <div>Variation</div>
                  <div>Cost</div>
                  <div>Selling Price</div>
                  <div>Quantity</div>
                  <div className="text-center">Actions</div>
                </div>
                {/* Table Body */}
                <div className="divide-y">
                  {product.stocks.map((stock, idx) => (
                    <div key={idx} className="grid grid-cols-5 gap-4 p-3 items-center">
                      {/* Variation */}
                      <div className="font-medium">
                        {stock.variant_specification?.name || 'Single Product'}
                      </div>

                      {/* Cost */}
                      <div className="text-sm text-muted-foreground">
                        {defaultCurrency?.symbol || '₱'}{Number(stock.cost).toFixed(2)}
                      </div>

                      {/* Selling Price */}
                      <div className="text-sm text-muted-foreground">
                        {defaultCurrency?.symbol || '₱'}{Number(stock.selling_price).toFixed(2)}
                      </div>

                      {/* Quantity */}
                      <div>
                        <Badge className={getVariantStockBadgeClass(stock.quantity || 0, stock.low_stock_threshold || 0)}>
                          {stock.quantity || 0}
                        </Badge>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <EllipsisVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onAdjustStock(stock)}>
                              Stock Adjustment
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDeleteStock(stock.id)}
                              disabled={isSingleProduct}
                              className="text-destructive focus:text-destructive"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

// 🧩 Product Row
function ProductRow({
  product,
  selected,
  onSelect,
  onDelete,
  onSave,
  onRefresh = () => {},
  onDeleteStock,
  isOpen,
  toggleOpen,
  isVariantExpanded,
  toggleVariantExpanded,
  branches,
}: {
  product: UIProduct;
  selected: boolean;
  onSelect: (id: number, checked: boolean) => void;
  onDelete: (id: number) => void;
  onSave: (values: any, id?: number) => void;
  onRefresh?: () => void;
  onDeleteStock: (stockId: number) => void;
  isOpen: boolean;
  toggleOpen: () => void;
  isVariantExpanded: boolean;
  toggleVariantExpanded: () => void;
  branches: Branch[];
}) {
  const { defaultCurrency } = useCurrency();
  const totalQuantity =
    product.stocks?.reduce((sum, s) => sum + s.quantity, 0) ?? 0;

  const hasVariants = product.stocks && product.stocks.length > 1;
  const variantCount = product.stocks?.filter(stock => stock.variant_specification_id).length || 0;
  const actualVariantCount = product.stocks?.length || 0; // Use the same logic as ProductExpandedRow

  // Get unique variant attribute names
  const variantAttributeNames = product.stocks
    ?.filter(stock => stock.variant_specification_id)
    .map(stock => stock.variant_specification?.variant?.name)
    .filter((name, index, arr) => name && arr.indexOf(name) === index) || [];

  // Helper function to get branch name - uses product.branch if available, otherwise looks up from branches array
  const getBranchName = (product: UIProduct) => {
    // First try to use branch info directly from product (comes from API)
    if (product.branch?.name) {
      return product.branch.name;
    }
    // Fallback to looking up from branches array
    const branchId = product.branch_id || product.branch?.id;
    if (branchId) {
      const branch = branches.find(b => b.id === branchId);
      return branch?.name || '-';
    }
    return '-';
  };

  const [selectedStock, setSelectedStock] = useState<any | null>(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isAddVariantModalOpen, setIsAddVariantModalOpen] = useState(false);
  const { toast } = useToast();

  const handleAdjustStock = (stock: any) => {
    setSelectedStock({
      ...stock,
      productName: product.name,
    });
    setIsStockModalOpen(true);
  };

  const handleSaveAdjustment = async (updatedStock: any) => {
    try {
      console.log("Saving stock adjustment:", updatedStock);

      // 🧩 Call Laravel PATCH endpoint
      await productService.updateStock(updatedStock.id, {
        cost_price: updatedStock.cost_price,
        selling_price: updatedStock.selling_price,
        profit_margin: updatedStock.profit_margin,
        quantity: updatedStock.quantity,
        low_stock_threshold: updatedStock.low_stock_threshold,
      });

      // ✅ Success toast
      toast({
        title: "Stock Updated",
        description: `${updatedStock.productName || "Product"} stock has been successfully adjusted.`,
        variant: "success",
      });

      // ✅ Refresh products list
      if (onRefresh) {
        await onRefresh();
      }

      // ✅ Monitor stock changes
      const { product: updatedProduct } = await productService.getById(product.id);
      monitorStockChange(updatedProduct);

      // ✅ Force notification refresh
      window.dispatchEvent(new CustomEvent('stockUpdated'));
    } catch (error) {
      console.error("Failed to update stock:", error);

      // ❌ Error toast
      toast({
        title: "Update Failed",
        description: "Something went wrong while updating the stock. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Fragment>
      {/* Main Row */}
      <TableRow
        data-state={selected ? 'selected' : undefined}
        className="cursor-pointer hover:bg-muted/50"
        onClick={toggleOpen}
      >
        <TableCell>
          <div className="aspect-square w-12 relative">
            <Image
              src={product.image || '/placeholder.png'}
              alt={product.name}
              fill
              className="rounded-md border object-cover"
              unoptimized
            />
          </div>
        </TableCell>

        <TableCell className="font-medium">
          {product.name}
        </TableCell>

        <TableCell>{getBranchName(product)}</TableCell>

        <TableCell>
          <Badge variant="outline">{product.categoryName || 'No Category'}</Badge>
        </TableCell>

        <TableCell>
          {hasVariants ? (
            <div className="flex items-center gap-1 cursor-pointer hover:text-primary">
              <ChevronDown className="w-4 h-4" />
            </div>
          ) : (
            product.stocks?.[0]?.selling_price ? `${defaultCurrency?.symbol || '₱'}${Number(product.stocks[0].selling_price).toFixed(2)}` : '-'
          )}
        </TableCell>

        <TableCell>
          {hasVariants ? `Variant (${actualVariantCount})` : 'Single Product'}
        </TableCell>

        <TableCell>
          <Badge className={getStockBadgeClass(totalQuantity, product)}>
            {totalQuantity}
          </Badge>
        </TableCell>

        <TableCell onClick={(e) => e.stopPropagation()}>
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <EllipsisVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsAddVariantModalOpen(true)}>
                  Add Variant
                </DropdownMenuItem>
                {!hasVariants && (
                  <DropdownMenuItem onClick={() => handleAdjustStock(product.stocks?.[0])}>
                    Stock Adjustment
                  </DropdownMenuItem>
                )}
                <ProductDialog product={product} onSave={onSave} onRefresh={onRefresh}>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    Edit Product
                  </DropdownMenuItem>
                </ProductDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-destructive focus:text-destructive">
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete "
                  {product.name}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(product.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TableCell>
      </TableRow>

      {hasVariants && isVariantExpanded && <ProductVariantExpandedRow product={product} />}

      {hasVariants && isOpen && <ProductExpandedRow product={product} onAdjustStock={handleAdjustStock} onDeleteStock={onDeleteStock} />}

      <StockAdjustmentModal
        stock={selectedStock}
        open={isStockModalOpen}
        onOpenChange={setIsStockModalOpen}
        onSave={handleSaveAdjustment}
      />

      <AddVariantModal
        open={isAddVariantModalOpen}
        onOpenChange={setIsAddVariantModalOpen}
        productId={product.id}
        product={product}
        onVariantAdded={async () => {
          console.log('Variant added, refreshing...');
          try {
            // Force a complete refresh by reloading the page data
            if (onRefresh) {
              await onRefresh();
              console.log('Refresh completed');
            }
          } catch (error) {
            console.error('Error during refresh:', error);
          }
        }}
      />
    </Fragment>
  );
}

// 🧩 Main Product Table
export function ProductTable({
  products,
  selectedProductIds,
  onSelectionChange,
  onDeleteProduct,
  onSaveProduct,
  onRefresh,
  onSortByName,
  sortDirection,
  isMounted,
  searchTerm,
  onDeleteStock,
}: ProductTableProps) {
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [expandedVariantId, setExpandedVariantId] = useState<number | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Fetch branches for branch name display (fetch all branches, not just first page)
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        // Fetch all branches by using a large per_page value
        const response = await branchService.getAll(1, 1000);
        setBranches(response.branches);
      } catch (error) {
        console.error('Failed to fetch branches:', error);
        setBranches([]);
      }
    };
    fetchBranches();
  }, []);

  // Helper function to get branch name - uses product.branch if available, otherwise looks up from branches array
  const getBranchName = (product: UIProduct) => {
    // First try to use branch info directly from product (comes from API)
    if (product.branch?.name) {
      return product.branch.name;
    }
    // Fallback to looking up from branches array
    const branchId = product.branch_id || product.branch?.id;
    if (branchId) {
      const branch = branches.find(b => b.id === branchId);
      return branch?.name || '-';
    }
    return '-';
  };

  const updateSelection = (ids: number[], mode: 'add' | 'remove') => {
    if (mode === 'add')
      onSelectionChange([...new Set([...selectedProductIds, ...ids])]);
    else onSelectionChange(selectedProductIds.filter((id) => !ids.includes(id)));
  };

  const isAllSelected =
    selectedProductIds.length > 0 &&
    products.length > 0 &&
    products.every((p) => selectedProductIds.includes(p.id));

  return (
    <Card>
      <CardContent className="p-0">
        {!isMounted ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>Loading products...</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] text-center">Image</TableHead>
                  <TableHead className="text-left">Name</TableHead>
                  <TableHead className="text-left">Branch</TableHead>
                  <TableHead className="text-left">Category</TableHead>
                  <TableHead className="text-left">Selling Price</TableHead>
                  <TableHead className="text-left">Variant Types</TableHead>
                  <TableHead className="text-left">Quantity</TableHead>
                  <TableHead className="w-[50px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {products.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    selected={selectedProductIds.includes(product.id)}
                    onSelect={(id, c) =>
                      updateSelection([id], c ? 'add' : 'remove')
                    }
                    onDelete={onDeleteProduct}
                    onSave={onSaveProduct}
                    onRefresh={onRefresh}
                    onDeleteStock={onDeleteStock || (() => {})}
                    isOpen={expandedRowId === product.id}
                    toggleOpen={() =>
                      setExpandedRowId((prev) =>
                        prev === product.id ? null : product.id
                      )
                    }
                    isVariantExpanded={expandedVariantId === product.id}
                    toggleVariantExpanded={() =>
                      setExpandedVariantId((prev) =>
                        prev === product.id ? null : product.id
                      )
                    }
                    branches={branches}
                  />
                ))}
              </TableBody>
            </Table>

          </>
        )}
      </CardContent>
    </Card>
  );
}
