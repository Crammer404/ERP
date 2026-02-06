'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit, Trash2, Eye, MapPin, Ban, ShoppingCart } from 'lucide-react';
import { Supplier } from '../services/supplierService';

interface SupplierTableProps {
  suppliers: Supplier[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  onView: (supplier: Supplier) => void;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export function SupplierTable({
  suppliers,
  currentPage,
  setCurrentPage,
  onView,
  onEdit,
  onDelete,
  canUpdate = true,
  canDelete = true,
}: SupplierTableProps) {
  const router = useRouter();

  const onPurchasedProducts = (supplier: Supplier) => {
    router.push(`/suppliers/purchases?id=${supplier.id}`);
  };

  const itemsPerPage = 5;
  const totalPages = Math.ceil(suppliers.length / itemsPerPage);
  const paginatedSuppliers = suppliers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatAddress = (address: Supplier['address']) => {
    const parts = [
      address.block_lot,
      address.street,
      address.city,
      address.province,
      address.region,
      address.postal_code,
      address.country
    ].filter(Boolean);

    return parts.join(', ');
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Company</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            {(canUpdate || canDelete) && (
              <TableHead>Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedSuppliers.map(supplier => (
            <TableRow key={supplier.id} className="hover:bg-transparent">
              <TableCell className="font-medium">{supplier.name}</TableCell>
              <TableCell>
                {supplier.branch?.name || '—'}
              </TableCell>
              <TableCell>
                {supplier.supplier_category?.name || '—'}
              </TableCell>
              <TableCell>{supplier.email}</TableCell>
              <TableCell>{supplier.phone_number}</TableCell>
              <TableCell>
                {(canUpdate || canDelete) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center">
                      <DropdownMenuItem onClick={() => onView(supplier)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onPurchasedProducts(supplier)}>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Purchases
                      </DropdownMenuItem>
                      {canUpdate && (
                        <DropdownMenuItem onClick={() => onEdit(supplier)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <DropdownMenuItem
                          onClick={() => onDelete(supplier)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-between items-center mt-6">
        <p className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, suppliers.length)} of {suppliers.length}
        </p>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page =>
                page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)
              )
              .map((page, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && page - prev > 1;
                return (
                  <div key={page} className="flex items-center">
                    {showEllipsis && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  </div>
                );
              })}

            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </>
  );
}
