import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  title?: string;
  description?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  itemName?: string;
  errors?: Record<string, string>;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
  title = "Delete Item",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  confirmButtonText = "Delete",
  cancelButtonText = "Cancel",
  itemName,
  errors = {}
}) => {
  const displayTitle = itemName ? `${title} "${itemName}"` : title;
  const displayDescription = itemName 
    ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
    : description;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{displayTitle}</DialogTitle>
          <DialogDescription>
            {displayDescription}
          </DialogDescription>
        </DialogHeader>

        {errors.general && isOpen && (
          <p className="text-red-500 text-xs">{errors.general}</p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelButtonText}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting..." : confirmButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
