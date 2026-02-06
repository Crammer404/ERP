'use client';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  parseApiDate,
  normalizeStartOfDay,
  normalizeEndOfDay,
  formatHumanDate,
} from '@/lib/dateUtils';
import type { StockDiscount } from '../hooks/useProducts';
import { useCurrency } from '@/contexts/CurrencyContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

type DiscountSelectorProps = {
  stockDiscounts: StockDiscount[];
  selectedStockDiscountIds: number[];
  cartDiscountUsages: Record<number, number>;
  toggleDiscount: (stockDiscountId: number, percentage?: number, value?: number) => void;
};

const DiscountSelector = ({
  stockDiscounts,
  selectedStockDiscountIds,
  cartDiscountUsages,
  toggleDiscount,
}: DiscountSelectorProps) => {
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
  }, [stockDiscounts]);

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
      <Label>Available Discount</Label>
      {stockDiscounts.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          No discounts for this variant.
        </div>
      ) : (
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
            {stockDiscounts.map((stockDiscount) => {
          const discount = stockDiscount.discount;
          const now = normalizeStartOfDay(new Date());
          const starts = discount.start_date ? normalizeStartOfDay(parseApiDate(discount.start_date)!) : null;
          const ends = discount.end_date ? normalizeEndOfDay(parseApiDate(discount.end_date)!) : null;
          const inWindow = (!starts || now >= starts) && (!ends || now <= ends);
          if (!inWindow) return null; // Don't display expired discounts
          const cartUsage = cartDiscountUsages[discount.id] || 0;
          const effectiveRemaining = discount.usages == null ? null : discount.usages - cartUsage;
          const hasRemaining = effectiveRemaining == null || effectiveRemaining > 0;
          const valid = inWindow && hasRemaining;

          const label =
            discount.value_in_percentage != null
              ? `${discount.value_in_percentage}%`
              : discount.value != null
              ? `${defaultCurrency?.symbol || '₱'}${parseFloat(discount.value).toFixed(2)}`
              : '';

          const isSelected = selectedStockDiscountIds.includes(stockDiscount.id);

          return (
            <button
              key={stockDiscount.id}
              type="button"
              onClick={() =>
                (valid || isSelected) &&
                toggleDiscount(
                  stockDiscount.id,
                  discount.value_in_percentage ?? undefined,
                  discount.value ? parseFloat(discount.value) : undefined
                )
              }
              className={cn(
                'relative border rounded-md p-3 text-left hover:bg-muted transition',
                valid || isSelected ? '' : 'opacity-50 cursor-not-allowed',
                isSelected && 'border-primary bg-primary/10'
              )}
              disabled={!valid && !isSelected}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-primary rounded-t-md"></div>
              <div className="flex items-center gap-2">
                <div className="font-medium truncate">{discount.name}</div>
                <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full font-medium">
                  {label}
                </span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {starts && ends
                  ? `${formatHumanDate(starts)} — ${formatHumanDate(ends)}`
                  : starts
                  ? `Starts ${formatHumanDate(starts)}`
                  : ends
                  ? `Until ${formatHumanDate(ends)}`
                  : 'Ongoing'}
              </div>
              {typeof effectiveRemaining === 'number' && (
                <div className={cn("text-xs text-muted-foreground", effectiveRemaining === 0 && "text-red-500 font-semibold")}>
                  {effectiveRemaining === 0 ? 'Fully Consumed' : `Remaining: ${effectiveRemaining}`}
                </div>
              )}
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
      )}
    </div>
  );
};

export default DiscountSelector;