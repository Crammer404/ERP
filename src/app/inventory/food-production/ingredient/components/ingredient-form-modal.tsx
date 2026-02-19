'use client';

import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
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

type DateField = 'purchase_date' | 'expiry_date';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDate = (value: string): Date | undefined => {
  if (!datePattern.test(value)) {
    return undefined;
  }

  const [yearPart, monthPart, dayPart] = value.split('-');
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);
  const parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return undefined;
  }

  return parsedDate;
};

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
  const [purchaseDateInput, setPurchaseDateInput] = useState('');
  const [expiryDateInput, setExpiryDateInput] = useState('');
  const [isPurchaseCalendarOpen, setIsPurchaseCalendarOpen] = useState(false);
  const [isExpiryCalendarOpen, setIsExpiryCalendarOpen] = useState(false);
  const wasOpenRef = useRef(isOpen);

  const clearDateError = (field: DateField) => {
    setErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }

      const nextErrors = { ...prev };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const setDateError = (field: DateField) => {
    setErrors((prev) => ({
      ...prev,
      [field]: 'Date must be in YYYY-MM-DD format',
    }));
  };

  const validateAndSyncDate = (field: DateField, rawValue: string): boolean => {
    const value = rawValue.trim();
    if (!value) {
      handleInputChange(field, '');
      clearDateError(field);
      return true;
    }

    const parsedDate = parseDate(value);
    if (!parsedDate) {
      setDateError(field);
      return false;
    }

    const normalizedValue = formatDate(parsedDate);
    if (field === 'purchase_date') {
      setPurchaseDateInput(normalizedValue);
    } else {
      setExpiryDateInput(normalizedValue);
    }
    handleInputChange(field, normalizedValue);
    clearDateError(field);
    return true;
  };

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

  useEffect(() => {
    setPurchaseDateInput(formData.purchase_date || '');
  }, [formData.purchase_date]);

  useEffect(() => {
    setExpiryDateInput(formData.expiry_date || '');
  }, [formData.expiry_date]);

  useEffect(() => {
    if (!isOpen) {
      setIsPurchaseCalendarOpen(false);
      setIsExpiryCalendarOpen(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasValidPurchaseDate = validateAndSyncDate('purchase_date', purchaseDateInput);
    const hasValidExpiryDate = validateAndSyncDate('expiry_date', expiryDateInput);

    if (hasValidPurchaseDate && hasValidExpiryDate && validateForm()) {
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
              </>
            )}

            {/* Stock section: shown in create & restock, hidden in pure edit */}
            {effectiveMode !== 'edit' && (
              <>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purchase_date">Purchase Date</Label>
                    <Popover open={isPurchaseCalendarOpen} onOpenChange={setIsPurchaseCalendarOpen}>
                      <div className="relative">
                        <PopoverAnchor asChild>
                          <Input
                            id="purchase_date"
                            type="text"
                            inputMode="numeric"
                            disabled={isLoading}
                            value={purchaseDateInput}
                            onChange={(e) => {
                              const value = e.target.value;
                              setPurchaseDateInput(value);
                              if (!value.trim()) {
                                handleInputChange('purchase_date', '');
                                clearDateError('purchase_date');
                                return;
                              }
                              const parsedDate = parseDate(value);
                              if (parsedDate) {
                                handleInputChange('purchase_date', formatDate(parsedDate));
                                clearDateError('purchase_date');
                              }
                            }}
                            onBlur={() => {
                              validateAndSyncDate('purchase_date', purchaseDateInput);
                            }}
                            placeholder="YYYY-MM-DD"
                            className="pr-10"
                          />
                        </PopoverAnchor>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={isLoading}
                            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                          >
                            <CalendarIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                      </div>
                      <PopoverContent
                        className="z-[70] w-auto p-0"
                        align="start"
                        side="bottom"
                        sideOffset={8}
                        avoidCollisions={false}
                      >
                        <Calendar
                          mode="single"
                          selected={parseDate(formData.purchase_date)}
                          onSelect={(date) => {
                            const value = date ? formatDate(date) : '';
                            setPurchaseDateInput(value);
                            handleInputChange('purchase_date', value);
                            clearDateError('purchase_date');
                            setIsPurchaseCalendarOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {allErrors.purchase_date && <p className="text-red-500 text-sm">{allErrors.purchase_date}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiry_date">Expiry Date</Label>
                    <Popover open={isExpiryCalendarOpen} onOpenChange={setIsExpiryCalendarOpen}>
                      <div className="relative">
                        <PopoverAnchor asChild>
                          <Input
                            id="expiry_date"
                            type="text"
                            inputMode="numeric"
                            disabled={isLoading}
                            value={expiryDateInput}
                            onChange={(e) => {
                              const value = e.target.value;
                              setExpiryDateInput(value);
                              if (!value.trim()) {
                                handleInputChange('expiry_date', '');
                                clearDateError('expiry_date');
                                return;
                              }
                              const parsedDate = parseDate(value);
                              if (parsedDate) {
                                handleInputChange('expiry_date', formatDate(parsedDate));
                                clearDateError('expiry_date');
                              }
                            }}
                            onBlur={() => {
                              validateAndSyncDate('expiry_date', expiryDateInput);
                            }}
                            placeholder="YYYY-MM-DD"
                            className="pr-10"
                          />
                        </PopoverAnchor>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={isLoading}
                            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                          >
                            <CalendarIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                      </div>
                      <PopoverContent
                        className="z-[70] w-auto p-0"
                        align="start"
                        side="bottom"
                        sideOffset={8}
                        avoidCollisions={false}
                      >
                        <Calendar
                          mode="single"
                          selected={parseDate(formData.expiry_date)}
                          onSelect={(date) => {
                            const value = date ? formatDate(date) : '';
                            setExpiryDateInput(value);
                            handleInputChange('expiry_date', value);
                            clearDateError('expiry_date');
                            setIsExpiryCalendarOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {allErrors.expiry_date && <p className="text-red-500 text-sm">{allErrors.expiry_date}</p>}
                  </div>
                </div>

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
                    <Label htmlFor="measurement_id">
                      Measurement Unit <span className="text-red-500">*</span>
                    </Label>
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
