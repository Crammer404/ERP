'use client';

import { useState } from 'react';
import { Tax } from '../services/taxService';

export interface TaxFormData {
  name: string;
  percentage: string;
  is_active: boolean;
  branch_id?: number;
}

export function useTaxForm() {
  const [formData, setFormData] = useState<TaxFormData>({
    name: '',
    percentage: '',
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({
      name: '',
      percentage: '',
      is_active: true,
    });
    setErrors({});
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const populateFormForEdit = (tax: Tax) => {
    setFormData({
      name: tax.name,
      percentage: tax.percentage.toString(),
      is_active: tax.is_active,
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.percentage || parseFloat(formData.percentage) <= 0 || parseFloat(formData.percentage) > 100) {
      newErrors.percentage = "Percentage must be between 0.01 and 100";
    }

    return newErrors;
  };

  const prepareSubmitData = (isEdit = false) => {
    return {
      name: formData.name,
      percentage: parseFloat(formData.percentage),
      is_active: formData.is_active,
    };
  };

  return {
    formData,
    errors,
    setErrors,
    resetForm,
    handleInputChange,
    populateFormForEdit,
    validateForm,
    prepareSubmitData
  };
}