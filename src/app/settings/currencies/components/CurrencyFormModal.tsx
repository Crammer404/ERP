'use client';

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CurrencyFormData {
  name: string;
  symbol: string;
}

interface CurrencyFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isEdit?: boolean;
  formData: CurrencyFormData;
  onInputChange: (field: string, value: string) => void;
  errors: Record<string, string>;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function CurrencyFormModal({
  isOpen,
  onOpenChange,
  isEdit = false,
  formData,
  onInputChange,
  errors,
  isLoading,
  onSubmit,
}: CurrencyFormModalProps) {

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Currency" : "Add New Currency"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update currency details below."
              : "Enter currency details below. All fields are required."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor={isEdit ? "edit-name" : "name"}>Currency Name <span className="text-red-500">*</span></Label>
            <Input
              id={isEdit ? "edit-name" : "name"}
              type="text"
              maxLength={100} // ✅ limit to 100 characters
              disabled={isLoading}
              value={formData.name}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 100) {
                  onInputChange("name", value);
                }
              }}
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>

          {/* Symbol */}
          <div className="space-y-2">
            <Label htmlFor={isEdit ? "edit-symbol" : "symbol"}>Symbol <span className="text-red-500">*</span></Label>
            <Input
              id={isEdit ? "edit-symbol" : "symbol"}
              type="text"
              maxLength={10} // ✅ limit to 10 characters
              disabled={isLoading}
              value={formData.symbol}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 10) {
                  onInputChange("symbol", value);
                }
              }}
            />
            {errors.symbol && <p className="text-red-500 text-sm">{errors.symbol}</p>}
          </div>

          {errors.general && <p className="text-red-500 text-sm">{errors.general}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? isEdit
                  ? "Updating..."
                  : "Creating..."
                : isEdit
                ? "Update Currency"
                : "Create Currency"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
