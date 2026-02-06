'use client';

import { useEffect, useState } from 'react';
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RefreshCw, PlusCircle, Percent } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { DiscountTable, DiscountFormModal, DeleteDiscountModal } from './components';
import { useDiscounts, useDiscountForm } from './hooks';
import { Discount, discountService } from './services/discountService';

export default function DiscountsPage() {
  console.log('Discounts page loaded at /inventory/discounts');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('');

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Custom hooks
  const { discounts, loading, error, handleCreate, handleUpdate, handleDelete, refreshDiscounts } = useDiscounts();
  const { formData, discountType, setDiscountType, errors, setErrors, resetForm, handleInputChange, populateFormForEdit, validateForm, prepareSubmitData } = useDiscountForm();

  // Filter discounts based on search term and classification
  const filteredDiscounts = discounts.filter(discount => {
    const matchesSearch = discount.name.toLowerCase().includes(localSearchTerm.toLowerCase());
    const matchesClassification = classificationFilter === 'all' || classificationFilter === '' || discount.classification === classificationFilter;
    return matchesSearch && matchesClassification;
  });

  // Refresh handler
  const handleRefresh = () => {
    setLocalSearchTerm('');
    setClassificationFilter('all');
    refreshDiscounts();
  };

  useEffect(() => {
    // Listen for the custom event to open add modal
    const handleOpenAddModal = () => {
      resetForm();
      setAddModalOpen(true);
    };

    document.addEventListener('open-add-discount-modal', handleOpenAddModal);

    return () => {
      document.removeEventListener('open-add-discount-modal', handleOpenAddModal);
    };
  }, []);

  // Open Add Modal
  const handleOpenAddModal = () => {
    resetForm();
    setAddModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (discount: Discount) => {
    setSelectedDiscount(discount);
    populateFormForEdit(discount);
    setEditModalOpen(true);
  };

  const openDeleteModal = (discount: Discount) => {
    setSelectedDiscount(discount);
    setDeleteModalOpen(true);
  };

  // Create discount
  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setErrors({});

    const validationErrors = validateForm(false);
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

  // Update discount
  const onUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDiscount) return;

    setFormLoading(true);
    setErrors({});

    const validationErrors = validateForm(true);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setFormLoading(false);
      return;
    }

    try {
      await handleUpdate(selectedDiscount.id, prepareSubmitData(true));
      setEditModalOpen(false);
      setSelectedDiscount(null);
      resetForm();
    } catch (apiErrors: any) {
      setErrors(apiErrors);
    } finally {
      setFormLoading(false);
    }
  };

  // Delete discount
  const onDelete = async () => {
    if (!selectedDiscount) return;
    setFormLoading(true);
    setErrors({});

    try {
      await handleDelete(selectedDiscount.id);
      setDeleteModalOpen(false);
      setSelectedDiscount(null);
    } catch (errorMessage: any) {
      setErrors({ general: errorMessage });
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Percent className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-headline">Discounts</h1>
          <p className="text-sm text-muted-foreground">
            Manage discount configurations for your system.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="bg-transparent border-none shadow-none">
          <CardContent>
            {/* Search + Actions */}
            <div className="flex items-center gap-4 mt-6 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search discounts..."
                  value={localSearchTerm}
                  onChange={(e) => setLocalSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={classificationFilter} onValueChange={setClassificationFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Classifications" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classifications</SelectItem>
                  <SelectItem value="Default">Default</SelectItem>
                  <SelectItem value="Promo">Promo</SelectItem>
                  <SelectItem value="Voucher">Voucher</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleOpenAddModal} className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Add Discount
              </Button>
              <Button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Discount List</CardTitle>
                <CardDescription>Manage discount configurations in the system.</CardDescription>
              </CardHeader>
              <CardContent>
                {error ? (
                  <div className="py-8 text-center">
                    <p className="text-red-500">Error: {error}</p>
                  </div>
                ) : loading ? (
                  <div className="py-12 flex items-center justify-center">
                    <Loader size="md" />
                  </div>
                ) : filteredDiscounts.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center">No discounts found.</p>
                ) : (
                  <DiscountTable
                    discounts={filteredDiscounts}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    onEdit={openEditModal}
                    onDelete={openDeleteModal}
                  />
                )}
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        <DiscountFormModal
          isOpen={addModalOpen}
          onOpenChange={setAddModalOpen}
          isEdit={false}
          formData={formData}
          discountType={discountType}
          setDiscountType={setDiscountType}
          onInputChange={handleInputChange}
          errors={errors}
          isLoading={formLoading}
          onSubmit={onCreate}
        />

        <DiscountFormModal
          isOpen={editModalOpen}
          onOpenChange={setEditModalOpen}
          isEdit={true}
          formData={formData}
          discountType={discountType}
          setDiscountType={setDiscountType}
          onInputChange={handleInputChange}
          errors={errors}
          isLoading={formLoading}
          onSubmit={onUpdate}
        />

        <DeleteDiscountModal
          isOpen={deleteModalOpen}
          onOpenChange={setDeleteModalOpen}
          isLoading={formLoading}
          error={errors.general}
          onConfirm={onDelete}
        />
      </div>
    </div>
  );
}
