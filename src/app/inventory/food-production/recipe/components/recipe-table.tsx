'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Recipe } from '../services/recipe-service';

interface RecipeTableProps {
  recipes: Recipe[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export function RecipeTable({
  recipes,
  currentPage,
  setCurrentPage,
  onEdit,
  onDelete,
  onRefresh,
  loading = false,
}: RecipeTableProps) {
  const itemsPerPage = 15;
  const totalPages = Math.ceil(recipes.length / itemsPerPage);
  const paginatedRecipes = recipes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Product</TableHead>
            <TableHead>Ingredients</TableHead>
            <TableHead>Max Producible</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedRecipes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                No recipes found.
              </TableCell>
            </TableRow>
          ) : (
            paginatedRecipes.map((recipe) => {
              const ingredientCount = recipe.items?.length || 0;
              const maxProducible = recipe.max_producible_quantity ?? 0;

              return (
                <TableRow key={recipe.id} className="hover:bg-transparent">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                        {recipe.product?.display_image ? (
                          <img
                            src={recipe.product.display_image}
                            alt={recipe.product?.name || 'Product'}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] text-muted-foreground">No Image</span>
                        )}
                      </div>
                      <span>{recipe.product?.name || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {ingredientCount} {ingredientCount === 1 ? 'ingredient' : 'ingredients'}
                  </TableCell>
                  <TableCell>
                    {maxProducible > 0 ? maxProducible : '0'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(recipe)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(recipe)}
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
