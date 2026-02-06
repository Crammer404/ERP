'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, Plus } from 'lucide-react';
import { CustomerTable, CustomerFormModal, DeleteCustomerModal, CustomerViewModal } from './components';
import { useCustomers, useCustomerForm } from './hooks/index';
import { useBranches } from '@/app/expenses/hooks/useBranches';
import { Customer } from './services/customerService';
import { useToast } from '@/hooks/use-toast';
import { useAccessControl } from '@/components/providers/access-control-provider';

export function CustomersClient() {
  const { toast } = useToast();
  const { getUserModules } = useAccessControl();
  const [isMounted, setIsMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [localSearchTerm, setLocalSearchTerm] = useState('');

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Custom hooks
  const { customers, loading, error, handleCreate, handleUpdate, handleDelete, refreshCustomers } = useCustomers();
  const { formData, errors, setErrors, resetForm, handleInputChange, handleAddressUpdate, populateFormForEdit, validateForm, prepareSubmitData } = useCustomerForm();
  const { branches } = useBranches();

  // Resolve permissions for Customers module
  const customerPermissions = (() => {
    try {
      const modules = getUserModules();
      const mod = modules.find((m) => m.module_path === '/customers');
      return mod?.permissions || { create: 0, read: 0, update: 0, delete: 0 };
    } catch {
      return { create: 0, read: 0, update: 0, delete: 0 };
    }
  })();
  const canCreate = Boolean(customerPermissions.create);
  const canUpdate = Boolean(customerPermissions.update);
  const canDelete = Boolean(customerPermissions.delete);
  const canView = Boolean(customerPermissions.read);

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.first_name.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
                          customer.last_name.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
                          customer.email.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
                          customer.phone_number.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
                          customer.address.city.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
                          customer.address.province.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
                          customer.address.region.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
                          false;
    return matchesSearch;
  });

  // Refresh handler
  const handleRefresh = () => {
    setLocalSearchTerm('');
    refreshCustomers();
  };

  useEffect(() => {
    setIsMounted(true);

    // Listen for the custom event to open add modal
    const handleOpenAddModal = () => {
      resetForm();
      setAddModalOpen(true);
    };

    document.addEventListener('open-add-customer-modal', handleOpenAddModal);

    return () => {
      document.removeEventListener('open-add-customer-modal', handleOpenAddModal);
    };
  }, []);

  // Open Add Modal
  const handleOpenAddModal = () => {
    resetForm();
    setAddModalOpen(true);
  };

  // Open edit modal
  const openEditModal = async (customer: Customer) => {
    setSelectedCustomer(customer);
    await populateFormForEdit(customer);
    setEditModalOpen(true);
  };

  const openDeleteModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDeleteModalOpen(true);
  };

  const openViewModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setViewModalOpen(true);
  };

  // Create customer
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

    const submitData = prepareSubmitData(false);
    console.log('onCreate - submitData:', submitData);

    try {
      await handleCreate(submitData);
      setAddModalOpen(false);
      resetForm();
    } catch (apiErrors: any) {
      setErrors(apiErrors);
    } finally {
      setFormLoading(false);
    }
  };

  // Update customer
  const onUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    setFormLoading(true);
    setErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setFormLoading(false);
      return;
    }

    const submitData = prepareSubmitData(true);
    console.log('onUpdate - submitData:', submitData);

    try {
      await handleUpdate(selectedCustomer.id, submitData);
      setEditModalOpen(false);
      setSelectedCustomer(null);
      resetForm();
    } catch (apiErrors: any) {
      setErrors(apiErrors);
    } finally {
      setFormLoading(false);
    }
  };

  // Delete customer
  const onDelete = async () => {
    if (!selectedCustomer) return;
    setFormLoading(true);
    setErrors({});

    try {
      await handleDelete(selectedCustomer.id);
      setDeleteModalOpen(false);
      setSelectedCustomer(null);
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
        <p className="text-muted-foreground font-medium">Loading Customers...</p>
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
                placeholder="Search customers..."
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {canCreate && (
              <Button onClick={handleOpenAddModal} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Customer
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
              <CardTitle>Customer List</CardTitle>
              <CardDescription>Manage customers and their contact information in the system.</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredCustomers.length === 0 ? (
                <p className="text-muted-foreground">No customers found.</p>
              ) : (
                <CustomerTable
                  customers={filteredCustomers}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  onEdit={openEditModal}
                  onDelete={openDeleteModal}
                  onView={openViewModal}
                  canUpdate={canUpdate}
                  canDelete={canDelete}
                  canView={canView}
                />
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <CustomerFormModal
        isOpen={addModalOpen}
        onOpenChange={setAddModalOpen}
        isEdit={false}
        formData={formData}
        onInputChange={handleInputChange}
        onAddressUpdate={handleAddressUpdate}
        errors={errors}
        isLoading={formLoading}
        onSubmit={onCreate}
      />

      <CustomerFormModal
        isOpen={editModalOpen}
        onOpenChange={setEditModalOpen}
        isEdit={true}
        formData={formData}
        onInputChange={handleInputChange}
        onAddressUpdate={handleAddressUpdate}
        errors={errors}
        isLoading={formLoading}
        onSubmit={onUpdate}
      />

      <DeleteCustomerModal
        isOpen={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        isLoading={formLoading}
        error={errors.general}
        onConfirm={onDelete}
      />

      <CustomerViewModal
        isOpen={viewModalOpen}
        onOpenChange={setViewModalOpen}
        customer={selectedCustomer}
      />
    </div>
  );
}