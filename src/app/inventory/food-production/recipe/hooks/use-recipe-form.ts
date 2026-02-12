'use client';

import { useState, useEffect } from 'react';
import { Recipe } from '../services/recipe-service';
import { fetchIngredients, Ingredient } from '../../ingredient/services/ingredient-service';
import { productService } from '@/services/product/productService';

interface RecipeItemFormData {
  ingredient_id: string;
  quantity: string;
}

interface RecipeFormData {
  product_id: string;
  items: RecipeItemFormData[];
}

export function useRecipeForm(recipe?: Recipe | null) {
  const [formData, setFormData] = useState<RecipeFormData>({
    product_id: '',
    items: [{ ingredient_id: '', quantity: '' }],
  });

  const [products, setProducts] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingIngredients, setLoadingIngredients] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        const response = await productService.getAll();
        setProducts(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    const loadIngredients = async () => {
      try {
        setLoadingIngredients(true);
        const response = await fetchIngredients();
        setIngredients(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Failed to load ingredients:', error);
      } finally {
        setLoadingIngredients(false);
      }
    };

    loadProducts();
    loadIngredients();
  }, []);

  useEffect(() => {
    if (recipe) {
      setFormData({
        product_id: recipe.product_id?.toString() || '',
        items: recipe.items?.map(item => ({
          ingredient_id: item.ingredient_id.toString(),
          quantity: item.quantity.toString(),
        })) || [{ ingredient_id: '', quantity: '' }],
      });
    } else {
      setFormData({
        product_id: '',
        items: [{ ingredient_id: '', quantity: '' }],
      });
    }
    setErrors({});
  }, [recipe]);

  const handleInputChange = (field: keyof RecipeFormData, value: string | RecipeItemFormData[]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleItemChange = (index: number, field: keyof RecipeItemFormData, value: string) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { ingredient_id: '', quantity: '' }],
    }));
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.product_id) {
      newErrors.product_id = 'Product is required';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'At least one ingredient is required';
    }

    formData.items.forEach((item, index) => {
      if (!item.ingredient_id) {
        newErrors[`items.${index}.ingredient_id`] = 'Ingredient is required';
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        newErrors[`items.${index}.quantity`] = 'Quantity must be greater than 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getFormDataForSubmit = () => {
    return {
      product_id: parseInt(formData.product_id),
      items: formData.items
        .filter(item => item.ingredient_id && item.quantity)
        .map(item => ({
          ingredient_id: parseInt(item.ingredient_id),
          quantity: parseFloat(item.quantity),
        })),
    };
  };

  const resetForm = () => {
    setFormData({
      product_id: '',
      items: [{ ingredient_id: '', quantity: '' }],
    });
    setErrors({});
  };

  return {
    formData,
    products,
    ingredients,
    loadingProducts,
    loadingIngredients,
    errors,
    handleInputChange,
    handleItemChange,
    addItem,
    removeItem,
    validateForm,
    getFormDataForSubmit,
    resetForm,
    setErrors,
  };
}
