'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { Search, RefreshCw, Plus, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { SupplierTable, SupplierFormModal, DeleteSupplierModal, SupplierCategoryTable, SupplierCategoryFormModal, DeleteSupplierCategoryModal, SupplierViewModal } from './components';
import { useSuppliers, useSupplierForm, useSupplierCategoriesCRUD } from './hooks/index';
import { useBranches } from '@/app/expenses/hooks/useBranches';
import { Supplier } from './services/supplierService';
import { SupplierCategory } from './services/supplierCategoryService';
import { useToast } from '@/hooks/use-toast';
import { useAccessControl } from '@/components/providers/access-control-provider';
import { tenantContextService } from '@/services/tenant/tenantContextService';

export function SuppliersClient() {
  const { toast } = useToast();
  const { getUserModules } = useAccessControl();
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'suppliers' | 'categories'>('suppliers');
  const [currentPage, setCurrentPage] = useState(1);
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Category modal states
  const [addCategoryModalOpen, setAddCategoryModalOpen] = useState(false);
  const [editCategoryModalOpen, setEditCategoryModalOpen] = useState(false);
  const [deleteCategoryModalOpen, setDeleteCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SupplierCategory | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({ name: '' });
  const [categoryErrors, setCategoryErrors] = useState<Record<string, string>>({});

  // Custom hooks
  const { suppliers, loading, error, handleCreate, handleUpdate, handleDelete, refreshSuppliers } = useSuppliers();
  const { formData, errors, setErrors, resetForm, handleInputChange, handleAddressUpdate, populateFormForEdit, validateForm, prepareSubmitData } = useSupplierForm();
  const { categories, loading: categoriesLoading, handleCreate: handleCreateCategory, handleUpdate: handleUpdateCategory, handleDelete: handleDeleteCategory, refreshCategories } = useSupplierCategoriesCRUD();
  const { branches } = useBranches();

  // Resolve permissions for Suppliers module
  const supplierPermissions = (() => {
    try {
      const modules = getUserModules();
      const mod = modules.find((m) => m.module_path === '/suppliers');
      return mod?.permissions || { create: 0, read: 0, update: 0, delete: 0 };
    } catch {
      return { create: 0, read: 0, update: 0, delete: 0 };
    }
  })();
  const canCreate = Boolean(supplierPermissions.create);
  const canUpdate = Boolean(supplierPermissions.update);
  const canDelete = Boolean(supplierPermissions.delete);

  // Filter suppliers based on search term and category
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
                          supplier.email.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
                          supplier.phone_number.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
                          supplier.address.city.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
                          supplier.address.province.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
                          false;
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(supplier.supplier_category?.name || '');
    return matchesSearch && matchesCategory;
  });

  // Compute unique categories
  const uniqueCategories = Array.from(new Set(suppliers.map(s => s.supplier_category?.name || '').filter(Boolean)));

  // Refresh handler
  const handleRefresh = () => {
    setLocalSearchTerm('');
    setSelectedCategories([]);
    refreshSuppliers();
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  useEffect(() => {
    setIsMounted(true);

    // Listen for the custom event to open add modal
    const handleOpenAddModal = () => {
      resetForm();
      setAddModalOpen(true);
    };

    document.addEventListener('open-add-supplier-modal', handleOpenAddModal);

    return () => {
      document.removeEventListener('open-add-supplier-modal', handleOpenAddModal);
    };
  }, []);

  // Open Add Modal
  const handleOpenAddModal = () => {
    resetForm();
    setAddModalOpen(true);
  };

  // Open edit modal
  const openEditModal = async (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    await populateFormForEdit(supplier);
    setEditModalOpen(true);
  };

  const openDeleteModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setDeleteModalOpen(true);
  };

  const openViewModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setViewModalOpen(true);
  };

  // Create supplier
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
      if (apiErrors.general) {
        // Show toast for general API errors
        toast({
          title: "Supplier Creation Failed",
          description: apiErrors.general,
          variant: "destructive",
        });
      }
      setErrors(apiErrors);
    } finally {
      setFormLoading(false);
    }
  };

  // Update supplier
  const onUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;

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
      await handleUpdate(selectedSupplier.id, submitData);
      setEditModalOpen(false);
      setSelectedSupplier(null);
      resetForm();
    } catch (apiErrors: any) {
      if (apiErrors.general) {
        // Show toast for general API errors
        toast({
          title: "Supplier Update Failed",
          description: apiErrors.general,
          variant: "destructive",
        });
      }
      setErrors(apiErrors);
    } finally {
      setFormLoading(false);
    }
  };

  // Delete supplier
  const onDelete = async () => {
    if (!selectedSupplier) return;
    setFormLoading(true);
    setErrors({});

    try {
      await handleDelete(selectedSupplier.id);
      setDeleteModalOpen(false);
      setSelectedSupplier(null);
    } catch (errorMessage: any) {
      setErrors({ general: errorMessage });
    } finally {
      setFormLoading(false);
    }
  };

  // Category form handlers
  const handleCategoryInputChange = (field: string, value: string) => {
    setCategoryFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetCategoryForm = () => {
    setCategoryFormData({ name: '' });
    setCategoryErrors({});
  };

  const openAddCategoryModal = () => {
    resetCategoryForm();
    setAddCategoryModalOpen(true);
  };

  const openEditCategoryModal = (category: SupplierCategory) => {
    setSelectedCategory(category);
    setCategoryFormData({ name: category.name });
    setEditCategoryModalOpen(true);
  };

  const openDeleteCategoryModal = (category: SupplierCategory) => {
    setSelectedCategory(category);
    setDeleteCategoryModalOpen(true);
  };

  // Create category
  const onCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setCategoryErrors({});

    if (!categoryFormData.name.trim()) {
      setCategoryErrors({ name: 'Category name is required' });
      setFormLoading(false);
      return;
    }

    const selectedBranch = tenantContextService.getStoredBranchContext();
    const branchId = selectedBranch?.id;

    try {
      await handleCreateCategory({
        name: categoryFormData.name.trim(),
        branch_id: branchId
      });
      setAddCategoryModalOpen(false);
      resetCategoryForm();
    } catch (apiErrors: any) {
      if (apiErrors.general) {
        toast({
          title: "Category Creation Failed",
          description: apiErrors.general,
          variant: "destructive",
        });
      }
      setCategoryErrors(apiErrors);
    } finally {
      setFormLoading(false);
    }
  };

  // Update category
  const onUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;

    setFormLoading(true);
    setCategoryErrors({});

    if (!categoryFormData.name.trim()) {
      setCategoryErrors({ name: 'Category name is required' });
      setFormLoading(false);
      return;
    }

    const selectedBranch = tenantContextService.getStoredBranchContext();
    const branchId = selectedBranch?.id;

    try {
      await handleUpdateCategory(selectedCategory.id, {
        name: categoryFormData.name.trim(),
        branch_id: branchId
      });
      setEditCategoryModalOpen(false);
      setSelectedCategory(null);
      resetCategoryForm();
    } catch (apiErrors: any) {
      if (apiErrors.general) {
        toast({
          title: "Category Update Failed",
          description: apiErrors.general,
          variant: "destructive",
        });
      }
      setCategoryErrors(apiErrors);
    } finally {
      setFormLoading(false);
    }
  };

  // Delete category (called from table dropdown)
  const onDeleteCategory = (category: SupplierCategory) => {
    openDeleteCategoryModal(category);
  };

  // Confirm delete category (called from modal)
  const onConfirmDeleteCategory = async () => {
    if (!selectedCategory) return;
    setFormLoading(true);
    setCategoryErrors({});

    try {
      await handleDeleteCategory(selectedCategory.id);
      setDeleteCategoryModalOpen(false);
      setSelectedCategory(null);
    } catch (errorMessage: any) {
      setCategoryErrors({ general: errorMessage });
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
        <p className="text-muted-foreground font-medium">Loading Suppliers...</p>
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
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'suppliers' | 'categories')}
            className="w-full"
          >
            {/* Tabs Header */}
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </TabsList>

            {/* Suppliers Tab */}
            <TabsContent value="suppliers">
              {/* Search + Actions */}
              <div className="flex items-center gap-4 mt-6 mb-6">
                <div className="flex items-center gap-2 flex-wrap">
                  <Button variant="outline" size="sm" className="h-8" onClick={() => { setLocalSearchTerm(''); setSelectedCategories([]); }}>
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Clear Filters
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:bg-muted">
                        Category {selectedCategories.length > 0 && `(${selectedCategories.length})`}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {uniqueCategories.map(category => (
                        <DropdownMenuCheckboxItem
                          key={category}
                          checked={selectedCategories.includes(category)}
                          onCheckedChange={() => handleCategoryFilter(category)}
                        >
                          {category}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search suppliers..."
                    value={localSearchTerm}
                    onChange={(e) => setLocalSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {canCreate && (
                  <Button onClick={handleOpenAddModal} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Supplier
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
                  <CardTitle>Supplier List</CardTitle>
                  <CardDescription>Manage suppliers and their contact information in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredSuppliers.length === 0 ? (
                    <p className="text-muted-foreground">No suppliers found.</p>
                  ) : (
                    <SupplierTable
                      suppliers={filteredSuppliers}
                      currentPage={currentPage}
                      setCurrentPage={setCurrentPage}
                      onView={openViewModal}
                      onEdit={openEditModal}
                      onDelete={openDeleteModal}
                      canUpdate={canUpdate}
                      canDelete={canDelete}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Categories Tab */}
            <TabsContent value="categories">
              {/* Search + Actions */}
              <div className="flex items-center gap-4 mt-6 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search categories..."
                    value={categorySearchTerm}
                    onChange={(e) => setCategorySearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={openAddCategoryModal} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Category
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={refreshCategories}
                  disabled={categoriesLoading}
                  className="h-10 w-10"
                >
                  <RefreshCw className={`h-4 w-4 ${categoriesLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Supplier Categories</CardTitle>
                  <CardDescription>Manage supplier categories for organizing your suppliers.</CardDescription>
                </CardHeader>
                <CardContent>
                  <SupplierCategoryTable
                    categories={categories}
                    searchTerm={categorySearchTerm}
                    loading={categoriesLoading}
                    onEdit={openEditCategoryModal}
                    onDelete={onDeleteCategory}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <SupplierFormModal
        isOpen={addModalOpen}
        onOpenChange={setAddModalOpen}
        isEdit={false}
        formData={formData}
        onInputChange={handleInputChange}
        onAddressUpdate={handleAddressUpdate}
        errors={errors}
        isLoading={formLoading}
        onSubmit={onCreate}
        categories={categories}
        categoriesLoading={categoriesLoading}
        onCategoryCreated={refreshCategories}
      />

      <SupplierFormModal
        isOpen={editModalOpen}
        onOpenChange={setEditModalOpen}
        isEdit={true}
        formData={formData}
        onInputChange={handleInputChange}
        onAddressUpdate={handleAddressUpdate}
        errors={errors}
        isLoading={formLoading}
        onSubmit={onUpdate}
        categories={categories}
        categoriesLoading={categoriesLoading}
        onCategoryCreated={refreshCategories}
      />

      <DeleteSupplierModal
        isOpen={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        isLoading={formLoading}
        error={errors.general}
        onConfirm={onDelete}
      />

      <SupplierCategoryFormModal
        isOpen={addCategoryModalOpen}
        onOpenChange={setAddCategoryModalOpen}
        isEdit={false}
        formData={categoryFormData}
        onInputChange={handleCategoryInputChange}
        errors={categoryErrors}
        isLoading={formLoading}
        onSubmit={onCreateCategory}
      />

      <SupplierCategoryFormModal
        isOpen={editCategoryModalOpen}
        onOpenChange={setEditCategoryModalOpen}
        isEdit={true}
        category={selectedCategory}
        formData={categoryFormData}
        onInputChange={handleCategoryInputChange}
        errors={categoryErrors}
        isLoading={formLoading}
        onSubmit={onUpdateCategory}
      />

      <DeleteSupplierCategoryModal
        isOpen={deleteCategoryModalOpen}
        onOpenChange={setDeleteCategoryModalOpen}
        isLoading={formLoading}
        error={categoryErrors.general}
        onConfirm={onConfirmDeleteCategory}
      />

      <SupplierViewModal
        isOpen={viewModalOpen}
        onOpenChange={setViewModalOpen}
        supplier={selectedSupplier}
      />
    </div>
  );
}
