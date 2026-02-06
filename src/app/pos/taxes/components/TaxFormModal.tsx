'use client';

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { tenantContextService } from '@/services/tenant/tenantContextService';

interface TaxFormData {
  name: string;
  percentage: string;
  is_active: boolean;
}

interface TaxFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isEdit?: boolean;
  formData: TaxFormData;
  onInputChange: (field: string, value: string | boolean) => void;
  errors: Record<string, string>;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function TaxFormModal({
  isOpen,
  onOpenChange,
  isEdit = false,
  formData,
  onInputChange,
  errors,
  isLoading,
  onSubmit,
}: TaxFormModalProps) {
  // Get selected branch from header context
  const selectedBranch = tenantContextService.getStoredBranchContext();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Tax" : "Add New Tax"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update tax details below."
              : "Enter tax details below. All fields are required."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Branch Display */}
          <div className="space-y-2">
            <Label htmlFor="branch">Branch</Label>
            <Input
              id="branch"
              type="text"
              value={selectedBranch?.name || 'No branch selected'}
              disabled={true}
              className="bg-muted"
            />
          </div>
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor={isEdit ? "edit-name" : "name"}>Tax Name <span className="text-red-500">*</span></Label>
            <Input
              id={isEdit ? "edit-name" : "name"}
              type="text"
              disabled={isLoading}
              value={formData.name}
              onChange={(e) => onInputChange("name", e.target.value)}
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>

          {/* Percentage */}
          <div className="space-y-2">
            <Label htmlFor={isEdit ? "edit-percentage" : "percentage"}>Percentage (%) <span className="text-red-500">*</span></Label>
            <Input
              id={isEdit ? "edit-percentage" : "percentage"}
              type="number"
              step="0.01"
              min="0"
              max="100"
              disabled={isLoading}
              value={formData.percentage}
              onChange={(e) => {
                let value = e.target.value;
                if (value === "") return onInputChange("percentage", "");
                const num = parseFloat(value);
                if (!isNaN(num)) {
                  const clamped = Math.min(Math.max(num, 0), 100);
                  onInputChange("percentage", clamped.toString());
                }
              }}
            />
            {errors.percentage && <p className="text-red-500 text-sm">{errors.percentage}</p>}
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id={isEdit ? "edit-is_active" : "is_active"}
              checked={formData.is_active}
              onCheckedChange={(checked) => onInputChange("is_active", checked)}
              disabled={isLoading}
            />
            <Label htmlFor={isEdit ? "edit-is_active" : "is_active"}>Active</Label>
          </div>

          {errors.general && <p className="text-red-500 text-sm">{errors.general}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? isEdit
                  ? "Updating..."
                  : "Creating..."
                : isEdit
                ? "Update Tax"
                : "Create Tax"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}