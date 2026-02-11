'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshButton } from '@/components/ui/refresh-button';

type RecipeRow = {
  id: number;
  productName: string;
  ingredientName: string;
  quantity: number;
  unit: string;
};

export function RecipesPage() {
  const [recipes, setRecipes] = useState<RecipeRow[]>([]);
  const [recipeForm, setRecipeForm] = useState({
    productName: '',
    ingredientName: '',
    quantity: '',
    unit: '',
  });
  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  const handleRecipeInputChange = (field: keyof typeof recipeForm, value: string) => {
    setRecipeForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddRecipe = () => {
    const trimmedProduct = recipeForm.productName.trim();
    const trimmedIngredient = recipeForm.ingredientName.trim();

    if (!trimmedProduct || !trimmedIngredient) {
      return;
    }

    const quantityValue = Number(recipeForm.quantity) || 0;

    const newRecipe: RecipeRow = {
      id: Date.now(),
      productName: trimmedProduct,
      ingredientName: trimmedIngredient,
      quantity: quantityValue,
      unit: recipeForm.unit.trim(),
    };

    setRecipes((prev) => [...prev, newRecipe]);
    setRecipeForm({
      productName: '',
      ingredientName: '',
      quantity: '',
      unit: '',
    });
  };

  const handleDeleteRecipe = (id: number) => {
    setRecipes((prev) => prev.filter((recipe) => recipe.id !== id));
  };

  return (
    <Card className="bg-transparent border-none shadow-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recipes</CardTitle>
            <CardDescription>Map products to ingredients with basic quantities.</CardDescription>
          </div>
          <RefreshButton onClick={handleRefresh} loading={loading} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Product name"
            value={recipeForm.productName}
            onChange={(e) => handleRecipeInputChange('productName', e.target.value)}
          />
          <Input
            placeholder="Ingredient name"
            value={recipeForm.ingredientName}
            onChange={(e) => handleRecipeInputChange('ingredientName', e.target.value)}
          />
          <Input
            type="number"
            placeholder="Quantity"
            value={recipeForm.quantity}
            onChange={(e) => handleRecipeInputChange('quantity', e.target.value)}
          />
          <div className="flex gap-2">
            <Input
              placeholder="Unit"
              value={recipeForm.unit}
              onChange={(e) => handleRecipeInputChange('unit', e.target.value)}
            />
            <Button onClick={handleAddRecipe} className="whitespace-nowrap">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Ingredient</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recipes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No recipes defined yet.
                </TableCell>
              </TableRow>
            ) : (
              recipes.map((recipe) => (
                <TableRow key={recipe.id}>
                  <TableCell>{recipe.productName}</TableCell>
                  <TableCell>{recipe.ingredientName}</TableCell>
                  <TableCell>{recipe.quantity}</TableCell>
                  <TableCell>{recipe.unit || '—'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRecipe(recipe.id)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
