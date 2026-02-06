// src/components/pos/CartSummary.tsx
"use client";

import { Separator } from "@/components/ui/separator";
import { useCurrency } from "@/contexts/CurrencyContext";

export default function CartSummary({
  cartTotal,
  totalDiscount,
  totalTaxPercentage,
  taxAmount,
  grandTotal,
}: {
  cartTotal: number;
  totalDiscount: number;
  totalTaxPercentage: number;
  taxAmount: number;
  grandTotal: number;
}) {
  const { defaultCurrency } = useCurrency();

  return (
    <div className="w-full p-6 space-y-2">
      <Separator />
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="font-semibold">
          {defaultCurrency?.symbol || '₱'}{(cartTotal + totalDiscount).toFixed(2)}
        </span>
      </div>
      <div className="flex justify-between items-center text-sm text-destructive">
        <span className="text-destructive">Total Discount</span>
        <span className="font-semibold">-{defaultCurrency?.symbol || '₱'}{totalDiscount.toFixed(2)}</span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">
          Tax ({totalTaxPercentage.toFixed(2)}%)
        </span>
        <span className="font-semibold">{defaultCurrency?.symbol || '₱'}{taxAmount.toFixed(2)}</span>
      </div>
      <Separator />
      <div className="flex justify-between items-center text-lg font-bold text-primary">
        <span>Total</span>
        <span>{defaultCurrency?.symbol || '₱'}{grandTotal.toFixed(2)}</span>
      </div>
    </div>
  );
}