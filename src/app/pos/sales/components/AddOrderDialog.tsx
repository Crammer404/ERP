'use client';

import { useState, useMemo, useEffect, useCallback, useContext } from 'react';
import Image from 'next/image';
import { Minus, Plus } from 'lucide-react';
import type { Product as CartProduct, DiscountType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Product as PosProduct, Stock as PosStock, StockDiscount, Category } from '../hooks/useProducts';
import VariantSelector from './VariantSelector';
import DiscountSelector from './DiscountSelector';
import { CartContext } from '@/components/providers/cart-provider';
import { useCurrency } from '@/contexts/CurrencyContext';

/* --------------------------------
   Main Dialog Component
----------------------------------*/

type AddOrderDialogProps = {
  product: PosProduct | null; // Product passed into the dialog
  isOpen: boolean; // Controls whether dialog is visible
  onOpenChange: (isOpen: boolean) => void; // Function to toggle dialog
  onAddToCart: ( // Callback for when item is added to cart
    product: CartProduct,
    quantity: number,
    discountType: DiscountType,
    discountValue: number,
    percentageDiscounts: number[],
    fixedDiscounts: number[],
    stockDiscountIds: number[]
  ) => void;
};

const AddOrderDialog = ({ product, isOpen, onOpenChange, onAddToCart }: AddOrderDialogProps) => {
  const { items: cartItems } = useContext(CartContext)!;
  const { defaultCurrency } = useCurrency();
  const [quantity, setQuantity] = useState(1);
  const [selectedStockId, setSelectedStockId] = useState<number | null>(null);
  const [selectedStockDiscountIds, setSelectedStockDiscountIds] = useState<number[]>([]);

  const selectedStock: PosStock | undefined = useMemo(() => {
    if (!product?.stocks) return undefined;
    return product.stocks.find((s) => s.id === selectedStockId) ?? product.stocks[0];
  }, [product, selectedStockId]);

  const remainingStock = useMemo(() => {
    if (!selectedStock) return 0;
    const inCart = cartItems
      .filter((item) => item.id === selectedStock.id)
      .reduce((sum, item) => sum + item.quantity, 0);
    return Math.max(0, selectedStock.quantity - inCart);
  }, [selectedStock, cartItems]);

  const selectedPercentDiscounts = useMemo(() => {
    if (!selectedStock?.stockDiscounts) return [];
    return selectedStock.stockDiscounts
      .filter((sd) => selectedStockDiscountIds.includes(sd.id))
      .map((sd) => sd.discount.value_in_percentage)
      .filter((p): p is number => p != null);
  }, [selectedStock, selectedStockDiscountIds]);

  const selectedFixedDiscounts = useMemo(() => {
    if (!selectedStock?.stockDiscounts) return [];
    return selectedStock.stockDiscounts
      .filter((sd) => selectedStockDiscountIds.includes(sd.id))
      .map((sd) => sd.discount.value ? parseFloat(sd.discount.value) : null)
      .filter((v): v is number => v != null);
  }, [selectedStock, selectedStockDiscountIds]);

  const cartDiscountUsages = useMemo(() => {
    const usages: Record<number, number> = {};
    cartItems.forEach((item) => {
      item.stockDiscountIds?.forEach((discountId) => {
        usages[discountId] = (usages[discountId] || 0) + 1;
      });
    });
    return usages;
  }, [cartItems]);

  useEffect(() => {
    if (!selectedStock) return;
    setQuantity((q) => Math.max(1, Math.min(q, remainingStock)));
  }, [selectedStock, remainingStock]);

  useEffect(() => {
    if (!product) return;
    resetForm();
  }, [product]);

  useEffect(() => {
    if (isOpen && product) {
      resetForm();
    }
  }, [isOpen, product]);

  const resetForm = () => {
    setQuantity(1);
    setSelectedStockId(product?.stocks?.[0]?.id ?? null);
    setSelectedStockDiscountIds([]);
  };

  const toggleDiscount = useCallback(
    (stockDiscountId: number, percentage?: number, value?: number) => {
      setSelectedStockDiscountIds((prev) =>
        prev.includes(stockDiscountId)
          ? prev.filter((id) => id !== stockDiscountId)
          : [...prev, stockDiscountId]
      );
    },
    []
  );

  const handleAdd = () => {
    if (!product || !selectedStock) return;

    const productForCart: CartProduct = {
      id: selectedStock.id,
      name: `${product.name}${selectedStock.variant ? ` (${selectedStock.variant})` : ''}`,
      price: selectedStock.sellingPrice,
      cost: selectedStock.cost,
      image: product.image || '/placeholder.png',
      category: product.category.name,
      stock: selectedStock.quantity,
      stocks: undefined,
      description: product.description,
      brandName: undefined,
      categoryName: product.category.name,
      stockDiscountIds: selectedStock.stockDiscounts
        .filter((sd) => selectedStockDiscountIds.includes(sd.id))
        .map((sd) => sd.discount.id), // ✅ discount IDs
    };

    onAddToCart(
      productForCart,
      quantity,
      'none',
      0,
      selectedPercentDiscounts,
      selectedFixedDiscounts,
      productForCart.stockDiscountIds || []
    );

    onOpenChange(false);
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-1xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <DialogTitle></DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 overflow-hidden">
          {/* Product Details */}
          <div className="flex-1 space-y-4">
            {/* Product Image, Name, Category, and Price */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                  <Image
                    src={product.image || '/placeholder.png'}
                    alt={product.name}
                    fill
                    className="object-contain bg-muted"
                    unoptimized
                  />
                </div>
                {selectedStock && (
                  <div className="text-2xl font-bold text-primary">
                    {defaultCurrency?.symbol || '₱'}{selectedStock.sellingPrice.toFixed(2)}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="text-xl font-semibold">{product.name}</div>
                <div className="text-xs text-muted-foreground">{product.category.name}</div>
                {/* Quantity Input */}
                {selectedStock && (
                  <div className="space-y-2 mt-2">
                    <Label>Quantity</Label>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="h-6 w-6 p-0"
                      >
                        <Minus className="h-2.5 w-2.5" />
                      </Button>
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 1;
                          setQuantity(Math.max(1, Math.min(val, remainingStock || selectedStock?.quantity || 0)));
                        }}
                        className="w-12 h-6 text-center text-xs appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                        min={1}
                        max={remainingStock || selectedStock?.quantity || 0}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(Math.min(quantity + 1, remainingStock || selectedStock?.quantity || 0))}
                        className="h-6 w-6 p-0"
                      >
                        <Plus className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Available: {remainingStock ?? selectedStock?.quantity ?? 0}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Variants */}
            <VariantSelector
              product={product}
              selectedStockId={selectedStockId}
              setSelectedStockId={(id) => setSelectedStockId(id)}
            />

            {/* Discounts */}
            <DiscountSelector
              stockDiscounts={selectedStock?.stockDiscounts ?? []}
              selectedStockDiscountIds={selectedStockDiscountIds}
              cartDiscountUsages={cartDiscountUsages}
              toggleDiscount={toggleDiscount}
            />
            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAdd}
                disabled={!selectedStock || remainingStock <= 0}
              >
                Add to Order
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddOrderDialog;