'use client';

import { useState } from 'react';
import { Tax } from '../services/tax-service';

export interface TaxFormData {
  name: string;
  is_global: boolean;
  is_percent: boolean;
  percentage: string;
  is_active: boolean;
  branch_id?: number;
}

export function useTaxForm() {
  const [formData, setFormData] = useState<TaxFormData>({
    name: '',
    is_global: false,
    is_percent: true,
    percentage: '',
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({
      name: '',
      is_global: false,
      is_percent: true,
      percentage: '',
      is_active: true,
    });
    setErrors({});
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'is_global' && value === true) {
        updated.branch_id = undefined;
      }
      if (field === 'is_percent' && value === false) {
        const percentage = parseFloat(prev.percentage);
        if (percentage > 100) {
          updated.percentage = '';
        }
      }
      return updated;
    });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const populateFormForEdit = (tax: Tax) => {
    setFormData({
      name: tax.name,
      is_global: tax.is_global,
      is_percent: tax.is_percent,
      percentage: tax.percentage.toString(),
      is_active: tax.is_active,
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    
    const percentageValue = parseFloat(formData.percentage);
    if (!formData.percentage || isNaN(percentageValue) || percentageValue <= 0) {
      newErrors.percentage = formData.is_percent 
        ? "Percentage must be greater than 0" 
        : "Amount must be greater than 0";
    } else if (formData.is_percent && percentageValue > 100) {
      newErrors.percentage = "Percentage cannot exceed 100";
    }

    return newErrors;
  };

  const prepareSubmitData = (isEdit = false) => {
    return {
      name: formData.name,
      is_global: formData.is_global,
      is_percent: formData.is_percent,
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