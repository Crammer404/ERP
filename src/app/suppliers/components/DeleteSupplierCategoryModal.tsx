'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteSupplierCategoryModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading: boolean;
  error?: string;
  onConfirm: () => void;
}

export function DeleteSupplierCategoryModal({
  isOpen,
  onOpenChange,
  isLoading,
  error,
  onConfirm
}: DeleteSupplierCategoryModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Supplier Category</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this supplier category? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {error && isOpen && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}