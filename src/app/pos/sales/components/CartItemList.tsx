// src/components/pos/CartItemList.tsx
"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingBag, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CartItem } from "@/lib/types";
import { useCurrency } from "@/contexts/CurrencyContext";

export default function CartItemList({
  items,
  isMounted,
  removeItem,
  updateItemQuantity,
}: {
  items: CartItem[];
  isMounted: boolean;
  removeItem: (id: string) => void;
  updateItemQuantity: (cartItemId: string, quantity: number) => void;
}) {
  const { toast } = useToast();
  const { defaultCurrency } = useCurrency();

  if (!isMounted) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
        <ShoppingBag className="h-20 w-20 mb-4" />
        <p>Loading sale...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground my-12">
        <ShoppingBag className="h-20 w-20 mb-4" />
        <p className="text-sm">No items in cart.</p>
        <p className="text-xs">Add products from the left to get started.</p>
      </div>
    );
  }

  // Calculate total quantity in cart for each stock id
  const stockTotals = items.reduce((acc, item) => {
    acc[item.id] = (acc[item.id] || 0) + item.quantity;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="flex-grow relative max-h-[250px] min-h-[250px]">
      <ScrollArea className="h-full">
        <div className="space-y-1 px-4 sm:px-6">
           {items.map((item) => {
             // Ensure price is a valid number (convert string to number if needed)
             const itemPrice = typeof item.price === 'number' ? item.price : parseFloat(String(item.price ?? 0)) || 0;
             const itemQuantity = typeof item.quantity === 'number' ? item.quantity : parseInt(String(item.quantity ?? 1), 10) || 1;
             const subtotal = itemPrice * itemQuantity;
             const sumPercent =
               (item.percentageDiscounts || []).reduce((a, b) => a + b, 0) +
               (item.discountType === "percentage" ? (Number(item.discountValue) || 0) : 0);
             const sumFixed =
               (item.fixedDiscounts || []).reduce((a, b) => a + b, 0) +
               (item.discountType === "fixed" ? (Number(item.discountValue) || 0) : 0);
             const itemDiscount = subtotal * (sumPercent / 100) + sumFixed;
             const finalPrice = Math.max(0, subtotal - itemDiscount);

             const maxQty = (item.stock ?? 0) - ((stockTotals[item.id] || 0) - itemQuantity);

            const handleQuantityChange = (value: string) => {
              const num = parseInt(value, 10);
              if (isNaN(num) || num < 1) return;
              if (num > maxQty) {
                toast({
                  title: "Insufficient stock",
                  description: `Only ${maxQty} stocks available.`,
                  variant: "destructive",
                });
              }
              const clamped = Math.min(num, maxQty);
              updateItemQuantity(item.cartItemId!, clamped);
            };

            return (
              <div
                key={item.cartItemId}
                className="grid grid-cols-12 gap-4 items-center py-2 xs:text-xs text-[11px]"
              >
                <div className="col-span-3 font-medium">{item.name}</div>
                 <div className="col-span-2 text-center">
                   {defaultCurrency?.symbol || '₱'}{itemPrice.toFixed(2)}
                 </div>
                 <div className="col-span-1 text-center">
                   <Input
                     type="number"
                     min={1}
                     max={maxQty}
                     value={itemQuantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="!w-6 !h-6 text-[11px] text-center border border-border rounded-sm
                      bg-background focus-visible:ring-0 leading-none p-0
                      [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    style={{
                      MozAppearance: "textfield",
                      fontSize: "11px",
                    }}
                  />
                </div>
                <div className="col-span-2 text-center text-destructive">
                  {(item.fixedDiscounts?.length || item.discountType === "fixed")
                    ? `${defaultCurrency?.symbol || '₱'}${(item.fixedDiscounts || []).reduce((a, b) => a + b, 0) +
                        (item.discountType === "fixed" ? item.discountValue : 0)}`
                    : "-"}
                </div>
                <div className="col-span-1 text-center text-destructive">
                  {item.percentageDiscounts && item.percentageDiscounts.length > 0
                    ? `${item.percentageDiscounts.reduce((a, b) => a + b, 0)}%`
                    : (item.discountType === "percentage" ? `${item.discountValue}%` : "-")}
                </div>
                 <div className="col-span-2 text-center font-semibold">
                   {defaultCurrency?.symbol || '₱'}{Number(finalPrice).toFixed(2)}
                 </div>
                <div className="col-span-1 text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.cartItemId!)}
                    className="text-muted-foreground hover:text-destructive h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      {/* Bottom fade effect */}
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-black/9 to-transparent pointer-events-none z-10" />
    </div>
  );
}