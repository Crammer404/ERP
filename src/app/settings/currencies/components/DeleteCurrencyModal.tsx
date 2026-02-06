'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteCurrencyModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading: boolean;
  error?: string;
  onConfirm: () => void;
}

export function DeleteCurrencyModal({
  isOpen,
  onOpenChange,
  isLoading,
  error,
  onConfirm
}: DeleteCurrencyModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Currency</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this currency?
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