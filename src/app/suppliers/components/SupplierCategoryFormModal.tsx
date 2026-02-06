'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SupplierCategory } from '../services/supplierCategoryService';
import { tenantContextService } from '@/services/tenant/tenantContextService';

interface SupplierCategoryFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isEdit?: boolean;
  category?: SupplierCategory | null;
  formData: { name: string };
  onInputChange: (field: string, value: string) => void;
  errors: Record<string, string>;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function SupplierCategoryFormModal({
  isOpen,
  onOpenChange,
  isEdit = false,
  category,
  formData,
  onInputChange,
  errors,
  isLoading,
  onSubmit,
}: SupplierCategoryFormModalProps) {
  // Get selected branch from header context
  const selectedBranch = tenantContextService.getStoredBranchContext();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Category" : "Add New Category"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update category details below."
              : "Enter category details below."}
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

          <div className="space-y-2">
            <Label htmlFor={isEdit ? "edit-name" : "name"}>Category Name <span className="text-red-500">*</span></Label>
            <Input
              id={isEdit ? "edit-name" : "name"}
              type="text"
              disabled={isLoading}
              value={formData.name}
              onChange={(e) => onInputChange("name", e.target.value)}
              placeholder="e.g. Electronics, Clothing"
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
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
                ? "Update Category"
                : "Create Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}