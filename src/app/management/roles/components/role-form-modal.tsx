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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PermissionButton } from '@/components/guards';

interface RoleFormData {
  name: string;
  description: string;
}

interface RoleFormErrors {
  name: string;
  description: string;
}

interface RoleFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  formData: RoleFormData;
  formErrors: RoleFormErrors;
  loading: boolean;
  onClose: () => void;
  onChange: (field: keyof RoleFormData, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function RoleFormModal({
  isOpen,
  mode,
  formData,
  formErrors,
  loading,
  onClose,
  onChange,
  onSubmit,
}: RoleFormModalProps) {
  const isCreateMode = mode === 'create';
  const title = isCreateMode ? 'Add New Role' : 'Edit Role';
  const description = isCreateMode
    ? 'Enter role details below. All fields are required.'
    : 'Update role details below.';
  const submitLabel = isCreateMode ? (loading ? 'Creating...' : 'Create Role') : (loading ? 'Updating...' : 'Update Role');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={isCreateMode ? 'name' : 'edit-name'}>Role Name</Label>
            <Input
              id={isCreateMode ? 'name' : 'edit-name'}
              type="text"
              placeholder={isCreateMode ? "e.g. Superman" : "Superman"}
              value={formData.name}
              onChange={(e) => onChange('name', e.target.value)}
            />
            {formErrors.name && (
              <p className="text-sm text-red-500">{formErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={isCreateMode ? 'description' : 'edit-description'}>Description</Label>
            <Input
              id={isCreateMode ? 'description' : 'edit-description'}
              type="text"
              placeholder={isCreateMode ? "e.g. A powerful role with special abilities" : "A powerful role with special abilities"}
              value={formData.description}
              onChange={(e) => onChange('description', e.target.value)}
            />
            {formErrors.description && (
              <p className="text-sm text-red-500">{formErrors.description}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <PermissionButton
              module="roles"
              action={isCreateMode ? 'create' : 'update'}
              type="submit"
              disabled={loading}
            >
              {submitLabel}
            </PermissionButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

