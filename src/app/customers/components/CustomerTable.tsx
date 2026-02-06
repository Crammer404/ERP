'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Edit, Trash2, Eye, Ban, ShoppingCart } from 'lucide-react';
import { Customer } from '../services/customerService';

interface CustomerTableProps {
  customers: Customer[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onView: (customer: Customer) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
  canView?: boolean;
}

export function CustomerTable({
  customers,
  currentPage,
  setCurrentPage,
  onEdit,
  onDelete,
  onView,
  canUpdate = true,
  canDelete = true,
  canView = true,
}: CustomerTableProps) {
  const router = useRouter();

  const onPurchases = (customer: Customer) => {
    router.push(`/customers/purchases?id=${customer.id}`);
  };

  const itemsPerPage = 5;
  const totalPages = Math.ceil(customers.length / itemsPerPage);
  const paginatedCustomers = customers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatAddress = (address: Customer['address']) => {
    const parts = [
      address.street,
      address.barangay,
      address.city,
      address.province,
      address.region,
      address.postal_code
    ].filter(Boolean);

    return parts.join(', ');
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Name</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>TIN</TableHead>
            {(canUpdate || canDelete || canView) && (
              <TableHead>Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedCustomers.map((customer) => (
            <TableRow key={customer.id} className="hover:bg-transparent">
              <TableCell className="font-medium">
                {customer.first_name} {customer.last_name}
              </TableCell>
              <TableCell>
                {customer.branch ? (
                  customer.branch.name
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>{customer.email ? (customer.email) : 
                (<span className="text-muted-foreground">-</span>)}
              </TableCell>
              <TableCell>{customer.phone_number ? (customer.phone_number) : 
                (<span className="text-muted-foreground">-</span>)}
              </TableCell>
              <TableCell>
                {customer.tin ? (
                  customer.tin
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {(canUpdate || canDelete || canView) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center">
                      {canView && (
                        <DropdownMenuItem onClick={() => onView(customer)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                      )}
                      {canView && (
                        <DropdownMenuItem onClick={() => onPurchases(customer)}>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Purchases
                        </DropdownMenuItem>
                      )}
                      {canUpdate && (
                        <DropdownMenuItem onClick={() => onEdit(customer)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <DropdownMenuItem
                          onClick={() => onDelete(customer)}
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
          Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, customers.length)} of {customers.length}
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