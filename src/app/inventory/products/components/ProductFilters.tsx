'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PlusCircle, ChevronDown, SlidersHorizontal, Search, Trash2 } from 'lucide-react';
import { ProductDialog } from './ProductDialog';

interface ProductFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedProductIds: number[];
  onMassDelete: () => void;
  onSaveProduct: (values: any, id?: number) => void;
  onRefresh?: () => void;
  selectedCategories: string[];
  selectedStatuses: string[];
  selectedBranches: string[];
  selectedVariantTypes: string[];
  onCategoryFilter: (category: string) => void;
  onStatusFilter: (status: string) => void;
  onBranchFilter: (branch: string) => void;
  onVariantTypeFilter: (variantType: string) => void;
  onClearFilters: () => void;
  uniqueCategories: string[];
  uniqueBranches: string[];
}

export function ProductFilters({
  searchTerm,
  onSearchChange,
  selectedProductIds,
  onMassDelete,
  onSaveProduct,
  onRefresh,
  selectedCategories,
  selectedStatuses,
  selectedBranches,
  selectedVariantTypes,
  onCategoryFilter,
  onStatusFilter,
  onBranchFilter,
  onVariantTypeFilter,
  onClearFilters,
  uniqueCategories,
  uniqueBranches
}: ProductFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-4">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Action
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={selectedProductIds.length === 0}>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <div className="flex items-center w-full">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete Selected ({selectedProductIds.length})</span>
                    </div>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the {selectedProductIds.length} selected products.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onMassDelete}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem>Export All</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ProductDialog onSave={onSaveProduct} onRefresh={onRefresh}>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </ProductDialog>
        </div>
      </div>
      
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="h-8" onClick={onClearFilters}>
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:bg-muted">
                Variant Type {selectedVariantTypes.length > 0 && `(${selectedVariantTypes.length})`}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuCheckboxItem
                checked={selectedVariantTypes.includes('single')}
                onCheckedChange={() => onVariantTypeFilter('single')}
              >
                Single
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedVariantTypes.includes('variant')}
                onCheckedChange={() => onVariantTypeFilter('variant')}
              >
                Variant
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:bg-muted">
                Category {selectedCategories.length > 0 && `(${selectedCategories.length})`}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {uniqueCategories.map(category => (
                <DropdownMenuCheckboxItem
                  key={category}
                  checked={selectedCategories.includes(category)}
                  onCheckedChange={() => onCategoryFilter(category)}
                >
                  {category}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:bg-muted">
                Stocks {selectedStatuses.length > 0 && `(${selectedStatuses.length})`}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuCheckboxItem
                checked={selectedStatuses.includes('In Stock')}
                onCheckedChange={() => onStatusFilter('In Stock')}
              >
                In Stock
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedStatuses.includes('Low Stock')}
                onCheckedChange={() => onStatusFilter('Low Stock')}
              >
                Low Stock
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedStatuses.includes('Out of Stock')}
                onCheckedChange={() => onStatusFilter('Out of Stock')}
              >
                Out of Stock
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 pl-10 w-64"
          />
        </div>
      </div>
    </div>
  );
}