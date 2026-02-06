import React, { useState, useEffect } from 'react';
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
import { addressService, AddressFormData } from '@/services/address/addressService';

interface FormData {
  name: string;
  email: string;
  phone: string;
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

export const TenantFormModal: React.FC<TenantFormModalProps> = ({
  isOpen,
  onClose,
  mode,
  initialData,
  onSubmit,
  loading,
  errors,
  onClearError
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    address: addressService.getDefaultAddress()
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        const formDataCopy = {
          name: initialData.name || '',
          email: initialData.email || '',
          phone: initialData.phone || '',
          address: addressService.createAddressFormData(initialData.address)
        };
        setFormData(formDataCopy);
      } else if (mode === 'create') {
        setFormData({
          name: '',
          email: '',
          phone: '',
          address: addressService.getDefaultAddress()
        });
      }
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: addressService.getDefaultAddress()
      });
    }
  }, [isOpen, mode, initialData]);

  const handleInputChange = (field: string, value: string) => {
    if (onClearError) {
      const errorKey = field.includes('.') ? field.split('.').pop() : field;
      if (errorKey) {
        onClearError(errorKey);
      }
    }

    const keys = field.split('.');
    setFormData(prev => {
      const newData = { ...prev };
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isCreateMode = mode === 'create';
  const modalTitle = isCreateMode ? 'Add New Tenant' : 'Edit Tenant';
  const modalDescription = isCreateMode 
    ? 'Enter tenant details below. All fields are required.'
    : 'Update tenant details below.';
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
                    // Allow +, -, and numbers only, limit to reasonable length
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
                    <Label htmlFor={field}>
                      {addressService.formatAddressLabel(field)}
                    </Label>
                    <Input
                      id={field}
                      type="text"
                      disabled={loading}
                      value={formData.address[field as keyof typeof formData.address]}
                      onChange={(e) => handleInputChange(`address.${field}`, e.target.value)}
                      placeholder={placeholder}
                    />
                    {errors[field] && (
                      <p className="text-red-500 text-xs">{errors[field]}</p>
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
}
