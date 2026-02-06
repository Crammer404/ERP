'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TaxTable, TaxFormModal, DeleteTaxModal } from './components';
import { useTaxes, useTaxForm } from './hooks';
import { Tax } from './services/taxService';
import { tenantContextService } from '@/services/tenant/tenantContextService';

export function TaxesClient() {
  const [isMounted, setIsMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTax, setSelectedTax] = useState<Tax | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Custom hooks
  const { taxes, loading, error, handleCreate, handleUpdate, handleDelete } = useTaxes();
  const { formData, errors, setErrors, resetForm, handleInputChange, populateFormForEdit, validateForm, prepareSubmitData } = useTaxForm();

  useEffect(() => {
    setIsMounted(true);

    // Listen for the custom event to open add modal
    const handleOpenAddModal = () => {
      resetForm();
      setAddModalOpen(true);
    };

    document.addEventListener('open-add-tax-modal', handleOpenAddModal);

    return () => {
      document.removeEventListener('open-add-tax-modal', handleOpenAddModal);
    };
  }, []);

  // Open edit modal
  const openEditModal = (tax: Tax) => {
    setSelectedTax(tax);
    populateFormForEdit(tax);
    setEditModalOpen(true);
  };

  const openDeleteModal = (tax: Tax) => {
    setSelectedTax(tax);
    setDeleteModalOpen(true);
  };

  // Create tax
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
      // Add branch_id to the payload from tenant context service
      const branchContext = tenantContextService.getStoredBranchContext();
      const branchId = branchContext?.id || 1; // Default to 1 if not found
      const submitData = {
        ...prepareSubmitData(false),
        branch_id: branchId
      };
      await handleCreate(submitData);
      setAddModalOpen(false);
      resetForm();
    } catch (apiErrors: any) {
      if (apiErrors.general === "The name has already been taken.") {
        setErrors({ name: apiErrors.general });
      } else {
        setErrors(apiErrors);
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Update tax
  const onUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTax) return;

    setFormLoading(true);
    setErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setFormLoading(false);
      return;
    }

    try {
      await handleUpdate(selectedTax.id, prepareSubmitData(true));
      setEditModalOpen(false);
      setSelectedTax(null);
      resetForm();
    } catch (apiErrors: any) {
      if (apiErrors.general === "The name has already been taken.") {
        setErrors({ name: apiErrors.general });
      } else {
        setErrors(apiErrors);
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Delete tax
  const onDelete = async () => {
    if (!selectedTax) return;
    setFormLoading(true);
    setErrors({});

    try {
      await handleDelete(selectedTax.id);
      setDeleteModalOpen(false);
      setSelectedTax(null);
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
        <p className="text-muted-foreground font-medium">Loading Taxes...</p>
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
      <Card>
        <CardHeader>
          <CardTitle>Tax List</CardTitle>
          <CardDescription>Manage tax configurations in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          {taxes.length === 0 ? (
            <p className="text-muted-foreground">No taxes found.</p>
          ) : (
            <TaxTable
              taxes={taxes}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              onEdit={openEditModal}
              onDelete={openDeleteModal}
            />
          )}
        </CardContent>
      </Card>

      <TaxFormModal
        isOpen={addModalOpen}
        onOpenChange={setAddModalOpen}
        isEdit={false}
        formData={formData}
        onInputChange={handleInputChange}
        errors={errors}
        isLoading={formLoading}
        onSubmit={onCreate}
      />

      <TaxFormModal
        isOpen={editModalOpen}
        onOpenChange={setEditModalOpen}
        isEdit={true}
        formData={formData}
        onInputChange={handleInputChange}
        errors={errors}
        isLoading={formLoading}
        onSubmit={onUpdate}
      />

      <DeleteTaxModal
        isOpen={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        isLoading={formLoading}
        error={errors.general}
        onConfirm={onDelete}
      />
    </div>
  );
}