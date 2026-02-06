'use client';

import { useEffect, useState, useMemo } from 'react';
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
import { EllipsisVertical } from 'lucide-react';
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
import { SupplierCategory } from '../services/supplierCategoryService';

interface SupplierCategoryTableProps {
  categories: SupplierCategory[];
  searchTerm: string;
  loading?: boolean;
  onDelete?: (category: SupplierCategory) => void;
  onEdit?: (category: SupplierCategory) => void;
}

export function SupplierCategoryTable({ categories, searchTerm, loading, onDelete, onEdit }: SupplierCategoryTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // 🔍 Filter search and paginate
  const filteredData = useMemo(() => {
    return categories.filter((category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));

  const handleEdit = (category: SupplierCategory) => {
    onEdit?.(category);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: string) => {
    const perPage = parseInt(newItemsPerPage);
    setItemsPerPage(perPage);
    setCurrentPage(1);
  };

  // 🧭 Loading skeleton
  if (loading) {
    return (
      <div className="space-y-2 border rounded-lg p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  // 🫙 Empty state
  if (filteredData.length === 0 && !searchTerm) {
    return (
      <div className="text-center text-muted-foreground border rounded-lg py-8">
        No supplier categories yet. Click "Add Category" to get started.
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
              <TableHead className="w-[80px] text-center">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((category, index) => {
              const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
              return (
                <TableRow key={category.id}>
                  <TableCell className="text-center">{globalIndex}</TableCell>
                  <TableCell>{category.name}</TableCell>
                  <TableCell>
                    {category.branch ? (
                      category.branch.name
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <EllipsisVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(category)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => onDelete?.(category)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
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