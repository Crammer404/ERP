'use client';

import { useState } from 'react';
import { Discount } from '../services/discountService';
import { tenantContextService } from '@/services/tenant/tenantContextService';

export interface DiscountFormData {
  name: string;
  usages: string;
  start_date: string;
  end_date: string;
  value: string;
  value_in_percentage: string;
  classification: string;
}

export type DiscountType = 'fixed' | 'percentage' | '';

export function useDiscountForm() {
  const [formData, setFormData] = useState<DiscountFormData>({
    name: '',
    usages: '',
    start_date: '',
    end_date: '',
    value: '',
    value_in_percentage: '',
    classification: '',
  });

  const [discountType, setDiscountType] = useState<DiscountType>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({
      name: '',
      usages: '',
      start_date: '',
      end_date: '',
      value: '',
      value_in_percentage: '',
      classification: '',
    });
    setDiscountType('');
    setErrors({});
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const populateFormForEdit = (discount: Discount) => {
    const hasValue = discount.value && discount.value > 0;
    const hasPercentage = discount.value_in_percentage && discount.value_in_percentage > 0;

    // Determine discount type - prioritize fixed value if both exist (shouldn't happen in normalized data)
    let discountType: DiscountType = '';
    let value = '';
    let valueInPercentage = '';

    if (hasValue) {
      discountType = 'fixed';
      value = discount.value.toString();
      // Don't populate percentage field when editing fixed discount
    } else if (hasPercentage) {
      discountType = 'percentage';
      valueInPercentage = discount.value_in_percentage.toString();
      // Don't populate value field when editing percentage discount
    }

    setFormData({
      name: discount.name,
      usages: discount.usages.toString(),
      start_date: discount.start_date.split(' ')[0], // Format for date input (remove time part)
      end_date: discount.end_date.split(' ')[0],
      value: value,
      value_in_percentage: valueInPercentage,
      classification: discount.classification,
    });

    setDiscountType(discountType);
    setErrors({});
  };

  const validateForm = (isEdit: boolean = false) => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.usages || parseInt(formData.usages) < 1) newErrors.usages = "Usages must be 1 or greater";
    if (!formData.classification.trim()) newErrors.classification = "Classification is required";
    if (!formData.start_date) newErrors.start_date = "Start date is required";
    if (!formData.end_date) newErrors.end_date = "End date is required";

    // Proper date validation using Date objects
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);

      if (startDate > endDate) {
        newErrors.end_date = "End date must be on or after start date";
      }
    }

    // Validate based on selected discount type
    if (discountType === 'fixed') {
      if (!formData.value || parseFloat(formData.value) <= 0) {
        newErrors.value = "Fixed value must be greater than 0";
      }
    } else if (discountType === 'percentage') {
      if (!formData.value_in_percentage || parseFloat(formData.value_in_percentage) <= 0 || parseFloat(formData.value_in_percentage) > 100) {
        newErrors.value_in_percentage = "Percentage must be between 1 and 100";
      }
    } else {
      newErrors.value = "Please select a discount type";
    }

    return newErrors;
  };

  const prepareSubmitData = (isEdit = false) => {
    const usages = parseInt(formData.usages);
    const selectedBranch = tenantContextService.getStoredBranchContext();

    const createData: any = {
      name: formData.name,
      branch_id: selectedBranch?.id,
      usages: usages,
      start_date: `${formData.start_date} 00:00:00`, // Add time component
      end_date: `${formData.end_date} 23:59:59`, // Add time component
      classification: formData.classification,
    };

    // Explicitly set discount values - null for non-selected type
    if (discountType === 'fixed') {
      createData.value = formData.value ? parseFloat(formData.value) : null;
      createData.value_in_percentage = null;
    } else if (discountType === 'percentage') {
      createData.value = null;
      createData.value_in_percentage = formData.value_in_percentage ? parseFloat(formData.value_in_percentage) : null;
    } else {
      // No discount type selected
      createData.value = null;
      createData.value_in_percentage = null;
    }

    console.log('Prepare submit data:', createData);
    return createData;
  };

  return {
    formData,
    discountType,
    setDiscountType,
    errors,
    setErrors,
    resetForm,
    handleInputChange,
    populateFormForEdit,
    validateForm,
    prepareSubmitData
  };
}