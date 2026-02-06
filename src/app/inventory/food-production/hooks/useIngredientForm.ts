'use client';

import { useState, useEffect } from 'react';
import { Ingredient, Stock, fetchStocks } from '../services/ingredientService';
import { inventoryService } from '@/app/inventory/settings/services/inventoryService';

interface IngredientFormData {
  stock_id: string;
  name: string;
  description: string;
  quantity: string;
  unit: string;
  measurement_id: string;
  conversion_factor: string;
}

export function useIngredientForm(ingredient?: Ingredient | null) {
  const [formData, setFormData] = useState<IngredientFormData>({
    stock_id: '',
    name: '',
    description: '',
    quantity: '',
    unit: '',
    conversion_factor: '1',
  });

  const [stocks, setStocks] = useState<Stock[]>([]);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [loadingMeasurements, setLoadingMeasurements] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load stocks for dropdown
  useEffect(() => {
    const loadStocks = async () => {
      try {
        setLoadingStocks(true);
        const response = await fetchStocks();
        setStocks(response.data || []);
      } catch (error) {
        console.error('Failed to load stocks:', error);
      } finally {
        setLoadingStocks(false);
      }
    };

    loadStocks();
  }, []);

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
        stock_id: ingredient.stock_id.toString(),
        name: ingredient.name,
        description: ingredient.description || '',
        quantity: ingredient.quantity.toString(),
        unit: ingredient.unit || '',
        measurement_id: ingredient.measurement_id?.toString() || '',
        conversion_factor: ingredient.conversion_factor.toString(),
      });
    } else {
      // Reset form for new ingredient
      setFormData({
        stock_id: '',
        name: '',
        description: '',
        quantity: '',
        unit: '',
        measurement_id: '',
        conversion_factor: '1',
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

    if (!formData.stock_id) {
      newErrors.stock_id = 'Stock is required';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.quantity || parseFloat(formData.quantity) < 0) {
      newErrors.quantity = 'Quantity must be 0 or greater';
    }
    if (!formData.conversion_factor || parseFloat(formData.conversion_factor) <= 0) {
      newErrors.conversion_factor = 'Conversion factor must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getFormDataForSubmit = () => {
    return {
      stock_id: parseInt(formData.stock_id),
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      quantity: parseFloat(formData.quantity),
      unit: formData.unit.trim() || undefined,
      measurement_id: formData.measurement_id ? parseInt(formData.measurement_id) : undefined,
      conversion_factor: parseFloat(formData.conversion_factor),
    };
  };

  const resetForm = () => {
    setFormData({
      stock_id: '',
      name: '',
      description: '',
      quantity: '',
      unit: '',
      measurement_id: '',
      conversion_factor: '1',
    });
    setErrors({});
  };

  return {
    formData,
    stocks,
    measurements,
    loadingStocks,
    loadingMeasurements,
    errors,
    handleInputChange,
    validateForm,
    getFormDataForSubmit,
    resetForm,
    setErrors,
  };
}
