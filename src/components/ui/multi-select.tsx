'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Check, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  maxHeight?: string;
  className?: string;
  emptyLabel?: string;
}

export function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = 'Select items...',
  searchPlaceholder = 'Search...',
  disabled = false,
  maxHeight = '240px',
  className,
  emptyLabel = 'Click to add items',
}: MultiSelectProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOptions = options.filter((option) =>
    value.includes(option.value)
  );

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const removeOption = (optionValue: string) => {
    onChange(value.filter((v) => v !== optionValue));
  };

  const handleToggleOpen = () => {
    if (!disabled) {
      setIsOpen(true);
      setSearchTerm(''); // Clear search when reopening
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={cn('w-full space-y-3', className)}>
      {/* Search Input - Only visible when dropdown is open */}
      <div ref={containerRef} className="relative">
        {isOpen && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                disabled={disabled}
                className="pl-10 border-primary/50 focus:border-primary"
              />
            </div>

            {/* Dropdown List */}
            <div className="mt-1 rounded-md border bg-popover shadow-lg overflow-hidden">
              <ScrollArea style={{ maxHeight }}>
                <div className="py-1">
                  {filteredOptions.length === 0 ? (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                      No results found
                    </div>
                  ) : (
                    filteredOptions.map((option) => {
                      const isSelected = value.includes(option.value);
                      return (
                        <div
                          key={option.value}
                          onClick={() => toggleOption(option.value)}
                          className={cn(
                            'relative flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors',
                            'hover:bg-accent hover:text-accent-foreground',
                            isSelected && 'bg-accent'
                          )}
                        >
                          <span className="text-sm">{option.label}</span>
                          {isSelected && (
                            <Check className="h-4 w-4 text-green-500 flex-shrink-0 ml-2" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          </>
        )}
      </div>

      {/* Selected Items "Bucket" - Always visible */}
      <div className="min-h-[60px] p-3 bg-muted/30 rounded-md border border-dashed border-border/50">
        {selectedOptions.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {selectedOptions.map((option) => (
              <Badge
                key={option.value}
                variant="secondary"
                className="pl-3 pr-2 py-1.5 text-sm font-normal bg-muted hover:bg-muted/80 transition-colors"
              >
                <span className="mr-1">{option.label}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeOption(option.value);
                  }}
                  disabled={disabled}
                  className="inline-flex items-center justify-center rounded-sm hover:bg-background/80 p-0.5 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </Badge>
            ))}
            <button
              type="button"
              onClick={handleToggleOpen}
              disabled={disabled}
              className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
              + Add
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleToggleOpen}
            disabled={disabled}
            className="w-full h-full flex items-center justify-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>{emptyLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
}

