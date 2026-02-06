'use client';

import { useRef, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight, Package } from 'lucide-react';

interface Category {
  id: number;
  name: string;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryId: number | null;
  setSelectedCategoryId: (id: number | null) => void;
}

export default function CategoryFilter({ categories, selectedCategoryId, setSelectedCategoryId }: CategoryFilterProps) {
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);

  useEffect(() => {
    const checkScrollable = () => {
      if (categoryScrollRef.current) {
        const isScrollableX = categoryScrollRef.current.scrollWidth > categoryScrollRef.current.clientWidth;
        setIsScrollable(isScrollableX);
      }
    };

    checkScrollable();
    window.addEventListener('resize', checkScrollable);
    return () => window.removeEventListener('resize', checkScrollable);
  }, [categories]);

  // Scroll category list left/right
  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 200; // Adjust as needed
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground">Categories</h3>
        {selectedCategoryId && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedCategoryId(null)}
            className="h-7 px-3 text-xs rounded-full flex items-center gap-1 text-foreground hover:bg-destructive/5 hover:text-destructive transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Clear Filter
          </Button>
        )}
      </div>
      <div>
        {/* Scrollable category row with fade mask */}
        <div
          ref={categoryScrollRef}
          className="flex gap-3 py-2 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            maskImage: 'linear-gradient(to right, black 90%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, black 90%, transparent)',
          }}
        >
          {categories.map((category) => {
            const IconComponent = Package;
            const isSelected = selectedCategoryId === category.id;
            return (
              <Card
                key={category.id}
                className={`flex-shrink-0 cursor-pointer transition-all duration-200 hover:shadow-md ${
                  isSelected
                    ? 'ring-2 ring-primary bg-primary/5 border-primary/20'
                    : 'hover:bg-secondary/50'
                }`}
                onClick={() => setSelectedCategoryId(isSelected ? null : category.id)}
              >
                <CardContent className="flex flex-col items-center justify-center py-2 px-3 min-w-[70px]">
                  <IconComponent
                    className={`h-5 w-5 mb-1 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                  <span
                    className={`text-[11px] text-center font-medium ${
                      isSelected ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {category.name}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {isScrollable && (
          <div className="flex justify-end gap-2">
            <button
              onClick={() => scrollCategories('left')}
              className="text-muted-foreground hover:text-foreground transition-colors"
              type="button"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scrollCategories('right')}
              className="text-muted-foreground hover:text-foreground transition-colors"
              type="button"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}