'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIngredientForm } from '../hooks/useIngredientForm';
import { Ingredient } from '../services/ingredientService';

interface IngredientFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isEdit?: boolean;
  ingredient?: Ingredient | null;
  isLoading: boolean;
  onSubmit: (formData: any) => void;
  errors: Record<string, string>;
}

export function IngredientFormModal({
  isOpen,
  onOpenChange,
  isEdit = false,
  ingredient,
  isLoading,
  onSubmit,
  errors: externalErrors,
}: IngredientFormModalProps) {
  const {
    formData,
    stocks,
    measurements,
    loadingStocks,
    loadingMeasurements,
    errors: formErrors,
    handleInputChange,
    validateForm,
    getFormDataForSubmit,
    resetForm,
    setErrors,
  } = useIngredientForm(ingredient);

  // Merge external errors with form errors
  const allErrors = { ...formErrors, ...externalErrors };

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

  const selectedStock = stocks.find((s) => s.id.toString() === formData.stock_id);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Ingredient' : 'Add New Ingredient'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update ingredient details below.'
              : 'Enter ingredient details below. Fields marked with * are required.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Stock Selection */}
          <div className="space-y-2">
            <Label htmlFor="stock_id">
              Stock <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.stock_id}
              onValueChange={(value) => handleInputChange('stock_id', value)}
              disabled={isLoading || loadingStocks}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a stock" />
              </SelectTrigger>
              <SelectContent>
                {stocks.map((stock) => {
                  const productName = stock.product?.name || 'Unknown Product';
                  const variant = stock.variant_specification?.name;
                  const displayName = variant ? `${productName} (${variant})` : productName;
                  return (
                    <SelectItem key={stock.id} value={stock.id.toString()}>
                      {displayName}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {allErrors.stock_id && <p className="text-red-500 text-sm">{allErrors.stock_id}</p>}
            {selectedStock && (
              <p className="text-sm text-muted-foreground">
                Stock Cost: {selectedStock.cost} | Available Quantity: {selectedStock.quantity}
              </p>
            )}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              disabled={isLoading}
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter ingredient name"
            />
            {allErrors.name && <p className="text-red-500 text-sm">{allErrors.name}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              disabled={isLoading}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter ingredient description (optional)"
              rows={3}
            />
            {allErrors.description && <p className="text-red-500 text-sm">{allErrors.description}</p>}
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantity <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                step="0.001"
                min="0"
                disabled={isLoading}
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                placeholder="0.000"
              />
              {allErrors.quantity && <p className="text-red-500 text-sm">{allErrors.quantity}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="measurement_id">Measurement Unit</Label>
              <Select
                value={formData.measurement_id}
                onValueChange={(value) => handleInputChange('measurement_id', value)}
                disabled={isLoading || loadingMeasurements}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a measurement unit" />
                </SelectTrigger>
                <SelectContent>
                  {measurements.map((measurement) => (
                    <SelectItem key={measurement.id} value={measurement.id.toString()}>
                      {measurement.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {allErrors.measurement_id && <p className="text-red-500 text-sm">{allErrors.measurement_id}</p>}
            </div>
          </div>

          {/* Conversion Factor */}
          <div className="space-y-2">
            <Label htmlFor="conversion_factor">
              Conversion Factor <span className="text-red-500">*</span>
            </Label>
            <Input
              id="conversion_factor"
              type="number"
              step="0.0001"
              min="0.0001"
              disabled={isLoading}
              value={formData.conversion_factor}
              onChange={(e) => handleInputChange('conversion_factor', e.target.value)}
              placeholder="1.0000"
            />
            <p className="text-xs text-muted-foreground">
              Factor to convert stock cost to ingredient cost per unit
            </p>
            {allErrors.conversion_factor && (
              <p className="text-red-500 text-sm">{allErrors.conversion_factor}</p>
            )}
          </div>

          {allErrors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{allErrors.general}</p>
            </div>
          )}

          <DialogFooter>
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
