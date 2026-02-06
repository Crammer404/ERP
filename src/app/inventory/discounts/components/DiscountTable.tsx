'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit, Trash2, Tag, FileText } from 'lucide-react';
import { Discount } from '../services/discountService';
import { formatHumanDate } from '@/lib/dateUtils';
import { useCurrency } from '@/contexts/CurrencyContext';
import { AssignDiscountModal } from './AssignDiscountModal';
import { DiscountLogsModal } from './DiscountLogsModal';
import { useState } from 'react';

interface DiscountTableProps {
  discounts: Discount[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  onEdit: (discount: Discount) => void;
  onDelete: (discount: Discount) => void;
  onAssign?: (discount: Discount) => void;
}

export function DiscountTable({
  discounts,
  currentPage,
  setCurrentPage,
  onEdit,
  onDelete,
  onAssign
}: DiscountTableProps) {
  const { defaultCurrency } = useCurrency();
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [selectedDiscountForLogs, setSelectedDiscountForLogs] = useState<Discount | null>(null);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(discounts.length / itemsPerPage);
  const paginatedDiscounts = discounts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getDiscountStatus = (discount: Discount): { status: string; color: string } => {
    const now = new Date();
    const startDate = new Date(discount.start_date);
    const endDate = new Date(discount.end_date);

    // Check if expired
    if (now > endDate) {
      return { status: 'Expired', color: 'text-red-600 bg-red-50' };
    }

    // Check if not available (no usages left or not started yet)
    if (discount.usages <= 0 || now < startDate) {
      return { status: 'Not Available', color: 'text-orange-600 bg-orange-50' };
    }

    // Available
    return { status: 'Available', color: 'text-green-600 bg-green-50' };
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Name</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Classification</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Usages</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Valid Period</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedDiscounts.map((discount) => {
            const { status, color } = getDiscountStatus(discount);
            return (
              <TableRow key={discount.id} className="hover:bg-transparent">
                <TableCell>{discount.name}</TableCell>
                <TableCell>{discount.branch?.name || '-'}</TableCell>
                <TableCell>{discount.classification}</TableCell>
                <TableCell>
                  {discount.value_in_percentage
                    ? `${discount.value_in_percentage}%`
                    : discount.value
                    ? `${defaultCurrency?.symbol || '₱'}${discount.value}`
                    : '-'
                  }
                </TableCell>
                <TableCell>{discount.usages}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
                    {status}
                  </span>
                </TableCell>
                <TableCell>
                  {new Date(discount.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(discount.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center">
                      <DropdownMenuItem onClick={() => onEdit(discount)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setSelectedDiscount(discount);
                        setIsAssignModalOpen(true);
                      }}>
                        <Tag className="h-4 w-4 mr-2" />
                        Assign
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setSelectedDiscountForLogs(discount);
                        setIsLogsModalOpen(true);
                      }}>
                        <FileText className="h-4 w-4 mr-2" />
                        Logs
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(discount)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
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

      <div className="flex justify-between items-center mt-6">
        <p className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, discounts.length)} of {discounts.length}
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

      <AssignDiscountModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setSelectedDiscount(null);
        }}
        discount={selectedDiscount}
      />

      <DiscountLogsModal
        isOpen={isLogsModalOpen}
        onClose={() => {
          setIsLogsModalOpen(false);
          setSelectedDiscountForLogs(null);
        }}
        discount={selectedDiscountForLogs}
      />
    </>
  );
}