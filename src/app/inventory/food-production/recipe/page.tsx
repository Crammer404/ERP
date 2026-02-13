'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, PlusCircle } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { EmptyStates } from '@/components/ui/empty-state';
import { RecipeTable } from './components/recipe-table';
import { RecipeFormModal } from './components/recipe-form-modal';
import { DeleteRecipeModal } from './components/delete-recipe-modal';
import { useRecipes } from './hooks';
import { Recipe, fetchMaxProducibleQuantity } from './services/recipe-service';
import { RefreshButton } from '@/components/ui/refresh-button';

export function RecipesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [recipesWithMaxProducible, setRecipesWithMaxProducible] = useState<Recipe[]>([]);

  const {
    recipes,
    loading,
    error,
    handleCreate,
    handleUpdate,
    handleDelete,
    refreshRecipes,
  } = useRecipes();

  useEffect(() => {
    const loadMaxProducibleQuantities = async () => {
      const recipesWithQuantities = await Promise.all(
        recipes.map(async (recipe) => {
          try {
            const response = await fetchMaxProducibleQuantity(recipe.id);
            return {
              ...recipe,
              max_producible_quantity: response.data.max_producible_quantity,
            };
          } catch (error) {
            return {
              ...recipe,
              max_producible_quantity: 0,
            };
          }
        })
      );
      setRecipesWithMaxProducible(recipesWithQuantities);
    };

    if (recipes.length > 0) {
      loadMaxProducibleQuantities();
    } else {
      setRecipesWithMaxProducible([]);
    }
  }, [recipes]);

  const filteredRecipes = recipesWithMaxProducible.filter((recipe) => {
    const matchesSearch =
      recipe.product?.name.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
      false;
    return matchesSearch;
  });

  const handleRefresh = () => {
    setLocalSearchTerm('');
    refreshRecipes();
  };

  const handleOpenAddModal = () => {
    setSelectedRecipe(null);
    setFormErrors({});
    setAddModalOpen(true);
  };

  const openEditModal = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setFormErrors({});
    setEditModalOpen(true);
  };

  const openDeleteModal = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setDeleteModalOpen(true);
  };

  const onCreate = async (formData: any) => {
    setFormLoading(true);
    setFormErrors({});

    try {
      await handleCreate(formData);
      setAddModalOpen(false);
      setSelectedRecipe(null);
    } catch (apiErrors: any) {
      setFormErrors(apiErrors);
    } finally {
      setFormLoading(false);
    }
  };

  const onUpdate = async (formData: any) => {
    if (!selectedRecipe) return;

    setFormLoading(true);
    setFormErrors({});

    try {
      await handleUpdate(selectedRecipe.id, formData);
      setEditModalOpen(false);
      setSelectedRecipe(null);
    } catch (apiErrors: any) {
      setFormErrors(apiErrors);
    } finally {
      setFormLoading(false);
    }
  };

  const onDelete = async () => {
    if (!selectedRecipe) return;
    setFormLoading(true);
    setFormErrors({});

    try {
      await handleDelete(selectedRecipe.id);
      setDeleteModalOpen(false);
      setSelectedRecipe(null);
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
                placeholder="Search recipes by product name..."
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <RefreshButton onClick={handleRefresh} loading={loading} />
            <Button onClick={handleOpenAddModal} className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Add Recipe
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
          ) : filteredRecipes.length === 0 ? (
            <>
              {recipes.length === 0 ? (
                <EmptyStates.Ingredients
                  title="No recipes found"
                  description="Create your first recipe to get started."
                />
              ) : (
                <EmptyStates.Ingredients
                  title="No recipes match your search"
                  description="Try adjusting your search criteria to find recipes."
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
            <RecipeTable
              recipes={filteredRecipes}
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

      <RecipeFormModal
        isOpen={addModalOpen}
        onOpenChange={setAddModalOpen}
        isEdit={false}
        recipe={null}
        isLoading={formLoading}
        onSubmit={onCreate}
        errors={formErrors}
      />

      <RecipeFormModal
        isOpen={editModalOpen}
        onOpenChange={setEditModalOpen}
        isEdit={true}
        recipe={selectedRecipe}
        isLoading={formLoading}
        onSubmit={onUpdate}
        errors={formErrors}
      />

      <DeleteRecipeModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedRecipe(null);
        }}
        recipe={selectedRecipe}
        onConfirm={onDelete}
        isLoading={formLoading}
      />
    </div>
  );
}

export default function RecipePage() {
  return <RecipesPage />;
}
