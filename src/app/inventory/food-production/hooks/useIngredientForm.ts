'use client';

import { useState, useEffect } from 'react';
import { Ingredient } from '../services/ingredientService';
import { inventoryService } from '@/app/inventory/settings/services/inventoryService';

interface IngredientFormData {
  name: string;
  description: string;
  quantity: string;
  unit: string;
  measurement_id: string;
}

export function useIngredientForm(ingredient?: Ingredient | null) {
  const [formData, setFormData] = useState<IngredientFormData>({
    name: '',
    description: '',
    quantity: '',
    unit: '',
    measurement_id: '',
  });

  const [measurements, setMeasurements] = useState<any[]>([]);
  const [loadingMeasurements, setLoadingMeasurements] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load measurements for dropdown
  useEffect(() => {
    const loadMeasurements = async () => {
      try {
        setLoadingMeasurements(true);
        const measurementsList = await inventoryService.getMeasurements();
        setMeasurements(measurementsList || []);
      } catch (error) {
        console.error('Failed to load measurements:', error);
      } finally {
        setLoadingMeasurements(false);
      }
    };

    loadMeasurements();
  }, []);

  // Initialize form data when editing
  useEffect(() => {
    if (ingredient) {
      setFormData({
        name: ingredient.name,
        description: ingredient.description || '',
        quantity: ingredient.quantity.toString(),
        unit: ingredient.unit || '',
        measurement_id: ingredient.measurement_id?.toString() || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        quantity: '',
        unit: '',
        measurement_id: '',
      });
    }
    setErrors({});
  }, [ingredient]);

  const handleInputChange = (field: keyof IngredientFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.quantity || parseFloat(formData.quantity) < 0) {
      newErrors.quantity = 'Quantity must be 0 or greater';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getFormDataForSubmit = () => {
    return {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      quantity: parseFloat(formData.quantity),
      unit: formData.unit.trim() || undefined,
      measurement_id: formData.measurement_id ? parseInt(formData.measurement_id) : undefined,
    };
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      quantity: '',
      unit: '',
      measurement_id: '',
    });
    setErrors({});
  };

  return {
    formData,
    measurements,
    loadingMeasurements,
    errors,
    handleInputChange,
    validateForm,
    getFormDataForSubmit,
    resetForm,
    setErrors,
  };
}
