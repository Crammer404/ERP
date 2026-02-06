// src/services/expenseService.ts
import { api } from "../../../services/api";
import { API_ENDPOINTS } from "../../../config/api.config";

export interface ExpenseAttachment {
  id: number;
  expense_id: number;
  attachment: string;
  file_name: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: number;
  name: string;
  branch_id: number;
  branch_name?: string;
  area_of_expense: string;
  amount: number;
  expense_date: string;
  description?: string;
  attachments?: ExpenseAttachment[];
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseRequest {
  name: string;
  branch_id: number;
  area_of_expense: string;
  amount: number;
  expense_date: string;
  description?: string;
  attachments?: File[];
}

export interface UpdateExpenseRequest {
  name?: string;
  branch_id?: number;
  area_of_expense?: string;
  amount?: number;
  expense_date?: string;
  description?: string;
  attachments?: File[];
  attachment_ids_to_keep?: number[];
}

// Fetch all expenses
export async function fetchExpenses() {
  try {
    const response = await api(API_ENDPOINTS.EXPENSES.BASE);
    return response; // { message, data }
  } catch (error: any) {
    console.error("Failed to fetch expenses:", error);
    throw error;
  }
}

// Fetch a single expense by ID
export async function fetchExpense(id: number) {
  try {
    const response = await api(`${API_ENDPOINTS.EXPENSES.BASE}/${id}`);
    return response; // { message, data }
  } catch (error: any) {
    console.error("Failed to fetch expense:", error);
    throw error;
  }
}

// Create a new expense
export async function createExpense(expenseData: CreateExpenseRequest) {
  try {
    // Create FormData for file uploads
    const formData = new FormData();

    // Add regular fields
    Object.keys(expenseData).forEach(key => {
      if (key !== 'attachments') {
        const value = expenseData[key as keyof CreateExpenseRequest];
        if (value !== undefined) {
          formData.append(key, value as string);
        }
      }
    });

    // Add attachments if any
    if (expenseData.attachments && expenseData.attachments.length > 0) {
      expenseData.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });
    }

    const response = await api(API_ENDPOINTS.EXPENSES.BASE, {
      method: 'POST',
      body: formData,
      // Note: Don't set Content-Type header for FormData - browser will set it with boundary
    });
    return response; // { message, data }
  } catch (error: any) {
    console.error("Failed to create expense:", error);
    throw error;
  }
}

// Update an expense
export async function updateExpense(id: number, expenseData: UpdateExpenseRequest) {
  try {
    // Create FormData for file uploads
    const formData = new FormData();

    // Add regular fields
    Object.keys(expenseData).forEach(key => {
      if (key === 'attachment_ids_to_keep' && Array.isArray(expenseData[key])) {
        expenseData[key].forEach((id, index) => {
          formData.append(`attachment_ids_to_keep[${index}]`, id.toString());
        });
      } else if (key !== 'attachments') {
        const value = expenseData[key as keyof UpdateExpenseRequest];
        if (value !== undefined) {
          formData.append(key, value as string);
        }
      }
    });

    // Add attachments if any
    if (expenseData.attachments && expenseData.attachments.length > 0) {
      expenseData.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });
    }

    // Add _method for Laravel PATCH
    formData.append('_method', 'PATCH');

    const response = await api(`${API_ENDPOINTS.EXPENSES.BASE}/${id}`, {
      method: 'POST',
      body: formData,
      // Note: Don't set Content-Type header for FormData - browser will set it with boundary
    });
    return response; // { message, data }
  } catch (error: any) {
    console.error("Failed to update expense:", error);
    throw error;
  }
}

// Delete an expense
export async function deleteExpense(id: number) {
  try {
    const response = await api(`${API_ENDPOINTS.EXPENSES.BASE}/${id}`, {
      method: 'DELETE',
    });
    return response; // { message }
  } catch (error: any) {
    console.error("Failed to delete expense:", error);
    throw error;
  }
}

export const expenseService = {
  fetchExpenses,
  fetchExpense,
  createExpense,
  updateExpense,
  deleteExpense,
};