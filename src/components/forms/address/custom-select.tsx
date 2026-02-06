'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomSelectOption {
  code: string;
  name: string;
  [key: string]: any;
}

interface CustomSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  displayValue?: string; // Custom display value when options haven't loaded
  className?: string;
  selectMenuClass?: string;
  onOpenChange?: (open: boolean) => void; // Callback when dropdown opens/closes
}

export function CustomSelect({
  value = '',
  onValueChange,
  options,
  placeholder = 'Select...',
  disabled = false,
  loading = false,
  displayValue,
  className,
  selectMenuClass = 'max-h-64 overflow-y-auto',
  onOpenChange,
}: CustomSelectProps) {
  const selectedOption = options.find(opt => opt.code === value);
  
  // Priority: displayValue (for edit mode) > selectedOption name > value > placeholder
  const getDisplayText = () => {
    if (displayValue) return displayValue; // Always show displayValue if provided (for edit mode)
    if (selectedOption) return selectedOption.name; // Show matched option name
    if (value) return value; // Show value if no match
    if (loading) return 'Loading...';
    return placeholder;
  };

  const [open, setOpen] = React.useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    // Notify parent when dropdown opens/closes
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };

  return (
    <SelectPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      open={open}
      onOpenChange={handleOpenChange}
    >
      <SelectPrimitive.Trigger
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500',
          className
        )}
      >
        <span className="line-clamp-1 flex-1 text-left">
          {getDisplayText()}
        </span>
        <div className="flex items-center gap-2 ml-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </SelectPrimitive.Icon>
        </div>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className={cn(
            'relative z-[9999] max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
            selectMenuClass
          )}
          position="popper"
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.length === 0 ? (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                No options available
              </div>
            ) : (
              options.map((option) => (
                <SelectPrimitive.Item
                  key={option.code}
                  value={option.code}
                  className={cn(
                    'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                    value === option.code && 'bg-accent'
                  )}
                >
                  <SelectPrimitive.ItemText>{option.name}</SelectPrimitive.ItemText>
                  {value === option.code && (
                    <SelectPrimitive.ItemIndicator className="absolute right-2">
                      <Check className="h-4 w-4" />
                    </SelectPrimitive.ItemIndicator>
                  )}
                </SelectPrimitive.Item>
              ))
            )}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

