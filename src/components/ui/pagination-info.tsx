'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PaginationInfoProps {
  from?: number | null;
  to?: number | null;
  total: number;
  itemsPerPage: number;
  onItemsPerPageChange: (value: string) => void;
  className?: string;
  showItemsPerPage?: boolean;
  itemsPerPageOptions?: number[];
  textSize?: 'xs' | 'sm' | 'base';
  compact?: boolean;
}

export function PaginationInfo({
  from = 0,
  to = 0,
  total,
  itemsPerPage,
  onItemsPerPageChange,
  className,
  showItemsPerPage = true,
  itemsPerPageOptions = [10, 20, 50, 100],
  textSize = 'sm',
  compact = false
}: PaginationInfoProps) {
  const textSizeClass = textSize === 'xs' ? 'text-xs' : textSize === 'sm' ? 'text-sm' : 'text-base';
  const gapClass = compact ? 'gap-1' : 'gap-2';
  const selectWidthClass = compact ? 'w-16 h-7 text-xs' : 'w-20';
  return (
    <div className={cn("flex items-center", gapClass, className)}>
      <p className={cn(textSizeClass, "text-muted-foreground")}>
        Showing {from || 0}–{to || 0} of total <span className="font-bold text-foreground">{total}</span> items
      </p>
      
      {showItemsPerPage && (
        <Select value={itemsPerPage.toString()} onValueChange={onItemsPerPageChange}>
          <SelectTrigger className={selectWidthClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {itemsPerPageOptions.map((option) => (
              <SelectItem key={option} value={option.toString()}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

// Predefined pagination info components for common use cases
export const PaginationInfos = {
  // Standard pagination with all options
  Standard: (props: Omit<PaginationInfoProps, 'showItemsPerPage' | 'itemsPerPageOptions'>) => (
    <PaginationInfo {...props} />
  ),
  
  // Pagination without items per page dropdown
  Simple: (props: Omit<PaginationInfoProps, 'showItemsPerPage'>) => (
    <PaginationInfo {...props} showItemsPerPage={false} />
  ),
  
  // Pagination with custom items per page options
  Custom: (props: Omit<PaginationInfoProps, 'itemsPerPageOptions'> & { 
    itemsPerPageOptions: number[] 
  }) => (
    <PaginationInfo {...props} />
  ),
  
  // Pagination with limited options (for smaller datasets)
  Limited: (props: Omit<PaginationInfoProps, 'itemsPerPageOptions'>) => (
    <PaginationInfo {...props} itemsPerPageOptions={[5, 10, 20]} />
  ),
  
  // Pagination with extended options (for large datasets)
  Extended: (props: Omit<PaginationInfoProps, 'itemsPerPageOptions'>) => (
    <PaginationInfo {...props} itemsPerPageOptions={[10, 20, 50, 100, 200, 500]} />
  )
};
