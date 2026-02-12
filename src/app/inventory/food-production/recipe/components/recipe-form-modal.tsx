'use client';

import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRecipeForm } from '../hooks/use-recipe-form';
import { Recipe } from '../services/recipe-service';
import { Plus, Trash2 } from 'lucide-react';

interface RecipeFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isEdit?: boolean;
  recipe?: Recipe | null;
  isLoading: boolean;
  onSubmit: (formData: any) => void;
  errors: Record<string, string>;
}

export function RecipeFormModal({
  isOpen,
  onOpenChange,
  isEdit = false,
  recipe,
  isLoading,
  onSubmit,
  errors: externalErrors,
}: RecipeFormModalProps) {
  const {
    formData,
    products,
    ingredients,
    loadingProducts,
    loadingIngredients,
    errors: formErrors,
    handleInputChange,
    handleItemChange,
    addItem,
    removeItem,
    validateForm,
    getFormDataForSubmit,
    resetForm,
    setErrors,
  } = useRecipeForm(recipe);

  const allErrors = { ...formErrors, ...externalErrors };

  const getIngredientMeasurement = (ingredientId: string) => {
    const ingredient = ingredients.find(ing => ing.id.toString() === ingredientId);
    return ingredient?.measurement?.symbol || ingredient?.measurement?.name || 'unit';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const submitData = getFormDataForSubmit();
      onSubmit(submitData);
    }
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Recipe' : 'Add New Recipe'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update recipe details below.'
              : 'Enter recipe details below. Fields marked with * are required.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col">
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product_id">
                Product <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.product_id}
                onValueChange={(value) => handleInputChange('product_id', value)}
                disabled={isLoading || loadingProducts}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {allErrors.product_id && <p className="text-red-500 text-sm">{allErrors.product_id}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  Ingredients <span className="text-red-500">*</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Ingredient
                </Button>
              </div>

              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-md">
                  <div className="col-span-5 space-y-2">
                    <Label htmlFor={`ingredient_${index}`}>Ingredient</Label>
                    <Select
                      value={item.ingredient_id}
                      onValueChange={(value) => handleItemChange(index, 'ingredient_id', value)}
                      disabled={isLoading || loadingIngredients}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ingredient" />
                      </SelectTrigger>
                      <SelectContent>
                        {ingredients.map((ingredient) => (
                          <SelectItem key={ingredient.id} value={ingredient.id.toString()}>
                            {ingredient.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {allErrors[`items.${index}.ingredient_id`] && (
                      <p className="text-red-500 text-xs">{allErrors[`items.${index}.ingredient_id`]}</p>
                    )}
                  </div>

                  <div className="col-span-3 space-y-2">
                    <Label htmlFor={`quantity_${index}`}>Quantity</Label>
                    <Input
                      id={`quantity_${index}`}
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      disabled={isLoading}
                      placeholder="0.000"
                    />
                    {allErrors[`items.${index}.quantity`] && (
                      <p className="text-red-500 text-xs">{allErrors[`items.${index}.quantity`]}</p>
                    )}
                  </div>

                  <div className="col-span-3 space-y-2">
                    <Label>Unit</Label>
                    <Input
                      type="text"
                      value={item.ingredient_id ? getIngredientMeasurement(item.ingredient_id) : ''}
                      disabled
                      placeholder="Unit"
                    />
                  </div>

                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={isLoading || formData.items.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}

              {allErrors.items && <p className="text-red-500 text-sm">{allErrors.items}</p>}
            </div>

            {allErrors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{allErrors.general}</p>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 shrink-0">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
