'use client';

import { useState } from 'react';
import { SquareChartGantt, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { TaxTable, TaxFormModal, DeleteTaxModal } from './components';
import { useTaxes, useTaxForm } from './hooks';
import { Tax } from './services/tax-service';
import { tenantContextService } from '@/services/tenant/tenantContextService';
import { useAuth } from '@/components/providers/auth-provider';

export default function TaxesPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role_name === 'Super Admin';
  const [currentPage, setCurrentPage] = useState(1);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [restrictionModalOpen, setRestrictionModalOpen] = useState(false);
  const [restrictionMessage, setRestrictionMessage] = useState('');
  const [selectedTax, setSelectedTax] = useState<Tax | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const { taxes, loading, error, handleCreate, handleUpdate, handleDelete } = useTaxes();
  const { formData, errors, setErrors, resetForm, handleInputChange, populateFormForEdit, validateForm, prepareSubmitData } = useTaxForm();

  const openRestrictionModal = (message: string) => {
    setRestrictionMessage(message);
    setRestrictionModalOpen(true);
  };

  const isGlobalTaxPermissionError = (message?: string) => {
    if (!message) return false;
    const normalized = message.toLowerCase();
    return normalized.includes('global') || normalized.includes('super admin');
  };

  const isGlobalTaxNameConflictError = (message?: string) => {
    if (!message) return false;
    const normalized = message.toLowerCase();
    return normalized.includes('global tax') || normalized.includes('global tax name');
  };

  const openEditModal = (tax: Tax) => {
    if (tax.is_global && !isSuperAdmin) {
      openRestrictionModal('This is a global tax. Only Super Admin users can edit global taxes.');
      return;
    }
    setSelectedTax(tax);
    populateFormForEdit(tax);
    setEditModalOpen(true);
  };

  const openDeleteModal = (tax: Tax) => {
    if (tax.is_global && !isSuperAdmin) {
      openRestrictionModal('This is a global tax. Only Super Admin users can delete global taxes.');
      return;
    }
    setSelectedTax(tax);
    setDeleteModalOpen(true);
  };

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
      const submitData: any = prepareSubmitData(false);
      if (!isSuperAdmin) {
        submitData.is_global = false;
      }
      if (!submitData.is_global) {
        const branchContext = tenantContextService.getStoredBranchContext();
        const branchId = branchContext?.id;
        if (branchId) {
          submitData.branch_id = branchId;
        }
      }
      await handleCreate(submitData);
      setAddModalOpen(false);
      resetForm();
    } catch (apiErrors: any) {
      if (isGlobalTaxPermissionError(apiErrors?.general)) {
        openRestrictionModal('Global tax actions are restricted. Please contact a Super Admin to proceed.');
      } else if (isGlobalTaxNameConflictError(apiErrors?.name)) {
        openRestrictionModal(apiErrors.name);
      } else if (apiErrors?.name) {
        setErrors({ name: apiErrors.name });
      } else {
        setErrors(apiErrors);
      }
    } finally {
      setFormLoading(false);
    }
  };

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
      const submitData: any = prepareSubmitData(true);
      if (!isSuperAdmin) {
        submitData.is_global = false;
      }
      await handleUpdate(selectedTax.id, submitData);
      setEditModalOpen(false);
      setSelectedTax(null);
      resetForm();
    } catch (apiErrors: any) {
      if (isGlobalTaxPermissionError(apiErrors?.general)) {
        openRestrictionModal('Global tax actions are restricted. Please contact a Super Admin to proceed.');
      } else if (isGlobalTaxNameConflictError(apiErrors?.name)) {
        openRestrictionModal(apiErrors.name);
      } else if (apiErrors?.name) {
        setErrors({ name: apiErrors.name });
      } else {
        setErrors(apiErrors);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const onDelete = async () => {
    if (!selectedTax) return;
    setFormLoading(true);
    setErrors({});

    try {
      await handleDelete(selectedTax.id);
      setDeleteModalOpen(false);
      setSelectedTax(null);
    } catch (errorMessage: any) {
      const message = typeof errorMessage === 'string' ? errorMessage : errorMessage?.general;
      if (isGlobalTaxPermissionError(message)) {
        setDeleteModalOpen(false);
        openRestrictionModal('Global taxes are shared system-wide and can only be deleted by a Super Admin.');
      } else {
        setErrors({ general: errorMessage });
      }
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
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
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <SquareChartGantt className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-2xl font-bold font-headline">Taxes</h1>
            <p className="text-sm text-muted-foreground">
              Manage tax configurations for your system.
            </p>
          </div>
        </div>

        <Button
          onClick={() => {
            resetForm();
            setAddModalOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Tax
        </Button>
      </div>

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
                isSuperAdmin={isSuperAdmin}
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

        <AlertDialog open={restrictionModalOpen} onOpenChange={setRestrictionModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Permission Required</AlertDialogTitle>
              <AlertDialogDescription>{restrictionMessage}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction>OK</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}