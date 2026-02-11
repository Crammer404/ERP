'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, PlusCircle } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { EmptyStates } from '@/components/ui/empty-state';
import { IngredientTable } from './components/ingredient-table';
import { IngredientFormModal } from './components/ingredient-form-modal';
import { DeleteIngredientModal } from './components/delete-ingredient-modal';
import { useIngredients } from './hooks';
import { Ingredient } from './services/ingredient-service';
import { RefreshButton } from '@/components/ui/refresh-button';

export function IngredientsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const {
    ingredients,
    loading,
    error,
    handleCreate,
    handleUpdate,
    handleDelete,
    refreshIngredients,
  } = useIngredients();

  const filteredIngredients = ingredients.filter((ingredient) => {
    const matchesSearch =
      ingredient.name.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
      ingredient.stock?.product?.name.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
      false;
    return matchesSearch;
  });

  const handleRefresh = () => {
    setLocalSearchTerm('');
    refreshIngredients();
  };

  const handleOpenAddModal = () => {
    setSelectedIngredient(null);
    setFormErrors({});
    setAddModalOpen(true);
  };

  const openEditModal = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setFormErrors({});
    setEditModalOpen(true);
  };

  const openDeleteModal = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setDeleteModalOpen(true);
  };

  const onCreate = async (formData: any) => {
    setFormLoading(true);
    setFormErrors({});

    try {
      await handleCreate(formData);
      setAddModalOpen(false);
      setSelectedIngredient(null);
    } catch (apiErrors: any) {
      setFormErrors(apiErrors);
    } finally {
      setFormLoading(false);
    }
  };

  const onUpdate = async (formData: any) => {
    if (!selectedIngredient) return;

    setFormLoading(true);
    setFormErrors({});

    try {
      await handleUpdate(selectedIngredient.id, formData);
      setEditModalOpen(false);
      setSelectedIngredient(null);
    } catch (apiErrors: any) {
      setFormErrors(apiErrors);
    } finally {
      setFormLoading(false);
    }
  };

  const onDelete = async () => {
    if (!selectedIngredient) return;
    setFormLoading(true);
    setFormErrors({});

    try {
      await handleDelete(selectedIngredient.id);
      setDeleteModalOpen(false);
      setSelectedIngredient(null);
    } catch (errorMessage: any) {
      setFormErrors({ general: errorMessage });
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <div className="flex items-center gap-4 mt-6 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search ingredients by name or stock..."
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <RefreshButton onClick={handleRefresh} loading={loading} />
            <Button onClick={handleOpenAddModal} className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Add Ingredient
            </Button>
          </div>
          {error ? (
            <div className="py-8 text-center">
              <p className="text-red-500">Error: {error}</p>
            </div>
          ) : loading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader size="md" />
            </div>
          ) : filteredIngredients.length === 0 ? (
            <>
              {ingredients.length === 0 ? (
                <EmptyStates.Ingredients />
              ) : (
                <EmptyStates.Ingredients
                  title="No ingredients match your search"
                  description="Try adjusting your search criteria to find ingredients."
                  action={
                    <Button
                      onClick={() => setLocalSearchTerm('')}
                      variant="outline"
                    >
                      Clear Search
                    </Button>
                  }
                />
              )}
            </>
          ) : (
            <IngredientTable
              ingredients={filteredIngredients}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              onEdit={openEditModal}
              onDelete={openDeleteModal}
              onRefresh={handleRefresh}
              loading={loading}
            />
          )}
        </CardContent>
      </Card>

      <IngredientFormModal
        isOpen={addModalOpen}
        onOpenChange={setAddModalOpen}
        isEdit={false}
        ingredient={null}
        isLoading={formLoading}
        onSubmit={onCreate}
        errors={formErrors}
      />

      <IngredientFormModal
        isOpen={editModalOpen}
        onOpenChange={setEditModalOpen}
        isEdit={true}
        ingredient={selectedIngredient}
        isLoading={formLoading}
        onSubmit={onUpdate}
        errors={formErrors}
      />

      <DeleteIngredientModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedIngredient(null);
        }}
        ingredient={selectedIngredient}
        onConfirm={onDelete}
        isLoading={formLoading}
      />
    </div>
  );
}
