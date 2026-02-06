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
import { PhilippineAddressForm } from '@/components/forms/address/philippine-address-form';
import { AddressData } from '@/services/address/psgc.service';

interface FormData {
  name: string;
  email: string;
  contact_no: string;
  address: AddressFormData;
}

interface Errors {
  [key: string]: string;
}

interface BranchFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initialData?: FormData;
  onSubmit: (data: FormData) => void;
  loading: boolean;
  errors: Errors;
  onClearError?: (field: string) => void;
}

export const BranchFormModal: React.FC<BranchFormModalProps> = ({
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
    contact_no: '',
    address: addressService.getDefaultAddress()
  });

  // Store AddressData separately to preserve PSGC objects
  const [addressData, setAddressData] = useState<AddressData>(() => {
    const defaultAddr = addressService.getDefaultAddress();
    return {
      country: defaultAddr.country || 'Philippines',
      zipcode: defaultAddr.zipcode || defaultAddr.postal_code || '',
      region: null,
      province: null,
      city: null,
      barangay: null,
      street: defaultAddr.street || '',
      blockLot: defaultAddr.block_lot || ''
    };
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        const addressFormData = addressService.createAddressFormData(initialData.address);
        const formDataCopy = {
          name: initialData.name || '',
          email: initialData.email || '',
          contact_no: initialData.contact_no || '',
          address: addressFormData
        };
        setFormData(formDataCopy);
        
        // Convert to AddressData for the form (will be matched by PhilippineAddressForm)
        setAddressData({
          country: addressFormData.country || 'Philippines',
          zipcode: addressFormData.zipcode || addressFormData.postal_code || '',
          region: addressFormData.region ? { code: addressFormData.region, name: addressFormData.region } : null,
          province: addressFormData.province ? { code: addressFormData.province, name: addressFormData.province, region: addressFormData.region || '' } : null,
          city: addressFormData.city ? { code: addressFormData.city, name: addressFormData.city, type: '', region: addressFormData.region || '', province: addressFormData.province || '' } : null,
          barangay: addressFormData.barangay ? { code: addressFormData.barangay, name: addressFormData.barangay, status: '', region: addressFormData.region || '', province: addressFormData.province || '', city_municipality: addressFormData.city || '' } : null,
          street: addressFormData.street || '',
          blockLot: addressFormData.block_lot || ''
        });
      } else if (mode === 'create') {
        const defaultAddr = addressService.getDefaultAddress();
        setFormData({
          name: '',
          email: '',
          contact_no: '',
          address: defaultAddr
        });
        setAddressData({
          country: defaultAddr.country || 'Philippines',
          zipcode: defaultAddr.zipcode || defaultAddr.postal_code || '',
          region: null,
          province: null,
          city: null,
          barangay: null,
          street: defaultAddr.street || '',
          blockLot: defaultAddr.block_lot || ''
        });
      }
    } else {
      const defaultAddr = addressService.getDefaultAddress();
      setFormData({
        name: '',
        email: '',
        contact_no: '',
        address: defaultAddr
      });
      setAddressData({
        country: defaultAddr.country || 'Philippines',
        zipcode: defaultAddr.zipcode || defaultAddr.postal_code || '',
        region: null,
        province: null,
        city: null,
        barangay: null,
        street: defaultAddr.street || '',
        blockLot: defaultAddr.block_lot || ''
      });
    }
  }, [isOpen, mode, initialData]);

  // Convert AddressData back to AddressFormData for submission
  const convertFromAddressData = (addressData: AddressData): AddressFormData => {
    return {
      country: addressData.country || 'Philippines',
      postal_code: addressData.zipcode || '',
      zipcode: addressData.zipcode || '',
      region: addressData.region?.name || addressData.region?.code || '',
      province: addressData.province?.name || addressData.province?.code || '',
      city: addressData.city?.name || addressData.city?.code || '',
      street: addressData.street || '',
      barangay: addressData.barangay?.name || addressData.barangay?.code || '',
      block_lot: addressData.blockLot || ''
    };
  };

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

  const handleAddressUpdate = (updatedAddressData: AddressData) => {
    if (onClearError) {
      // Clear address-related errors
      ['address.country', 'address.zipcode', 'address.region', 'address.province', 'address.city', 'address.street', 'address.barangay', 'address.block_lot'].forEach(key => {
        onClearError(key);
      });
    }
    
    // Update the AddressData state (preserves PSGC objects)
    setAddressData(updatedAddressData);
    
    // Also update formData for submission
    const convertedAddress = convertFromAddressData(updatedAddressData);
    setFormData(prev => ({
      ...prev,
      address: convertedAddress
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure formData.address is up to date with addressData
    const convertedAddress = convertFromAddressData(addressData);
    const finalFormData = {
      ...formData,
      address: convertedAddress
    };
    onSubmit(finalFormData);
  };

  const isCreateMode = mode === 'create';
  const modalTitle = isCreateMode ? 'Add New Branch' : 'Edit Branch';
  const modalDescription = isCreateMode 
    ? 'Enter branch details below. All fields are required.'
    : 'Update branch details below.';
  const submitButtonText = isCreateMode 
    ? (loading ? 'Creating...' : 'Create Branch')
    : (loading ? 'Updating...' : 'Update Branch');


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
              <Label htmlFor="name">Branch Name</Label>
              <Input
                id="name"
                type="text"
                disabled={loading}
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter branch name"
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
                <Label htmlFor="contact_no">Contact Number</Label>
                <Input
                  id="contact_no"
                  type="tel"
                  disabled={loading}
                  value={formData.contact_no}
                  onChange={(e) => {
                    // Allow +, -, and numbers only, limit to reasonable length
                    const value = e.target.value.replace(/[^+\-\d]/g, '').slice(0, 11);
                    handleInputChange('contact_no', value);
                  }}
                  placeholder="Enter contact number"
                  maxLength={20}
                />
                <div className="flex justify-between items-center">
                  {errors.contact_no && <p className="text-red-500 text-xs">{errors.contact_no}</p>}
                  <p className="text-xs text-gray-500 ml-auto">
                    {formData.contact_no.length}/11 digits
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Address</h3>
              <PhilippineAddressForm
                data={addressData}
                onUpdate={handleAddressUpdate}
                errors={errors}
              />
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
