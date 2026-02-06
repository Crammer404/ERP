'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhilippineAddressForm } from '@/components/forms/address/philippine-address-form';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import '../styles/phone-input-styles.css';
import { SupplierFormData } from '../hooks/useSupplierForm';
import { SupplierCategory } from '../services/supplierCategoryService';
import { useState, useRef, useEffect } from 'react';
import { tenantContextService } from '@/services/tenant/tenantContextService';
import { SupplierCategoryFormModal } from './SupplierCategoryFormModal';
import { useSupplierCategoriesCRUD, invalidateCategoriesCache } from '../hooks/useSupplierCategoriesCRUD';
import { createSupplierCategory } from '../services/supplierCategoryService';
import { useToast } from '@/hooks/use-toast';

interface SupplierFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isEdit?: boolean;
  formData: SupplierFormData;
  onInputChange: (field: string, value: string) => void;
  onAddressUpdate: (addressData: any) => void;
  errors: Record<string, string>;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  categories: SupplierCategory[];
  categoriesLoading: boolean;
  onCategoryCreated?: () => void; // Optional callback to refresh categories in parent
}

export function SupplierFormModal({
  isOpen,
  onOpenChange,
  isEdit = false,
  formData,
  onInputChange,
  onAddressUpdate,
  errors,
  isLoading,
  onSubmit,
  categories,
  categoriesLoading,
  onCategoryCreated,
}: SupplierFormModalProps) {
  const [phoneValue, setPhoneValue] = useState(formData.phone_number || '');
  const [phoneError, setPhoneError] = useState('');
  const phoneContainerRef = useRef<HTMLDivElement | null>(null);
  const [phoneDropdownUp, setPhoneDropdownUp] = useState(false);
  
  // Category modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({ name: '' });
  const [categoryErrors, setCategoryErrors] = useState<Record<string, string>>({});
  const [categoryFormLoading, setCategoryFormLoading] = useState(false);
  const [newlyCreatedCategoryId, setNewlyCreatedCategoryId] = useState<number | null>(null);
  
  const { toast } = useToast();
  const { refreshCategories } = useSupplierCategoriesCRUD();

  // Update phone value when formData changes (for edit mode)
  useEffect(() => {
    setPhoneValue(formData.phone_number || '');
  }, [formData.phone_number]);

  // Automatically select newly created category
  useEffect(() => {
    if (newlyCreatedCategoryId !== null) {
      const categoryExists = categories.some(cat => cat.id === newlyCreatedCategoryId);
      if (categoryExists) {
        onInputChange("supplier_category_id", String(newlyCreatedCategoryId));
        setNewlyCreatedCategoryId(null); // Reset after setting
      }
    }
  }, [newlyCreatedCategoryId, categories, onInputChange]);

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

  // Category form handlers
  const handleCategoryInputChange = (field: string, value: string) => {
    setCategoryFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (categoryErrors[field]) {
      setCategoryErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const resetCategoryForm = () => {
    setCategoryFormData({ name: '' });
    setCategoryErrors({});
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryFormLoading(true);
    setCategoryErrors({});

    if (!categoryFormData.name.trim()) {
      setCategoryErrors({ name: 'Category name is required' });
      setCategoryFormLoading(false);
      return;
    }

    const selectedBranch = tenantContextService.getStoredBranchContext();
    const branchId = selectedBranch?.id;

    try {
      const response = await createSupplierCategory({
        name: categoryFormData.name.trim(),
        branch_id: branchId
      });
      
      const newCategory = response.category;
      
      // Invalidate cache to ensure fresh data
      invalidateCategoriesCache();
      
      // Refresh categories
      await refreshCategories();
      
      // Notify parent to refresh if callback provided
      if (onCategoryCreated) {
        onCategoryCreated();
      }
      
      // Set the newly created category ID - useEffect will handle auto-selection
      // once it appears in the categories list
      if (newCategory && newCategory.id) {
        setNewlyCreatedCategoryId(newCategory.id);
      }
      
      setIsCategoryModalOpen(false);
      resetCategoryForm();
      
      toast({
        title: "Category Created",
        description: `"${newCategory.name}" has been added successfully.`,
        variant: "success",
      });
    } catch (err: any) {
      console.error('Category creation error:', err.response?.data || err);
      let apiErrors: Record<string, string> = {};
      
      if (err.response?.data?.errors) {
        for (const key in err.response.data.errors) {
          apiErrors[key] = err.response.data.errors[key][0];
        }
      } else {
        const message = err.response?.data?.message || "Failed to create category.";
        apiErrors.general = message;
      }
      
      if (apiErrors.general) {
        toast({
          title: "Category Creation Failed",
          description: apiErrors.general,
          variant: "destructive",
        });
      }
      setCategoryErrors(apiErrors);
    } finally {
      setCategoryFormLoading(false);
    }
  };

  const modalTitle = isEdit ? "Edit Supplier" : "Add New Supplier";
  const modalDescription = isEdit
    ? "Update supplier details below."
    : "Enter supplier details below. All fields marked with * are required.";
  const submitButtonText = isEdit
    ? (isLoading ? "Updating..." : "Update Supplier")
    : (isLoading ? "Creating..." : "Create Supplier");

  // Reset newly created category ID when modal closes
  useEffect(() => {
    if (!isOpen) {
      setNewlyCreatedCategoryId(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{modalTitle}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {modalDescription}
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-[60vh] overflow-y-auto">
          <form onSubmit={onSubmit} className="space-y-4 my-2 mx-2">
            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor={isEdit ? "edit-name" : "name"}>Company Name <span className="text-red-500">*</span></Label>
              <Input
                id={isEdit ? "edit-name" : "name"}
                type="text"
                disabled={isLoading}
                value={formData.name}
                onChange={(e) => onInputChange("name", e.target.value)}
                placeholder="e.g. ABC Distributors"
              />
              {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor={isEdit ? "edit-email" : "email"}>Email <span className="text-red-500">*</span></Label>
                <Input
                  id={isEdit ? "edit-email" : "email"}
                  type="email"
                  disabled={isLoading}
                  value={formData.email}
                  onChange={(e) => onInputChange("email", e.target.value)}
                  placeholder="contact@supplier.com"
                />
                {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor={isEdit ? "edit-phone" : "phone"}>Phone Number <span className="text-red-500">*</span></Label>
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
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor={isEdit ? "edit-description" : "description"}>Description</Label>
              <Input
                id={isEdit ? "edit-description" : "description"}
                type="text"
                disabled={isLoading}
                value={formData.description}
                onChange={(e) => onInputChange("description", e.target.value)}
                placeholder="Brief description of the supplier (optional)..."
              />
              {errors.description && <p className="text-red-500 text-xs">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Supplier Category */}
              <div className="space-y-2">
                <Label htmlFor={isEdit ? "edit-supplier-category" : "supplier-category"}>Supplier Category <span className="text-red-500">*</span></Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.supplier_category_id || ""}
                    onValueChange={(value) => onInputChange("supplier_category_id", value)}
                    disabled={isLoading || categoriesLoading}
                  >
                    <SelectTrigger id={isEdit ? "edit-supplier-category" : "supplier-category"} className="flex-1">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      resetCategoryForm();
                      setIsCategoryModalOpen(true);
                    }}
                    disabled={isLoading || categoriesLoading}
                  >
                    +
                  </Button>
                </div>
                {errors.supplier_category_id && <p className="text-red-500 text-xs">{errors.supplier_category_id}</p>}
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
              <h3 className="text-lg font-semibold">Address</h3>
              <PhilippineAddressForm
                data={formData.address}
                onUpdate={onAddressUpdate}
                errors={errors}
              />
            </div>

            {errors.general && <p className="text-red-500 text-xs">{errors.general}</p>}
          </form>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            type="button" 
            disabled={isLoading}
            onClick={(e) => {
              e.preventDefault();
              onSubmit(e);
            }}
            className="min-w-[100px]"
          >
            {submitButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Supplier Category Modal */}
      <SupplierCategoryFormModal
        isOpen={isCategoryModalOpen}
        onOpenChange={setIsCategoryModalOpen}
        isEdit={false}
        formData={categoryFormData}
        onInputChange={handleCategoryInputChange}
        errors={categoryErrors}
        isLoading={categoryFormLoading}
        onSubmit={handleCreateCategory}
      />
    </Dialog>
  );
}