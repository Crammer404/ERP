'use client';

import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RefreshButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'outline' | 'green';
}

export function RefreshButton({
  onClick,
  loading = false,
  disabled = false,
  className,
  variant = 'green',
}: RefreshButtonProps) {
  const baseClassName = 'flex items-center gap-2';
  
  const variantClasses = {
    default: '',
    outline: '',
    green: 'bg-green-600 hover:bg-green-700 text-white',
  };

  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      variant={variant === 'green' ? 'default' : variant}
      className={cn(
        baseClassName,
        variantClasses[variant],
        className
      )}
    >
      <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
      Refresh
    </Button>
  );
}
