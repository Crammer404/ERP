'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Ingredient } from '../services/ingredientService';
import { useCurrency } from '@/contexts/CurrencyContext';

interface IngredientTableProps {
  ingredients: Ingredient[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  onEdit: (ingredient: Ingredient) => void;
  onDelete: (ingredient: Ingredient) => void;
}

export function IngredientTable({
  ingredients,
  currentPage,
  setCurrentPage,
  onEdit,
  onDelete,
}: IngredientTableProps) {
  const { defaultCurrency } = useCurrency();
  const itemsPerPage = 15;
  const totalPages = Math.ceil(ingredients.length / itemsPerPage);
  const paginatedIngredients = ingredients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStockDisplayName = (ingredient: Ingredient): string => {
    if (!ingredient.stock?.product) return 'N/A';
    const productName = ingredient.stock.product.name;
    const variant = ingredient.stock.variant_specification?.name;
    return variant ? `${productName} (${variant})` : productName;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Name</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead>Conversion Factor</TableHead>
          <TableHead>Cost per Unit</TableHead>
          <TableHead>Total Cost</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {paginatedIngredients.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
              No ingredients found.
            </TableCell>
          </TableRow>
        ) : (
          paginatedIngredients.map((ingredient) => (
            <TableRow key={ingredient.id} className="hover:bg-transparent">
              <TableCell className="font-medium">{ingredient.name}</TableCell>
              <TableCell>{getStockDisplayName(ingredient)}</TableCell>
              <TableCell>{ingredient.quantity}</TableCell>
              <TableCell>{ingredient.unit || '-'}</TableCell>
              <TableCell>{ingredient.conversion_factor}</TableCell>
              <TableCell>
                {defaultCurrency?.symbol || '₱'}
                {ingredient.cost.toFixed(2)}
              </TableCell>
              <TableCell>
                {defaultCurrency?.symbol || '₱'}
                {ingredient.total_cost.toFixed(2)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(ingredient)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(ingredient)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
