'use client';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { Product as PosProduct } from '../hooks/useProducts';
import { useCurrency } from '@/contexts/CurrencyContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

type VariantSelectorProps = {
  product: PosProduct;
  selectedStockId: number | null;
  setSelectedStockId: (id: number) => void;
};

const VariantSelector = ({
  product,
  selectedStockId,
  setSelectedStockId,
}: VariantSelectorProps) => {
  const { defaultCurrency } = useCurrency();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);

  useEffect(() => {
    const checkScrollable = () => {
      if (scrollRef.current) {
        const isScrollableX = scrollRef.current.scrollWidth > scrollRef.current.clientWidth;
        setIsScrollable(isScrollableX);
      }
    };

    checkScrollable();
    window.addEventListener('resize', checkScrollable);
    return () => window.removeEventListener('resize', checkScrollable);
  }, [product.stocks]);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-2">
      <Label>Choose Variant <span className="text-red-500">*</span></Label>
      {product.stocks?.length ? (
        <div className="space-y-1">
          <div
            ref={scrollRef}
            className="flex gap-2 overflow-x-auto pb-2 scroll-smooth"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              maskImage: 'linear-gradient(to right, black 90%, transparent)',
              WebkitMaskImage: 'linear-gradient(to right, black 90%, transparent)',
            }}
          >
            {product.stocks.map((stock) => {
              const active = selectedStockId === stock.id;
              const outOfStock = stock.quantity <= 0;

              return (
                <button
                  key={stock.id}
                  type="button"
                  onClick={() => !outOfStock && setSelectedStockId(stock.id)}
                  className={cn(
                    'relative flex-shrink-0 w-40 border rounded-md px-3 py-2 text-left transition-colors',
                    active ? 'border-primary bg-primary/10' : 'hover:bg-muted',
                    outOfStock && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-primary rounded-t-md"></div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-medium truncate">
                      {stock.variant || 'Default'}
                    </div>
                    <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full font-medium">
                      {defaultCurrency?.symbol || '₱'}{stock.sellingPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Stock: {stock.quantity}
                  </div>
                </button>
              );
            })}
          </div>
          {isScrollable && (
            <div className="flex justify-end gap-2">
              <button
                onClick={scrollLeft}
                className="text-muted-foreground hover:text-foreground transition-colors"
                type="button"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={scrollRight}
                className="text-muted-foreground hover:text-foreground transition-colors"
                type="button"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No variants available</p>
      )}
    </div>
  );
};

export default VariantSelector;
