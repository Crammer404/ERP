'use client';

import { useState } from 'react';
import { Expense, ExpenseAttachment } from '../services/expenseService';
import { tenantContextService } from '@/services/tenant/tenantContextService';

export interface ExpenseFormData {
  name: string;
  branch_id: string;
  area_of_expense: string;
  amount: string;
  expense_date: string;
  description: string;
  attachments: File[];
  attachment_ids_to_keep: number[];
  existing_attachments: ExpenseAttachment[];
}

export function useExpenseForm() {
  const [formData, setFormData] = useState<ExpenseFormData>({
    name: '',
    branch_id: '',
    area_of_expense: '',
    amount: '',
    expense_date: '',
    description: '',
    attachments: [],
    attachment_ids_to_keep: [],
    existing_attachments: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({
      name: '',
      branch_id: '',
      area_of_expense: '',
      amount: '',
      expense_date: '',
      description: '',
      attachments: [],
      attachment_ids_to_keep: [],
      existing_attachments: [],
    });
    setErrors({});
  };

  const handleInputChange = (field: string, value: string | File[] | number[] | ExpenseAttachment[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const populateFormForEdit = (expense: Expense) => {
    setFormData({
      name: expense.name,
      branch_id: expense.branch_id.toString(),
      area_of_expense: expense.area_of_expense,
      amount: expense.amount.toString(),
      expense_date: expense.expense_date.split('T')[0], // Fix date format for input
      description: expense.description || '',
      attachments: [],
      attachment_ids_to_keep: expense.attachments?.map(att => att.id) || [],
      existing_attachments: expense.attachments || [],
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.area_of_expense.trim()) newErrors.area_of_expense = "Area of expense is required";
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }
    if (!formData.expense_date) newErrors.expense_date = "Expense date is required";

    // Validate attachments (optional, but if provided, check file types)
    if (formData.attachments.length > 0) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      for (const file of formData.attachments) {
        if (!allowedTypes.includes(file.type)) {
          newErrors.attachments = "Only JPEG, JPG, PNG, PDF, DOC, and DOCX files are allowed";
          break;
        }
      }
    }

    return newErrors;
  };

  const prepareSubmitData = (isEdit = false) => {
    // Get selected branch from context
    const selectedBranch = tenantContextService.getStoredBranchContext();

    const submitData: any = {
      name: formData.name,
      branch_id: selectedBranch?.id || parseInt(formData.branch_id), // Use selected branch or fallback to form data
      area_of_expense: formData.area_of_expense,
      amount: parseFloat(formData.amount),
      expense_date: formData.expense_date,
      description: formData.description || undefined,
    };

    if (formData.attachments.length > 0) {
      submitData.attachments = formData.attachments;
    }

    if (isEdit && formData.attachment_ids_to_keep.length > 0) {
      submitData.attachment_ids_to_keep = formData.attachment_ids_to_keep;
    }

    return submitData;
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