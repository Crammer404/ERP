import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addressService, AddressFormData } from '@/services/address/addressService';

interface FormData {
  name: string;
  email: string;
  phone: string;
  owner_user_id?: number | null;
  tenant_manager_ids: number[];
  address: AddressFormData;
}

interface Errors {
  [key: string]: string;
}

interface TenantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initialData?: FormData;
  onSubmit: (data: FormData) => void;
  loading: boolean;
  errors: Errors;
  onClearError?: (field: string) => void;
}

const getDefaultFormData = (): FormData => ({
  name: '',
  email: '',
  phone: '',
  owner_user_id: null,
  tenant_manager_ids: [],
  address: addressService.getDefaultAddress(),
});

export const TenantFormModal: React.FC<TenantFormModalProps> = ({
  isOpen,
  onClose,
  mode,
  initialData,
  onSubmit,
  loading,
  errors,
  onClearError,
}) => {
  const [formData, setFormData] = useState<FormData>(getDefaultFormData());
  const [tenantManagerIdsInput, setTenantManagerIdsInput] = useState<string>('');

  useEffect(() => {
    if (!isOpen) {
      setFormData(getDefaultFormData());
      setTenantManagerIdsInput('');
      return;
    }

    if (mode === 'edit' && initialData) {
      const formDataCopy = {
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        owner_user_id: initialData.owner_user_id ?? null,
        tenant_manager_ids: initialData.tenant_manager_ids || [],
        address: addressService.createAddressFormData(initialData.address),
      };
      setFormData(formDataCopy);
      setTenantManagerIdsInput((formDataCopy.tenant_manager_ids || []).join(', '));
      return;
    }

    setFormData(getDefaultFormData());
    setTenantManagerIdsInput('');
  }, [isOpen, mode, initialData]);

  const parseTenantManagerIds = (value: string): number[] => {
    return Array.from(
      new Set(
        value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
          .map((item) => Number.parseInt(item, 10))
          .filter((id) => Number.isFinite(id) && id > 0),
      ),
    );
  };

  const clearFieldError = (field: string) => {
    if (!onClearError) {
      return;
    }

    const errorKey = field.includes('.') ? field.split('.').pop() : field;
    if (errorKey) {
      onClearError(errorKey);
    }
    onClearError(field);
  };

  const handleInputChange = (field: string, value: string) => {
    clearFieldError(field);

    const keys = field.split('.');
    setFormData((prev) => {
      const newData = { ...prev };
      let current: any = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }

      const targetKey = keys[keys.length - 1];
      if (targetKey === 'owner_user_id') {
        current[targetKey] = value ? Number.parseInt(value, 10) : null;
      } else {
        current[targetKey] = value;
      }
      return newData;
    });
  };

  const handleTenantManagerInputChange = (value: string) => {
    clearFieldError('tenant_manager_ids');
    setTenantManagerIdsInput(value);
    setFormData((prev) => ({
      ...prev,
      tenant_manager_ids: parseTenantManagerIds(value),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isCreateMode = mode === 'create';
  const modalTitle = isCreateMode ? 'Add New Tenant' : 'Edit Tenant';
  const modalDescription = isCreateMode
    ? 'Enter tenant details below. Owner User ID is required.'
    : 'Update tenant details below. Use Transfer Owner action for ownership changes.';
  const submitButtonText = isCreateMode
    ? (loading ? 'Creating...' : 'Create Tenant')
    : (loading ? 'Updating...' : 'Update Tenant');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{modalTitle}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {modalDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4 my-2 mx-2">
            <div className="space-y-2">
              <Label htmlFor="name">Tenant Name</Label>
              <Input
                id="name"
                type="text"
                disabled={loading}
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter tenant name"
              />
              {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  disabled={loading}
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                />
                {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  disabled={loading}
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^+\-\d]/g, '').slice(0, 11);
                    handleInputChange('phone', value);
                  }}
                  placeholder="Enter phone number"
                  maxLength={20}
                />
                <div className="flex justify-between items-center">
                  {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
                  <p className="text-xs text-gray-500 ml-auto">
                    {formData.phone.length}/11 digits
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="owner_user_id">Owner User ID</Label>
                <Input
                  id="owner_user_id"
                  type="number"
                  min={1}
                  disabled={loading || !isCreateMode}
                  value={formData.owner_user_id ?? ''}
                  onChange={(e) => handleInputChange('owner_user_id', e.target.value)}
                  placeholder={isCreateMode ? "Enter owner user id" : "Use transfer owner action"}
                />
                {(errors.owner_user_id || errors.user_id) && (
                  <p className="text-red-500 text-xs">{errors.owner_user_id || errors.user_id}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant_manager_ids">Tenant Manager User IDs</Label>
                <Input
                  id="tenant_manager_ids"
                  type="text"
                  disabled={loading}
                  value={tenantManagerIdsInput}
                  onChange={(e) => handleTenantManagerInputChange(e.target.value)}
                  placeholder="e.g. 12, 15, 22"
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated user IDs with Tenant Manager role.
                </p>
                {(errors.tenant_manager_ids || errors['tenant_manager_ids.*']) && (
                  <p className="text-red-500 text-xs">
                    {errors.tenant_manager_ids || errors['tenant_manager_ids.*']}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Address</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    type="text"
                    value={formData.address.country}
                    disabled
                  />
                </div>

                {addressService.getAddressFields().map(({ field, placeholder }) => (
                  <div key={field} className="space-y-2">
                    <Label htmlFor={field}>{addressService.formatAddressLabel(field)}</Label>
                    <Input
                      id={field}
                      type="text"
                      disabled={loading}
                      value={formData.address[field as keyof typeof formData.address]}
                      onChange={(e) => handleInputChange(`address.${field}`, e.target.value)}
                      placeholder={placeholder}
                    />
                    {(errors[field] || errors[`address.${field}`]) && (
                      <p className="text-red-500 text-xs">{errors[field] || errors[`address.${field}`]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {errors.general && <p className="text-red-500 text-xs">{errors.general}</p>}
          </form>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            onClick={handleSubmit}
            className="min-w-[100px]"
          >
            {submitButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
