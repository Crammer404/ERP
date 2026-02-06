'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Edit, Trash2, Paperclip, Ban } from 'lucide-react';
import { Expense, ExpenseAttachment } from '../services/expenseService';
import { AttachmentModal } from './AttachmentModal';
import { useCurrency } from '../../../contexts/CurrencyContext';

interface ExpenseTableProps {
  expenses: Expense[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export function ExpenseTable({
  expenses,
  currentPage,
  setCurrentPage,
  onEdit,
  onDelete,
  canUpdate = true,
  canDelete = true,
}: ExpenseTableProps) {
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<ExpenseAttachment[]>([]);
  const { defaultCurrency } = useCurrency();

  const itemsPerPage = 5;
  const totalPages = Math.ceil(expenses.length / itemsPerPage);
  const paginatedExpenses = expenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAttachmentClick = (attachments: ExpenseAttachment[]) => {
    setSelectedAttachments(attachments);
    setAttachmentModalOpen(true);
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '$0.00';

    if (defaultCurrency) {
      return `${defaultCurrency.symbol}${numAmount.toFixed(2)}`;
    }
    return `$${numAmount.toFixed(2)}`; // fallback to USD
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Name</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Area</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Attachments</TableHead>
            {(canUpdate || canDelete) && (
              <TableHead>Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedExpenses.map(expense => (
            <TableRow key={expense.id} className="hover:bg-transparent">
              <TableCell className="font-medium">{expense.name}</TableCell>
              <TableCell>{expense.branch_name || 'N/A'}</TableCell>
              <TableCell>{expense.area_of_expense}</TableCell>
              <TableCell>{formatCurrency(expense.amount)}</TableCell>
              <TableCell>{formatDate(expense.expense_date)}</TableCell>
              <TableCell>
                {expense.attachments && expense.attachments.length > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1"
                    onClick={() => handleAttachmentClick(expense.attachments!)}
                  >
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Paperclip className="h-3 w-3" />
                      {expense.attachments.length}
                    </Badge>
                  </Button>
                ) : (
                  <span className="text-muted-foreground text-sm">None</span>
                )}
              </TableCell>
              <TableCell>
                {(canUpdate || canDelete) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center">
                      {canUpdate && (
                        <DropdownMenuItem onClick={() => onEdit(expense)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <DropdownMenuItem
                          onClick={() => onDelete(expense)}
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
          Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, expenses.length)} of {expenses.length}
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

      <AttachmentModal
        isOpen={attachmentModalOpen}
        onOpenChange={setAttachmentModalOpen}
        attachments={selectedAttachments}
      />
    </>
  );
}