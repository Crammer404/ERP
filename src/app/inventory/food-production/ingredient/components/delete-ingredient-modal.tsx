'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Ingredient } from '../services/ingredient-service';

interface DeleteIngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredient: Ingredient | null;
  onConfirm: () => void;
  isLoading: boolean;
}

export function DeleteIngredientModal({
  isOpen,
  onClose,
  ingredient,
  onConfirm,
  isLoading,
}: DeleteIngredientModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Ingredient</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{ingredient?.name}</strong>? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
