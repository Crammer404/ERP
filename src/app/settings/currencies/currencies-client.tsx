'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, Plus } from 'lucide-react';
import { CurrencyTable, CurrencyFormModal, DeleteCurrencyModal } from './components';
import { useCurrencies, useCurrencyForm } from './hooks';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Currency } from './services/currencyService';

export function CurrenciesClient() {
  const [isMounted, setIsMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const { defaultCurrency, setDefaultCurrency } = useCurrency();

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Custom hooks
  const { currencies, loading, error, handleCreate, handleUpdate, handleDelete, refreshCurrencies } = useCurrencies();
  const { formData, errors, setErrors, resetForm, handleInputChange, populateFormForEdit, validateForm, prepareSubmitData } = useCurrencyForm();

  // Filter currencies based on search term
  const filteredCurrencies = currencies.filter(currency =>
    currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Refresh handler
  const handleRefresh = () => {
    setSearchTerm('');
    refreshCurrencies();
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    setIsMounted(true);

    // Listen for the custom event to open add modal
    const handleOpenAddModal = () => {
      resetForm();
      setAddModalOpen(true);
    };

    document.addEventListener('open-add-currency-modal', handleOpenAddModal);

    return () => {
      document.removeEventListener('open-add-currency-modal', handleOpenAddModal);
    };
  }, []);

  // Open Add Modal
  const handleOpenAddModal = () => {
    resetForm();
    setAddModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (currency: Currency) => {
    setSelectedCurrency(currency);
    populateFormForEdit(currency);
    setEditModalOpen(true);
  };

  const openDeleteModal = (currency: Currency) => {
    setSelectedCurrency(currency);
    setDeleteModalOpen(true);
  };

  const handleSetDefault = (currency: Currency) => {
    setDefaultCurrency(currency);
  };

  // Create currency
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

  // Update currency
  const onUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCurrency) return;

    setFormLoading(true);
    setErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setFormLoading(false);
      return;
    }

    try {
      await handleUpdate(selectedCurrency.id, prepareSubmitData(true));
      setEditModalOpen(false);
      setSelectedCurrency(null);
      resetForm();
    } catch (apiErrors: any) {
      setErrors(apiErrors);
    } finally {
      setFormLoading(false);
    }
  };

  // Delete currency
  const onDelete = async () => {
    if (!selectedCurrency) return;
    setFormLoading(true);
    setErrors({});

    try {
      await handleDelete(selectedCurrency.id);
      setDeleteModalOpen(false);
      setSelectedCurrency(null);
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
        <p className="text-muted-foreground font-medium">Loading Currencies...</p>
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
                placeholder="Search currencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleOpenAddModal} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Currency
            </Button>
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Currency List</CardTitle>
                  <CardDescription>Manage currencies in the system.</CardDescription>
                </div>
                {defaultCurrency && (
                  <div className="text-right">
                    <p className="text-sm font-medium text-primary">Default Currency</p>
                    <p className="text-lg font-semibold">{defaultCurrency.name} ({defaultCurrency.symbol})</p>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {filteredCurrencies.length === 0 ? (
                <p className="text-muted-foreground">No currencies found.</p>
              ) : (
                <CurrencyTable
                  currencies={filteredCurrencies}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  onEdit={openEditModal}
                  onDelete={openDeleteModal}
                  onSetDefault={handleSetDefault}
                  defaultCurrency={defaultCurrency}
                />
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <CurrencyFormModal
        isOpen={addModalOpen}
        onOpenChange={setAddModalOpen}
        isEdit={false}
        formData={formData}
        onInputChange={handleInputChange}
        errors={errors}
        isLoading={formLoading}
        onSubmit={onCreate}
      />

      <CurrencyFormModal
        isOpen={editModalOpen}
        onOpenChange={setEditModalOpen}
        isEdit={true}
        formData={formData}
        onInputChange={handleInputChange}
        errors={errors}
        isLoading={formLoading}
        onSubmit={onUpdate}
      />

      <DeleteCurrencyModal
        isOpen={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        isLoading={formLoading}
        error={errors.general}
        onConfirm={onDelete}
      />
    </div>
  );
}