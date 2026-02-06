'use client';

import { useState } from 'react';
import { Currency } from '../services/currencyService';

export interface CurrencyFormData {
  name: string;
  symbol: string;
}

export function useCurrencyForm() {
  const [formData, setFormData] = useState<CurrencyFormData>({
    name: '',
    symbol: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({
      name: '',
      symbol: '',
    });
    setErrors({});
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const populateFormForEdit = (currency: Currency) => {
    setFormData({
      name: currency.name,
      symbol: currency.symbol,
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.symbol.trim()) newErrors.symbol = "Symbol is required";

    return newErrors;
  };

  const prepareSubmitData = (isEdit = false) => {
    return {
      name: formData.name,
      symbol: formData.symbol,
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