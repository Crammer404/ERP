'use client';

import { useEffect, useState, useMemo, Fragment } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { EllipsisVertical, ChevronDown, ChevronRight, Ruler } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';
import { PaginationInfos } from '@/components/ui/pagination-info';
import { inventoryService } from '@/app/inventory/settings/services/inventoryService';
import { useToast } from '@/hooks/use-toast';
import type { InventoryVariant } from '@/app/inventory/settings/services/inventoryService';
import { tenantContextService } from '@/services/tenant/tenantContextService';

interface SettingTableProps {
  type: 'brand' | 'category' | 'attribute' | 'measurement';
  searchTerm: string;
  loading?: boolean;
  onDelete?: (id: number) => Promise<void>;
  onEdit?: (item: SettingItem) => void;
}

interface SettingItem {
  id: number;
  name: string;
  description?: string;
  branch?: string;
  branch_id?: number;
  unit?: string;
  multiplier?: number;
  fullData?: InventoryVariant;
}

// Expanded Row for Variant Specifications
function VariantExpandedRow({ variant }: { variant: InventoryVariant }) {
  return (
    <TableRow className="bg-muted">
      <TableCell colSpan={5} className="p-0">
        <div className="px-6 py-4 border-l-2 border-primary/20 bg-muted/40 rounded-md space-y-4 text-sm text-foreground">
          <div className="bg-card border border-border rounded-lg p-4 shadow-sm space-y-3">
            <h4 className="font-semibold text-base text-primary flex items-center gap-2">
              Variations
            </h4>
            {variant.specifications && variant.specifications.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                {variant.specifications.map((spec, idx) => (
                  <div
                    key={idx}
                    className="bg-muted/50 border border-border rounded-lg p-3 text-center"
                  >
                    <span className="font-medium">{spec.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No specifications available</p>
            )}
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function SettingTable({ type, searchTerm, loading, onDelete, onEdit }: SettingTableProps) {
   const [data, setData] = useState<SettingItem[]>([]);
   const [fetching, setFetching] = useState(true);
   const [currentPage, setCurrentPage] = useState(1);
   const [itemsPerPage, setItemsPerPage] = useState(10);
   const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
   const { toast } = useToast();

   // Get current selected branch
   const getCurrentBranch = () => {
     return tenantContextService.getStoredBranchContext();
   };

   const [currentBranch, setCurrentBranch] = useState(getCurrentBranch);

   // Listen for branch changes
   useEffect(() => {
     const handleBranchChange = () => {
       setCurrentBranch(getCurrentBranch());
     };

     window.addEventListener('branchChanged', handleBranchChange);
     window.addEventListener('tenantChanged', handleBranchChange);

     return () => {
       window.removeEventListener('branchChanged', handleBranchChange);
       window.removeEventListener('tenantChanged', handleBranchChange);
     };
   }, []);

   // 🔹 Fetch data based on tab type
  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetching(true);
        let response: SettingItem[] = [];

        const branchFilter = currentBranch?.id;
        if (type === 'brand') {
           response = (await inventoryService.getBrands(branchFilter)).map((b) => ({
             id: b.id,
             name: b.name,
             description: b.description,
             branch: b.branch?.name || '—',
             branch_id: b.branch_id,
           }));
         } else if (type === 'category') {
           response = (await inventoryService.getCategories(branchFilter)).map((c) => ({
             id: c.id,
             name: c.name,
             description: c.description,
             branch: c.branch?.name || '—',
             branch_id: c.branch_id,
           }));
        } else if (type === 'attribute') {
          const variants = await inventoryService.getVariants(branchFilter);
          response = variants.map((v) => ({
            id: v.id,
            name: v.name,
            description: `${v.specifications?.length ?? 0} specifications`,
            branch: v.branch?.name || '—',
            branch_id: v.branch_id,
            fullData: v,
          }));
        } else if (type === 'measurement') {
          const measurements = await inventoryService.getMeasurements(branchFilter);
          response = measurements.map((m) => ({
            id: m.id,
            name: m.name,
            description: m.description,
            unit: m.symbol || m.unit_type,
            multiplier: m.multiplier_to_base,
          }));
        }

        setData(response);
      } catch (error) {
        console.error(`❌ Failed to fetch ${type}s:`, error);
        toast({
          title: 'Error',
          description: `Failed to load ${type}s.`,
          variant: 'destructive',
        });
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, [type, currentBranch]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // 🔍 Filter search and paginate
  const filteredData = useMemo(() => {
    return data.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));

  const getEmptyMessage = (type: string) => {
    switch (type) {
      case 'category':
        return 'No categories yet. Click "Add Category" to get started.';
      case 'brand':
        return 'No brands yet. Click "Add Brand" to get started.';
      case 'attribute':
        return 'No variant attributes yet. Click "Add Variant Attribute" to get started.';
      default:
        return 'No data yet.';
    }
  };

  const handleEdit = (item: SettingItem) => {
    onEdit?.(item);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: string) => {
    const perPage = parseInt(newItemsPerPage);
    setItemsPerPage(perPage);
    setCurrentPage(1);
  };

  // Loading skeleton
  if (loading || fetching) {
    return (
      <div className="space-y-2 border rounded-lg p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  // Empty state
  if (filteredData.length === 0 && !searchTerm) {
    return (
      <div className="text-center text-muted-foreground border rounded-lg py-8">
        {getEmptyMessage(type)}
      </div>
    );
  }

  // No results for current search
  if (paginatedData.length === 0 && searchTerm) {
    return (
      <div className="text-center text-muted-foreground border rounded-lg py-8">
        <p>No results match your search.</p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{type === 'measurement' ? 'Measurement' : 'Name'}</TableHead>
              <TableHead>{type === 'measurement' ? 'Unit' : 'Branch'}</TableHead>
              {type === 'measurement' && <TableHead>Multiplier</TableHead>}
              {type === 'attribute' && <TableHead>Specifications</TableHead>}
              {type !== 'measurement' && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((item) => {
              const isExpanded = expandedRowId === item.id;
              return (
                <Fragment key={item.id}>
                  <TableRow>
                    <TableCell>
                      {type === 'measurement' ? (
                        <div className="flex items-center gap-2">
                          <Ruler className="w-4 h-4 text-muted-foreground" />
                          <span>{item.name}</span>
                        </div>
                      ) : (
                        item.name
                      )}
                    </TableCell>
                    <TableCell>{type === 'measurement' ? item.unit ?? '—' : item.branch ?? '—'}</TableCell>
                    {type === 'measurement' && (
                      <TableCell>{item.multiplier ?? '—'}</TableCell>
                    )}
                    {type === 'attribute' && (
                      <TableCell
                        className="cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => setExpandedRowId(isExpanded ? null : item.id)}
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                          {item.description ?? '—'}
                        </div>
                      </TableCell>
                    )}
                    {type !== 'measurement' && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <EllipsisVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(item)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => onDelete?.(item.id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                  {type === 'attribute' && isExpanded && item.fullData && (
                    <VariantExpandedRow variant={item.fullData} />
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6">
        <PaginationInfos.Standard
          from={(currentPage - 1) * itemsPerPage + 1}
          to={Math.min(currentPage * itemsPerPage, filteredData.length)}
          total={filteredData.length}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={handleItemsPerPageChange}
        />

        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => handlePageChange(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

    </>
  );
}
