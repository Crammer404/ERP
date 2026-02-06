import React, { useState, useEffect, useMemo } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff } from "lucide-react";
import { PhilippineAddressForm } from "@/components/forms/address/philippine-address-form";
import type { AddressData } from "@/services/address/psgc.service";
import psgcService from "@/services/address/psgc.service";

interface Role {
  id: number;
  name: string;
}

interface Address {
  country: string;
  postal_code: string;
  zipcode: string;
  region: string;
  province: string;
  city: string;
  barangay: string;
  street: string;
  block_lot: string;
}

interface UserInfo {
  first_name: string;
  last_name: string;
  middle_name: string;
  address: Address;
}

interface FormData {
  email: string;
  role: string;
  password: string;
  confirmPassword: string;
  user_info: UserInfo;
  branch_ids: string[];
}

interface Errors {
  [key: string]: string;
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  roles: Role[];
  activeBranchId?: number | null;
  activeBranchName?: string | null;
  initialData?: FormData;
  onSubmit: (data: FormData) => void;
  loading: boolean;
  errors: Errors;
  onClearError?: (field: string) => void;
}

const getDefaultAddressData = (): AddressData => ({
  blockLot: '',
  street: '',
  barangay: null,
  city: null,
  province: null,
  region: null,
  country: 'Philippines',
  zipcode: '',
});

