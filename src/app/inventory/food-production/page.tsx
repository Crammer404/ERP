'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, PlusCircle, ChefHat } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { EmptyStates } from '@/components/ui/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { IngredientTable, IngredientFormModal, DeleteIngredientModal } from './components';
import { useIngredients } from './hooks';
import { Ingredient } from './services/ingredientService';

type RecipeRow = {
  id: number;
  productName: string;
  ingredientName: string;
  quantity: number;
  unit: string;
};

export default function IngredientsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [recipes, setRecipes] = useState<RecipeRow[]>([]);
  const [recipeForm, setRecipeForm] = useState({
    productName: '',
    ingredientName: '',
    quantity: '',
    unit: '',
  });

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

  const handleRecipeInputChange = (field: keyof typeof recipeForm, value: string) => {
    setRecipeForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddRecipe = () => {
    const trimmedProduct = recipeForm.productName.trim();
    const trimmedIngredient = recipeForm.ingredientName.trim();

    if (!trimmedProduct || !trimmedIngredient) {
      return;
    }

    const quantityValue = Number(recipeForm.quantity) || 0;

    const newRecipe: RecipeRow = {
      id: Date.now(),
      productName: trimmedProduct,
      ingredientName: trimmedIngredient,
      quantity: quantityValue,
      unit: recipeForm.unit.trim(),
    };

    setRecipes((prev) => [...prev, newRecipe]);
    setRecipeForm({
      productName: '',
      ingredientName: '',
      quantity: '',
      unit: '',
    });
  };

  const handleDeleteRecipe = (id: number) => {
    setRecipes((prev) => prev.filter((recipe) => recipe.id !== id));
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <ChefHat className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-headline">Food Production</h1>
          <p className="text-sm text-muted-foreground">
            Manage ingredients and recipes used for food and beverage preparation.
          </p>
        </div>
      </div>

      <Tabs defaultValue="ingredients" className="space-y-6">
        <TabsList>
          <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
          <TabsTrigger value="recipes">Recipes</TabsTrigger>
        </TabsList>

        <TabsContent value="ingredients">
          <div className="space-y-6">
            <Card className="bg-transparent border-none shadow-none">
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
                  <Button onClick={handleOpenAddModal} className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Add Ingredient
                  </Button>
                  <Button
                    onClick={handleRefresh}
                    disabled={loading}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>

                <Card>
                  <CardContent>
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
                      />
                    )}
                  </CardContent>
                </Card>
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
        </TabsContent>

        <TabsContent value="recipes">
          <Card className="bg-transparent border-none shadow-none">
            <CardHeader>
              <CardTitle>Recipes</CardTitle>
              <CardDescription>Map products to ingredients with basic quantities.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Product name"
                  value={recipeForm.productName}
                  onChange={(e) => handleRecipeInputChange('productName', e.target.value)}
                />
                <Input
                  placeholder="Ingredient name"
                  value={recipeForm.ingredientName}
                  onChange={(e) => handleRecipeInputChange('ingredientName', e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Quantity"
                  value={recipeForm.quantity}
                  onChange={(e) => handleRecipeInputChange('quantity', e.target.value)}
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Unit"
                    value={recipeForm.unit}
                    onChange={(e) => handleRecipeInputChange('unit', e.target.value)}
                  />
                  <Button onClick={handleAddRecipe} className="whitespace-nowrap">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Ingredient</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No recipes defined yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recipes.map((recipe) => (
                      <TableRow key={recipe.id}>
                        <TableCell>{recipe.productName}</TableCell>
                        <TableCell>{recipe.ingredientName}</TableCell>
                        <TableCell>{recipe.quantity}</TableCell>
                        <TableCell>{recipe.unit || '—'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRecipe(recipe.id)}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
