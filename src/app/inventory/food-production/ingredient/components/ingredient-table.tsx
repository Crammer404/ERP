'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Ingredient } from '../services/ingredient-service';
import { useCurrency } from '@/contexts/CurrencyContext';
import { RefreshButton } from '@/components/ui/refresh-button';

interface IngredientTableProps {
  ingredients: Ingredient[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  onEdit: (ingredient: Ingredient) => void;
  onDelete: (ingredient: Ingredient) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export function IngredientTable({
  ingredients,
  currentPage,
  setCurrentPage,
  onEdit,
  onDelete,
  onRefresh,
  loading = false,
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
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Name</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Cost Bulk Price</TableHead>
            <TableHead>Cost per Unit</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedIngredients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                No ingredients found.
              </TableCell>
            </TableRow>
          ) : (
            paginatedIngredients.map((ingredient) => {
              const unit =
                (ingredient.measurement && ingredient.measurement.symbol) ? ingredient.measurement.symbol : 
                (ingredient.measurement && ingredient.measurement.name) ? ingredient.measurement.name : 'unit';
              const quantityWithUnit = `${ingredient.quantity} ${unit}`;
              const costPrice = typeof ingredient.cost_price === 'number'
                ? ingredient.cost_price
                : ingredient.cost;
              const costPerUnit = ingredient.quantity > 0 ? costPrice / ingredient.quantity : 0;

              return (
                <TableRow key={ingredient.id} className="hover:bg-transparent">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                        {ingredient.image_path ? (
                          <img
                            src={ingredient.image_path}
                            alt={ingredient.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] text-muted-foreground">No Image</span>
                        )}
                      </div>
                      <span>{ingredient.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{quantityWithUnit}</TableCell>
                  <TableCell>
                    {(defaultCurrency?.symbol || '₱') + costPrice.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {(defaultCurrency?.symbol || '₱') + costPerUnit.toFixed(2)} / {unit}
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
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