const getDefaultFormData = (): FormData => ({
  email: '',
  role: '',
  password: '',
  confirmPassword: '',
  user_info: {
    first_name: '',
    last_name: '',
    middle_name: '',
    address: {
      country: 'Philippines',
      postal_code: '',
      zipcode: '',
      region: '',
      province: '',
      city: '',
      barangay: '',
      street: '',
      block_lot: '',
    },
  },
  branch_ids: [],
});

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  mode,
  roles,
  activeBranchId,
  activeBranchName,
  initialData,
  onSubmit,
  loading,
  errors,
  onClearError
}) => {
  const [formData, setFormData] = useState<FormData>(getDefaultFormData());
  const [addressData, setAddressData] = useState<AddressData>(getDefaultAddressData());

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const activeBranchLabel = useMemo(() => {
    if (activeBranchName) return activeBranchName;
    return 'No active branch selected';
  }, [activeBranchName]);

  // Reset form when modal opens/closes or when initialData changes
  useEffect(() => {
    let cancelled = false;

    const initializeForm = async () => {
      const baseForm = getDefaultFormData();

      if (mode === 'edit' && initialData) {
        const userAddress = initialData.user_info?.address || {};
        const mergedForm: FormData = {
          ...baseForm,
          ...initialData,
          branch_ids: initialData.branch_ids || [],
          user_info: {
            ...baseForm.user_info,
            ...initialData.user_info,
            address: {
              ...baseForm.user_info.address,
              ...userAddress,
              zipcode:
                userAddress.zipcode ||
                userAddress.postal_code ||
                '',
              postal_code:
                userAddress.postal_code ||
                userAddress.zipcode ||
                '',
              barangay: userAddress.barangay || '',
              block_lot: userAddress.block_lot || '',
              street: userAddress.street || '',
              city: userAddress.city || '',
              province: userAddress.province || '',
              region: userAddress.region || '',
              country: userAddress.country || 'Philippines',
            },
          },
        };

        if (!cancelled) {
          setFormData(mergedForm);
        }

        const hydrateAddress = async () => {
          const address = mergedForm.user_info?.address;
          const defaultAddress = getDefaultAddressData();

          // If no address data, set defaults
          if (!address || (typeof address === 'object' && Object.keys(address).length === 0)) {
            if (!cancelled) {
              setAddressData(defaultAddress);
            }
            return;
          }

          // Extract address fields, handling both string and object formats
          const street = address.street || '';
          const blockLot = address.block_lot || '';
          const country = address.country || 'Philippines';
          const zipcode = address.zipcode || address.postal_code || '';
          const regionName = address.region || '';
          const provinceName = address.province || '';
          const cityName = address.city || '';
          const barangayName = address.barangay || '';

          console.log('[UserFormModal] Initializing address data from DB:', {
            region: regionName,
            province: provinceName,
            city: cityName,
            barangay: barangayName,
            fullAddress: address,
          });

          // Set address data immediately with names from DB
          // Don't call PSGC API here - let the form component load it when user clicks dropdown
          if (!cancelled) {
            const addressDataWithNames = {
              blockLot,
              street,
              country,
              zipcode,
              // Create temporary objects with names from DB
              // PSGC API will be called when user interacts with dropdowns
              region: regionName && regionName.trim()
                ? { name: regionName.trim(), code: regionName.trim() } as any
                : null,
              province: provinceName && provinceName.trim()
                ? { name: provinceName.trim(), code: provinceName.trim() } as any
                : null,
              city: cityName && cityName.trim()
                ? { name: cityName.trim(), code: cityName.trim() } as any
                : null,
              barangay: barangayName && barangayName.trim()
                ? { name: barangayName.trim(), code: barangayName.trim() } as any
                : null,
            };
            
            console.log('[UserFormModal] Setting addressData:', {
              region: addressDataWithNames.region,
              province: addressDataWithNames.province,
              city: addressDataWithNames.city,
              barangay: addressDataWithNames.barangay,
            });
            
            setAddressData(addressDataWithNames);
          }
        };

        await hydrateAddress();
      } else {
        if (!cancelled) {
          setFormData(baseForm);
          setAddressData(getDefaultAddressData());
        }
      }

      if (!cancelled) {
        setShowPassword(false);
        setShowConfirmPassword(false);
      }
    };

    if (isOpen) {
      void initializeForm();
    }

    return () => {
      cancelled = true;
    };
  }, [isOpen, mode, initialData]);

  useEffect(() => {
    if (!isOpen) return;
    if (mode !== 'create') return;

    setFormData(prev => ({
      ...prev,
      branch_ids: activeBranchId ? [activeBranchId.toString()] : [],
    }));
  }, [activeBranchId, isOpen, mode]);

  const handleInputChange = (field: string, value: string) => {
    // Clear error for this field when user starts typing
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
      
      // Navigate to the nested property
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      // Set the final value
      current[keys[keys.length - 1]] = value;
      
      return newData;
    });
  };

  const handleAddressUpdate = (data: AddressData) => {
    setAddressData(data);

    const regionName = data.region?.name || '';
    const provinceName = data.province?.name || '';
    const cityName = data.city?.name || '';
    const barangayName = data.barangay?.name || '';

    setFormData(prev => ({
      ...prev,
      user_info: {
        ...prev.user_info,
        address: {
          ...prev.user_info.address,
          country: data.country,
          postal_code: data.zipcode,
          zipcode: data.zipcode,
          region: regionName,
          province: provinceName,
          city: cityName,
          barangay: barangayName,
          street: data.street,
          block_lot: data.blockLot,
        },
      },
    }));

    if (onClearError) {
      if (data.country) {
        onClearError('country');
        onClearError('address.country');
      }
      if (data.zipcode) {
        onClearError('postal_code');
        onClearError('zipcode');
        onClearError('address.zipcode');
      }
      if (regionName) {
        onClearError('region');
        onClearError('address.region');
      }
      if (provinceName) {
        onClearError('province');
        onClearError('address.province');
      }
      if (cityName) {
        onClearError('city');
        onClearError('address.city');
      }
      if (barangayName) {
        onClearError('barangay');
        onClearError('address.barangay');
      }
      if (data.street) {
        onClearError('street');
        onClearError('address.street');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('UserFormModal submit clicked', {
      rolesCount: roles.length,
      activeBranchId,
      loading,
    });
    if (!roles.length) {
      console.warn('UserFormModal: No assignable roles available; submission blocked.');
      return;
    }
    if (!activeBranchId) {
      console.warn('UserFormModal: No active branch context; submission blocked.');
      return;
    }
    onSubmit(formData);
  };

  const isCreateMode = mode === 'create';
  const modalTitle = isCreateMode ? 'Add New User' : 'Edit User';
  const modalDescription = isCreateMode 
    ? 'Enter user details below. All fields are required.'
    : 'Update user details below.';
  const submitButtonText = isCreateMode 
    ? (loading ? 'Creating...' : 'Create User')
    : (loading ? 'Updating...' : 'Update User');

  const canSubmit = !loading && roles.length > 0 && (!!activeBranchId);

  const addressErrors = useMemo(() => {
    const relevantKeys = new Set([
      'country',
      'postal_code',
      'zipcode',
      'region',
      'province',
      'city',
      'barangay',
      'street',
    ]);

    const mapped: Record<string, string> = {};

    Object.entries(errors || {}).forEach(([key, value]) => {
      if (!value) return;

      if (key.startsWith('address.')) {
        mapped[key] = value;
        return;
      }

      if (relevantKeys.has(key)) {
        const normalizedKey =
          key === 'postal_code' || key === 'zipcode'
            ? 'address.zipcode'
            : key === 'country'
            ? 'address.country'
            : key === 'barangay'
            ? 'address.barangay'
            : `address.${key}`;

        mapped[normalizedKey] = value;
      }
    });

    return mapped;
  }, [errors]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        {/* Modal Header */}
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{modalTitle}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {modalDescription}
          </DialogDescription>
        </DialogHeader>
        
        {/* Modal Body */}
        <div className="max-h-[60vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4 my-2 mx-2">
          {/* Names */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                type="text"
                disabled={loading}
                value={formData.user_info.first_name}
                onChange={(e) => handleInputChange('user_info.first_name', e.target.value)}
                placeholder="Enter first name"
              />
              {errors.first_name && <p className="text-red-500 text-xs">{errors.first_name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                type="text"
                disabled={loading}
                value={formData.user_info.last_name}
                onChange={(e) => handleInputChange('user_info.last_name', e.target.value)}
                placeholder="Enter last name"
              />
              {errors.last_name && <p className="text-red-500 text-xs">{errors.last_name}</p>}
            </div>
          </div>

          {/* Middle Name */}
          <div className="space-y-2">
            <Label htmlFor="middle_name">Middle Name</Label>
            <Input
              id="middle_name"
              type="text"
              disabled={loading}
              value={formData.user_info.middle_name}
              onChange={(e) => handleInputChange('user_info.middle_name', e.target.value)}
              placeholder="Enter middle name (optional)"
            />
          </div>

          {/* Email + Role */}
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
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              {roles.length === 0 ? (
                <div className="text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted">
                  No assignable roles available. Contact your administrator.
                </div>
              ) : (
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleInputChange('role', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.role && <p className="text-red-500 text-xs">{errors.role}</p>}
            </div>
          </div>

        <div className="space-y-2">
          <Label>Branch</Label>
          <Input
            value={activeBranchLabel}
            readOnly
            disabled
            className="bg-muted text-sm"
          />
          {errors.branch_ids && <p className="text-red-500 text-xs">{errors.branch_ids}</p>}
          {!activeBranchId && (
            <p className="text-xs text-muted-foreground">
              Select an active branch from the branch filter before creating a user.
            </p>
          )}
          {!isCreateMode && (
            <p className="text-xs text-muted-foreground">
              Branch assignments are managed during user creation and reflect the active branch context.
            </p>
          )}
          {errors.general && (
            <p className="text-xs text-red-500">{errors.general}</p>
          )}
        </div>

          {/* Password */}
          <div className="space-y-2 relative">
            <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                disabled={loading}
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="pr-10"
                placeholder="Enter password (min 8 characters)"
              />
            <span
              className="absolute top-9 right-3 cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </span>
            {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2 relative">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              disabled={loading}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
              className="pr-10"
              placeholder="Confirm password"
            />
            <span
              className="absolute top-9 right-3 cursor-pointer"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </span>
            {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword}</p>}
          </div>

          {/* Address fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Address</h3>
            <PhilippineAddressForm
              key={`address-form-${mode}-${isOpen ? 'open' : 'closed'}-${initialData?.email || 'new'}`}
              data={addressData}
              onUpdate={handleAddressUpdate}
              errors={addressErrors}
            />
          </div>
          </form>
        </div>

        {/* Modal Footer */}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={!canSubmit}
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
