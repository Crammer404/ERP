'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhilippineAddressForm } from '@/components/forms/address/philippine-address-form';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import '../styles/phone-input-styles.css';
import { CustomerFormData, FormErrors } from '../hooks/useCustomerForm';
import { useState, useRef, useEffect } from 'react';
import { tenantContextService } from '@/services/tenant/tenantContextService';

interface CustomerFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isEdit?: boolean;
  formData: CustomerFormData;
  onInputChange: (field: keyof CustomerFormData, value: string) => void;
  onAddressUpdate: (addressData: any) => void;
  errors: Record<string, string>;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function CustomerFormModal({
  isOpen,
  onOpenChange,
  isEdit = false,
  formData,
  onInputChange,
  onAddressUpdate,
  errors,
  isLoading,
  onSubmit,
}: CustomerFormModalProps) {
  const [phoneValue, setPhoneValue] = useState(formData.phone_number || '');
  const [phoneError, setPhoneError] = useState('');
  const phoneContainerRef = useRef<HTMLDivElement | null>(null);
  const [phoneDropdownUp, setPhoneDropdownUp] = useState(false);

  // Update phone value when formData changes (for edit mode)
  useEffect(() => {
    setPhoneValue(formData.phone_number || '');
  }, [formData.phone_number]);

  // Get selected branch from header context
  const selectedBranch = tenantContextService.getStoredBranchContext();

  const updatePhoneDropdownDirection = () => {
    const container = phoneContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const shouldFlipUp = spaceBelow < 256 && spaceAbove > spaceBelow;
    setPhoneDropdownUp(shouldFlipUp);
  };

  useEffect(() => {
    // Only validate if the user has actually typed something (not just initial load)
    if (phoneValue && phoneValue !== formData.phone_number) {
      // Use react-phone-input-2's built-in validation - just check if it's not empty and has reasonable length
      const isValid = phoneValue.length >= 10 && phoneValue.length <= 15 && /^\+?[0-9]+$/.test(phoneValue);
      setPhoneError(isValid ? '' : 'Please enter a valid phone number');
    } else {
      setPhoneError('');
    }
  }, [phoneValue, formData.phone_number]);

  const handlePhoneChange = (value: string) => {
    setPhoneValue(value);
    onInputChange('phone_number', value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Customer" : "Add New Customer"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update customer details below."
              : "Enter customer details below. All fields marked with * are required."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor={isEdit ? "edit-first_name" : "first_name"}>First Name <span className="text-red-500">*</span></Label>
              <Input
                id={isEdit ? "edit-first_name" : "first_name"}
                type="text"
                disabled={isLoading}
                value={formData.first_name}
                onChange={(e) => onInputChange("first_name", e.target.value)}
                placeholder="e.g. John"
              />
              {errors.first_name && <p className="text-red-500 text-sm">{errors.first_name}</p>}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor={isEdit ? "edit-last_name" : "last_name"}>Last Name</Label>
              <Input
                id={isEdit ? "edit-last_name" : "last_name"}
                type="text"
                disabled={isLoading}
                value={formData.last_name}
                onChange={(e) => onInputChange("last_name", e.target.value)}
                placeholder="e.g. Doe"
              />
              {errors.last_name && <p className="text-red-500 text-sm">{errors.last_name}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor={isEdit ? "edit-email" : "email"}>Email</Label>
              <Input
                id={isEdit ? "edit-email" : "email"}
                type="email"
                disabled={isLoading}
                value={formData.email}
                onChange={(e) => onInputChange("email", e.target.value)}
                placeholder="contact@customer.com"
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
            </div>

            {/* Facebook Name */}
            <div className="space-y-2">
              <Label htmlFor={isEdit ? "edit-fb_name" : "fb_name"}>Facebook Name</Label>
              <Input
                id={isEdit ? "edit-fb_name" : "fb_name"}
                type="text"
                disabled={isLoading}
                value={formData.fb_name}
                onChange={(e) => onInputChange("fb_name", e.target.value)}
                placeholder="Facebook profile name"
              />
              {errors.fb_name && <p className="text-red-500 text-sm">{errors.fb_name}</p>}
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor={isEdit ? "edit-phone" : "phone"}>Phone Number</Label>
              <div className="phone-input-wrapper" ref={phoneContainerRef}>
                <PhoneInput
                  country={'ph'}
                  value={phoneValue}
                  onChange={handlePhoneChange}
                  placeholder="Contact Phone"
                  enableSearch={true}
                  searchPlaceholder="Search country..."
                  containerClass="phone-input-container"
                  dropdownStyle={{
                    maxHeight: 256,
                    overflowY: 'auto',
                    position: 'absolute',
                    top: phoneDropdownUp ? 'auto' : '100%',
                    bottom: phoneDropdownUp ? '100%' : 'auto',
                    zIndex: 50
                  }}
                  onFocus={updatePhoneDropdownDirection}
                  onClick={updatePhoneDropdownDirection}
                />
                <div className="flex justify-between items-center mt-1">
                  <div className="flex-1">
                    {phoneError && (
                      <p className="text-xs text-red-600">{phoneError}</p>
                    )}
                    {errors.phone_number && (
                      <p className="text-xs text-red-600">{errors.phone_number}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* TIN */}
            <div className="space-y-2">
              <Label htmlFor={isEdit ? "edit-tin" : "tin"}>TIN</Label>
              <Input
                id={isEdit ? "edit-tin" : "tin"}
                type="text"
                disabled={isLoading}
                value={formData.tin}
                onChange={(e) => onInputChange("tin", e.target.value)}
                placeholder="Tax Identification Number"
              />
            </div>

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
          </div>

          {/* Address Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Address Information</h3>
            <PhilippineAddressForm
              data={formData.address}
              onUpdate={onAddressUpdate}
              errors={errors}
            />
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
                ? "Update Customer"
                : "Create Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}