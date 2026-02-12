'use client';

import { useState, useEffect } from 'react';
import { Ingredient } from '../services/ingredient-service';
import { inventoryService } from '@/app/inventory/settings/services/inventoryService';

interface IngredientFormData {
  name: string;
  description: string;
  quantity: string;
  unit: string;
  measurement_id: string;
  cost_price: string;
  category: string;
  purchase_date: string;
  expiry_date: string;
}

export type IngredientFormMode = 'create' | 'edit' | 'restock';

export function useIngredientForm(ingredient?: Ingredient | null, mode: IngredientFormMode = 'create') {
  const [formData, setFormData] = useState<IngredientFormData>({
    name: '',
    description: '',
    quantity: '',
    unit: '',
    measurement_id: '',
    cost_price: '',
    category: '',
    purchase_date: '',
    expiry_date: '',
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

  // Initialize form data based on mode and ingredient
  useEffect(() => {
    if (ingredient) {
      if (mode === 'edit') {
        // Prefill metadata only
        setFormData({
          name: ingredient.name,
          description: ingredient.description || '',
          quantity: ingredient.quantity.toString(),
          unit: '',
          measurement_id: ingredient.measurement_id?.toString() || '',
          cost_price: ingredient.cost_price != null ? ingredient.cost_price.toString() : '',
          category: ingredient.category || '',
          purchase_date: '',
          expiry_date: '',
        });
      } else if (mode === 'restock') {
        // For restock, keep metadata implied, but focus on stock fields
        setFormData({
          name: ingredient.name,
          description: ingredient.description || '',
          // For restock, user enters a new quantity and cost_price
          quantity: '',
          unit: '',
          measurement_id: ingredient.measurement_id?.toString() || '',
          cost_price: '',
          category: ingredient.category || '',
          // default purchase date to today for convenience
          purchase_date: new Date().toISOString().slice(0, 10),
          expiry_date: '',
        });
      } else {
        // create mode shouldn't normally receive an ingredient, but handle gracefully
        setFormData({
          name: ingredient.name,
          description: ingredient.description || '',
          quantity: ingredient.quantity.toString(),
          unit: '',
          measurement_id: ingredient.measurement_id?.toString() || '',
          cost_price: ingredient.cost_price != null ? ingredient.cost_price.toString() : '',
          category: ingredient.category || '',
          purchase_date: '',
          expiry_date: '',
        });
      }
    } else {
      // No ingredient: blank form (create)
      setFormData({
        name: '',
        description: '',
        quantity: '',
        unit: '',
        measurement_id: '',
        cost_price: '',
        category: '',
        purchase_date: '',
        expiry_date: '',
      });
    }
    setErrors({});
  }, [ingredient, mode]);

  const handleInputChange = (field: keyof IngredientFormData, value: string) => {
    const nextValue = field === 'category' ? value.toUpperCase() : value;
    setFormData((prev) => ({
      ...prev,
      [field]: nextValue,
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

    if (mode === 'create') {
      if (!formData.quantity || parseFloat(formData.quantity) < 0) {
        newErrors.quantity = 'Quantity must be 0 or greater';
      }
      if (!formData.cost_price || parseFloat(formData.cost_price) < 0) {
        newErrors.cost_price = 'Cost price must be 0 or greater';
      }
    } else if (mode === 'restock') {
      // For restock we require strictly positive quantity, and non-negative cost_price
      if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
        newErrors.quantity = 'Quantity must be greater than 0';
      }
      if (!formData.cost_price || parseFloat(formData.cost_price) < 0) {
        newErrors.cost_price = 'Cost price must be 0 or greater';
      }
    } else {
      // edit mode: metadata-only, no quantity/cost requirements
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getFormDataForSubmit = () => {
    if (mode === 'edit') {
      // Only metadata fields for edit; quantity/cost handled via stock logs
      return {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        unit: formData.unit.trim() || undefined,
        measurement_id: formData.measurement_id ? parseInt(formData.measurement_id) : undefined,
        category: formData.category.trim() || undefined,
      };
    }

    if (mode === 'restock') {
      // Restock payload: quantity and cost_price (bulk cost) plus measurement/unit context
      return {
        quantity: formData.quantity ? parseFloat(formData.quantity) : 0,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : 0,
        unit: formData.unit.trim() || undefined,
        measurement_id: formData.measurement_id ? parseInt(formData.measurement_id) : undefined,
        purchase_date: formData.purchase_date || undefined,
        expiry_date: formData.expiry_date || undefined,
      };
    }

    // create mode: full payload
    return {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      quantity: formData.quantity ? parseFloat(formData.quantity) : 0,
      unit: formData.unit.trim() || undefined,
      measurement_id: formData.measurement_id ? parseInt(formData.measurement_id) : undefined,
      cost_price: formData.cost_price ? parseFloat(formData.cost_price) : undefined,
      category: formData.category.trim() || undefined,
      purchase_date: formData.purchase_date || undefined,
      expiry_date: formData.expiry_date || undefined,
    };
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      quantity: '',
      unit: '',
      measurement_id: '',
      cost_price: '',
      category: '',
      purchase_date: '',
      expiry_date: '',
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
