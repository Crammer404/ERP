import { api } from '../api';
import { API_ENDPOINTS } from '../../config/api.config';

export interface Transaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  reference_id?: number;
  reference_type?: string;
  branch_id: number;
  user_id: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionRequest {
  type: string;
  amount: number;
  description: string;
  reference_id?: number;
  reference_type?: string;
  branch_id: number;
  user_id: number;
}

export interface UpdateTransactionRequest {
  type?: string;
  amount?: number;
  description?: string;
  status?: string;
}

export interface TransactionHistory {
  id: number;
  transaction_id: number;
  action: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  user_id: number;
  created_at: string;
}

export const transactionService = {
  // Get all transactions
  async getAll(): Promise<Transaction[]> {
    return await api(API_ENDPOINTS.TRANSACTIONS.BASE);
  },

  // Get transaction by ID
  async getById(id: number): Promise<Transaction> {
    return await api(`${API_ENDPOINTS.TRANSACTIONS.BASE}/${id}`);
  },

  // Create new transaction
  async create(transactionData: CreateTransactionRequest): Promise<Transaction> {
    return await api(API_ENDPOINTS.TRANSACTIONS.CREATE, {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  },

  // Update transaction
  async update(id: number, transactionData: UpdateTransactionRequest): Promise<Transaction> {
    return await api(`${API_ENDPOINTS.TRANSACTIONS.BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transactionData),
    });
  },

  // Delete transaction
  async delete(id: number): Promise<void> {
    return await api(`${API_ENDPOINTS.TRANSACTIONS.BASE}/${id}`, {
      method: 'DELETE',
    });
  },

  // Get transaction history
  async getHistory(id: number): Promise<TransactionHistory[]> {
    return await api(API_ENDPOINTS.TRANSACTIONS.HISTORY.replace('{id}', id.toString()));
  },
};
