'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// Table Container
interface DataTableProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const DataTable = React.forwardRef<HTMLDivElement, DataTableProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('w-full border border-border/50 rounded-lg overflow-hidden bg-card', className)}
      {...props}
    >
      {children}
    </div>
  )
);
DataTable.displayName = 'DataTable';

// Table Header
interface DataTableHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  columns?: number;
}

const DataTableHeader = React.forwardRef<HTMLDivElement, DataTableHeaderProps>(
  ({ className, children, columns = 8, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'hidden lg:grid gap-4 text-xs font-medium uppercase tracking-wider',
        'border-b border-border bg-card px-4 py-3 text-center text-muted-foreground rounded-t-lg',
        className
      )}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      {...props}
    >
      {children}
    </div>
  )
);
DataTableHeader.displayName = 'DataTableHeader';

// Table Header Cell
interface DataTableHeadProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

const DataTableHead = React.forwardRef<HTMLSpanElement, DataTableHeadProps>(
  ({ className, children, align = 'center', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        align === 'left' && 'text-left',
        align === 'right' && 'text-right',
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
);
DataTableHead.displayName = 'DataTableHead';

// Table Body
interface DataTableBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const DataTableBody = React.forwardRef<HTMLDivElement, DataTableBodyProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props}>
      {children}
    </div>
  )
);
DataTableBody.displayName = 'DataTableBody';

// Table Row
interface DataTableRowProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  columns?: number;
  isClickable?: boolean;
}

const DataTableRow = React.forwardRef<HTMLDivElement, DataTableRowProps>(
  ({ className, children, columns = 8, isClickable = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'mx-4 my-2 first:mt-4 last:mb-4 border border-border/60 rounded-md bg-card',
        'transition-all duration-150',
        isClickable && 'cursor-pointer hover:bg-muted/40',
        className
      )}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      {...props}
    >
      <div
        className={cn(
          'grid gap-4 w-full text-sm font-normal text-left items-center lg:text-center px-4 py-3',
          'lg:grid'
        )}
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {children}
      </div>
    </div>
  )
);
DataTableRow.displayName = 'DataTableRow';

// Table Cell
interface DataTableCellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  label?: string; // Mobile label
  align?: 'left' | 'center' | 'right';
}

const DataTableCell = React.forwardRef<HTMLDivElement, DataTableCellProps>(
  ({ className, children, label, align = 'center', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col lg:col-span-1',
        align === 'left' && 'lg:text-left',
        align === 'right' && 'lg:text-right',
        className
      )}
      {...props}
    >
      {label && (
        <span className="lg:hidden text-xs text-muted-foreground font-medium">{label}</span>
      )}
      <span className="text-foreground">{children}</span>
    </div>
  )
);
DataTableCell.displayName = 'DataTableCell';

// Table Footer (for pagination)
interface DataTableFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const DataTableFooter = React.forwardRef<HTMLDivElement, DataTableFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3',
        'px-4 py-4 border-t border-border/50',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
DataTableFooter.displayName = 'DataTableFooter';

// Status Dot helper component
interface StatusDotProps {
  status: 'success' | 'warning' | 'error' | 'default';
  label: string;
}

const StatusDot = ({ status, label }: StatusDotProps) => {
  const dotColors = {
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    default: 'bg-gray-400',
  };

  return (
    <div className="flex items-center gap-2 lg:justify-center">
      <span className={cn('w-2 h-2 rounded-full', dotColors[status])}></span>
      <span className="text-foreground">{label}</span>
    </div>
  );
};

export {
  DataTable,
  DataTableHeader,
  DataTableHead,
  DataTableBody,
  DataTableRow,
  DataTableCell,
  DataTableFooter,
  StatusDot,
};
