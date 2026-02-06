'use client';

import Image from 'next/image';
import { Minus, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Product as PosProduct, Stock as PosStock, Category } from '../hooks/useProducts';
import { useCurrency } from '@/contexts/CurrencyContext';

type ProductInfoProps = {
  product: PosProduct;
  selectedStock?: PosStock;
  quantity: number;
  setQuantity: (val: number) => void;
  remainingStock?: number;
};

const ProductInfo = ({ product, selectedStock, quantity, setQuantity, remainingStock }: ProductInfoProps) => {
  const { defaultCurrency } = useCurrency();

  return (
    <div className="sm:col-span-1 flex flex-col items-center text-center gap-3">
      {/* Product image */}
      <div className="relative w-24 h-24 rounded-md overflow-hidden border">
        <Image
          src={product.image || '/placeholder.png'}
          alt={product.name}
          fill
          className="object-contain bg-muted"
          unoptimized
        />
      </div>

      {/* Product name & category */}
      <div className="space-y-1">
        <div className="font-semibold">{product.name}</div>
        <div className="text-sm text-muted-foreground">{product.category.name}</div>
      </div>

      {/* Price */}
      {selectedStock && (
        <div className="text-lg font-bold text-primary">
          {defaultCurrency?.symbol || '₱'}{selectedStock.sellingPrice.toFixed(2)}
        </div>
      )}

      {/* Quantity controls */}
      {selectedStock && (
        <div className="w-full space-y-2">
          <Label>Quantity</Label>
          <div className="flex items-center justify-center gap-2">
            {/* Decrease */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>

            {/* Manual input */}
            <Input
              type="number"
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10) || 1;
                setQuantity(Math.max(1, Math.min(val, remainingStock || selectedStock?.quantity || 0)));
              }}
              className="w-24 text-center"
              min={1}
              max={remainingStock || selectedStock?.quantity || 0}
            />

            {/* Increase */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity(Math.min(quantity + 1, remainingStock || selectedStock?.quantity || 0))}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Stock info */}
          <div className="text-xs text-muted-foreground">
            Available: {remainingStock ?? selectedStock?.quantity ?? 0}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductInfo;