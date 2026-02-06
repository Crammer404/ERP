'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, Plus } from 'lucide-react';
import { ExpenseTable, ExpenseFormModal, DeleteExpenseModal } from './components';
import { useExpenses, useExpenseForm, useBranches } from './hooks/index';
import { Expense } from './services/expenseService';
import { useAccessControl } from '@/components/providers/access-control-provider';

export function ExpensesClient() {
  const { getUserModules } = useAccessControl();
  const [isMounted, setIsMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [localSearchTerm, setLocalSearchTerm] = useState('');

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Custom hooks
  const { expenses, loading, error, handleCreate, handleUpdate, handleDelete, refreshExpenses } = useExpenses();
  const { formData, errors, setErrors, resetForm, handleInputChange, populateFormForEdit, validateForm, prepareSubmitData } = useExpenseForm();
  const { branches, loading: branchesLoading } = useBranches();

  // Resolve permissions for Expenses module
  const expensePermissions = (() => {
    try {
      const modules = getUserModules();
      const mod = modules.find((m) => m.module_path === '/expenses');
      return mod?.permissions || { create: 0, read: 0, update: 0, delete: 0 };
    } catch {
      return { create: 0, read: 0, update: 0, delete: 0 };
    }
  })();
  const canCreate = Boolean(expensePermissions.create);
  const canUpdate = Boolean(expensePermissions.update);
  const canDelete = Boolean(expensePermissions.delete);

  // Filter expenses based on search term
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.name.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
                         expense.area_of_expense.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
                         expense.description?.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
                         false;
    return matchesSearch;
  });

  // Refresh handler
  const handleRefresh = () => {
    setLocalSearchTerm('');
    refreshExpenses();
  };

  useEffect(() => {
    setIsMounted(true);

    // Listen for the custom event to open add modal
    const handleOpenAddModal = () => {
      resetForm();
      setAddModalOpen(true);
    };

    document.addEventListener('open-add-expense-modal', handleOpenAddModal);

    return () => {
      document.removeEventListener('open-add-expense-modal', handleOpenAddModal);
    };
  }, []);

  // Open Add Modal
  const handleOpenAddModal = () => {
    resetForm();
    setAddModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (expense: Expense) => {
    setSelectedExpense(expense);
    populateFormForEdit(expense);
    setEditModalOpen(true);
  };

  const openDeleteModal = (expense: Expense) => {
    setSelectedExpense(expense);
    setDeleteModalOpen(true);
  };

  // Create expense
  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setFormLoading(false);
      return;
    }

    try {
      await handleCreate(prepareSubmitData(false));
      setAddModalOpen(false);
      resetForm();
    } catch (apiErrors: any) {
      setErrors(apiErrors);
    } finally {
      setFormLoading(false);
    }
  };

  // Update expense
  const onUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense) return;

    setFormLoading(true);
    setErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setFormLoading(false);
      return;
    }

    try {
      await handleUpdate(selectedExpense.id, prepareSubmitData(true));
      setEditModalOpen(false);
      setSelectedExpense(null);
      resetForm();
    } catch (apiErrors: any) {
      setErrors(apiErrors);
    } finally {
      setFormLoading(false);
    }
  };

  // Delete expense
  const onDelete = async () => {
    if (!selectedExpense) return;
    setFormLoading(true);
    setErrors({});

    try {
      await handleDelete(selectedExpense.id);
      setDeleteModalOpen(false);
      setSelectedExpense(null);
    } catch (errorMessage: any) {
      setErrors({ general: errorMessage });
    } finally {
      setFormLoading(false);
    }
  };

  if (!isMounted || loading) {
    return (
      <div className="text-center py-20 col-span-full">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-muted-foreground font-medium">Loading Expenses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="py-20 text-center">
        <CardContent>
          <p className="text-red-500">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-transparent border-none shadow-none">
        <CardContent>
          {/* Search + Actions */}
          <div className="flex items-center gap-4 mt-6 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search expenses..."
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {canCreate && (
              <Button onClick={handleOpenAddModal} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Expense
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={loading}
              className="h-10 w-10"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Expense List</CardTitle>
              <CardDescription>Manage expenses and their attachments in the system.</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredExpenses.length === 0 ? (
                <p className="text-muted-foreground">No expenses found.</p>
              ) : (
                <ExpenseTable
                  expenses={filteredExpenses}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  onEdit={openEditModal}
                  onDelete={openDeleteModal}
                  canUpdate={canUpdate}
                  canDelete={canDelete}
                />
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <ExpenseFormModal
        isOpen={addModalOpen}
        onOpenChange={setAddModalOpen}
        isEdit={false}
        formData={formData}
        onInputChange={handleInputChange}
        errors={errors}
        isLoading={formLoading}
        onSubmit={onCreate}
      />

      <ExpenseFormModal
        isOpen={editModalOpen}
        onOpenChange={setEditModalOpen}
        isEdit={true}
        formData={formData}
        onInputChange={handleInputChange}
        errors={errors}
        isLoading={formLoading}
        onSubmit={onUpdate}
      />

      <DeleteExpenseModal
        isOpen={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        isLoading={formLoading}
        error={errors.general}
        onConfirm={onDelete}
      />
    </div>
  );
}