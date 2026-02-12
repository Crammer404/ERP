'use client';

import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIngredientForm, IngredientFormMode } from '../hooks/use-ingredient-form';
import { Ingredient } from '../services/ingredient-service';

interface IngredientFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isEdit?: boolean;
  mode?: IngredientFormMode;
  ingredient?: Ingredient | null;
  isLoading: boolean;
  onSubmit: (formData: any) => void;
  errors: Record<string, string>;
}

export function IngredientFormModal({
  isOpen,
  onOpenChange,
  isEdit = false,
  mode,
  ingredient,
  isLoading,
  onSubmit,
  errors: externalErrors,
}: IngredientFormModalProps) {
  const effectiveMode: IngredientFormMode = mode ?? (isEdit ? 'edit' : 'create');
  const {
    formData,
    measurements,
    loadingMeasurements,
    errors: formErrors,
    handleInputChange,
    validateForm,
    getFormDataForSubmit,
    resetForm,
    setErrors,
  } = useIngredientForm(ingredient, effectiveMode);

  const allErrors = { ...formErrors, ...externalErrors };
  const selectedMeasurement = measurements.find(
    (measurement: any) => measurement.id.toString() === formData.measurement_id
  );
  const unitLabel =
    selectedMeasurement && typeof selectedMeasurement.name === 'string'
      ? `${selectedMeasurement.name}${selectedMeasurement.symbol ? ` (${selectedMeasurement.symbol})` : ''}`
      : formData.unit || 'unit';
  const quantityNumber = parseFloat(formData.quantity || '');
  const costPriceNumber = parseFloat(formData.cost_price || '');
  const costPerUnit =
    !Number.isNaN(quantityNumber) && quantityNumber > 0 && !Number.isNaN(costPriceNumber)
      ? (costPriceNumber / quantityNumber).toFixed(2)
      : '';
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const wasOpenRef = useRef(isOpen);

  useEffect(() => {
    if (ingredient?.image_path) {
      setImagePreview(ingredient.image_path);
      setImageFile(null);
    } else {
      setImagePreview('');
      setImageFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [ingredient]);

  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    if (!wasOpen && isOpen && !isEdit && !ingredient) {
      resetForm();
      setImagePreview('');
      setImageFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setErrors({});
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, isEdit, ingredient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const submitData = getFormDataForSubmit();
      if (effectiveMode === 'create' || effectiveMode === 'edit') {
        onSubmit({ ...submitData, image: imageFile ?? undefined });
      } else {
        // restock mode: no image upload, only stock-related fields
        onSubmit(submitData);
      }
    }
  };

  const handleClose = () => {
    resetForm();
    setImagePreview('');
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-2xl"
        onInteractOutside={(event) => event.preventDefault()}
      >
          <DialogHeader>
          <DialogTitle>
            {effectiveMode === 'restock'
              ? `Restock ${ingredient?.name || 'Ingredient'}`
              : isEdit
                ? 'Edit Ingredient'
                : 'Add New Ingredient'}
          </DialogTitle>
          <DialogDescription>
            {effectiveMode === 'restock'
              ? 'Add new stock for this ingredient by specifying the quantity and purchase cost.'
              : isEdit
                ? 'Update ingredient details below.'
                : 'Enter ingredient details below. Fields marked with * are required.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 flex max-h-[70vh] flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto pl-1 pr-1 pb-2">
            {/* Metadata section: shown in create & edit, hidden in restock */}
            {effectiveMode !== 'restock' && (
              <>
                <div className="grid grid-cols-[auto,1fr] items-end gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Image</Label>
                    <div className="relative w-[140px] h-[140px] border rounded-md flex items-center justify-center overflow-hidden bg-gray-50">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">Upload file</span>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        disabled={isLoading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setImageFile(file);
                            setImagePreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                      {imagePreview && (
                        <div className="absolute top-2 right-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview('');
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                            }}
                            className="p-1 rounded-md bg-black/50 text-white hover:bg-black/70 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 w-full">
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
                </div>

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

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    type="text"
                    disabled={isLoading}
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    placeholder="e.g. MEAT, VEGETABLES"
                  />
                  {allErrors.category && <p className="text-red-500 text-sm">{allErrors.category}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Purchase Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.purchase_date && "text-muted-foreground"
                          )}
                          disabled={isLoading}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.purchase_date
                            ? new Date(formData.purchase_date).toLocaleDateString()
                            : "Select purchase date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.purchase_date ? new Date(formData.purchase_date) : undefined}
                          onSelect={(date) =>
                            handleInputChange(
                              "purchase_date",
                              date ? date.toISOString().slice(0, 10) : ""
                            )
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Expiry Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.expiry_date && "text-muted-foreground"
                          )}
                          disabled={isLoading}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.expiry_date
                            ? new Date(formData.expiry_date).toLocaleDateString()
                            : "Select expiry date (optional)"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.expiry_date ? new Date(formData.expiry_date) : undefined}
                          onSelect={(date) =>
                            handleInputChange(
                              "expiry_date",
                              date ? date.toISOString().slice(0, 10) : ""
                            )
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </>
            )}

            {/* Stock section: shown in create & restock, hidden in pure edit */}
            {effectiveMode !== 'edit' && (
              <>
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
                            {`${measurement.name}${measurement.symbol ? ` (${measurement.symbol})` : ''}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {allErrors.measurement_id && <p className="text-red-500 text-sm">{allErrors.measurement_id}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cost_price">
                      Cost Price <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="cost_price"
                      type="number"
                      step="0.01"
                      min="0"
                      disabled={isLoading}
                      value={formData.cost_price}
                      onChange={(e) => handleInputChange('cost_price', e.target.value)}
                      placeholder="0.00"
                    />
                    {allErrors.cost_price && <p className="text-red-500 text-sm">{allErrors.cost_price}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cost_per_unit">Cost per {unitLabel}</Label>
                    <Input
                      id="cost_per_unit"
                      type="text"
                      disabled
                      value={costPerUnit}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </>
            )}

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
