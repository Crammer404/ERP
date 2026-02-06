'use client';

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "@/contexts/CurrencyContext";
import { tenantContextService } from '@/services/tenant/tenantContextService';
import { authService } from '@/services/auth/authService';

interface DiscountFormData {
  name: string;
  usages: string;
  start_date: string;
  end_date: string;
  value: string;
  value_in_percentage: string;
  classification: string;
}

interface DiscountFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isEdit?: boolean;
  formData: DiscountFormData;
  discountType: string;
  setDiscountType: (type: "fixed" | "percentage") => void;
  onInputChange: (field: string, value: string) => void;
  errors: Record<string, string>;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function DiscountFormModal({
  isOpen,
  onOpenChange,
  isEdit = false,
  formData,
  discountType,
  setDiscountType,
  onInputChange,
  errors,
  isLoading,
  onSubmit,
}: DiscountFormModalProps) {
  const { defaultCurrency } = useCurrency();
  const [currentBranch, setCurrentBranch] = useState<{ id: number; name: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Get stored user and branch context
  useEffect(() => {
    // Get stored user data
    const cachedUser = authService.getCachedUserData();
    if (cachedUser) {
      setCurrentUser(cachedUser);
    }

    // Get stored branch context
    const storedBranch = tenantContextService.getStoredBranchContext();
    if (storedBranch) {
      setCurrentBranch(storedBranch);
    }
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Discount" : "Add New Discount"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update discount details below."
              : "Enter discount details below. All fields are required."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={isEdit ? "edit-name" : "name"}>Discount Name <span className="text-red-500">*</span></Label>
              <Input
                id={isEdit ? "edit-name" : "name"}
                type="text"
                disabled={isLoading}
                value={formData.name}
                onChange={(e) => onInputChange("name", e.target.value)}
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor={isEdit ? "edit-usages" : "usages"}>Usages <span className="text-red-500">*</span></Label>
              <Input
                id={isEdit ? "edit-usages" : "usages"}
                type="number"
                min="1"
                disabled={isLoading}
                value={formData.usages}
                onChange={(e) => {
                  const value = e.target.value;
                  // allow empty input
                  if (value === "") return onInputChange("usages", "");
                  // limit to 20 digits (ignore non-digits)
                  if (value.replace(/\D/g, "").length > 20) return;
                  // prevent values less than 1
                  const num = parseInt(value);
                  if (!isNaN(num) && num < 1) return;
                  onInputChange("usages", value);
                }}
              />
              {errors.usages && <p className="text-red-500 text-sm">{errors.usages}</p>}
            </div>
          </div>

          {/* Branch - ReadOnly */}
          <div className="space-y-2">
            <Label>Branch</Label>
            <Input
              value={currentBranch?.name || 'Branch information not available'}
              disabled={true}
              className="bg-muted"
              placeholder="Branch information"
            />
          </div>

          {/* Classification */}
          <div className="space-y-2">
            <Label htmlFor="classification">Classification <span className="text-red-500">*</span></Label>
            <Select
              value={formData.classification}
              onValueChange={(value) => onInputChange("classification", value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select classification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Default">Default</SelectItem>
                <SelectItem value="Promo">Promo</SelectItem>
                <SelectItem value="Voucher">Voucher</SelectItem>
              </SelectContent>
            </Select>
            {errors.classification && <p className="text-red-500 text-sm">{errors.classification}</p>}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={isEdit ? "edit-start_date" : "start_date"}>Start Date <span className="text-red-500">*</span></Label>
              <Input
                id={isEdit ? "edit-start_date" : "start_date"}
                type="date"
                disabled={isLoading}
                value={formData.start_date}
                onChange={(e) => onInputChange("start_date", e.target.value)}
              />
              {errors.start_date && <p className="text-red-500 text-sm">{errors.start_date}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor={isEdit ? "edit-end_date" : "end_date"}>End Date <span className="text-red-500">*</span></Label>
              <Input
                id={isEdit ? "edit-end_date" : "end_date"}
                type="date"
                disabled={isLoading}
                value={formData.end_date}
                onChange={(e) => onInputChange("end_date", e.target.value)}
              />
              {errors.end_date && <p className="text-red-500 text-sm">{errors.end_date}</p>}
            </div>
          </div>

          {/* Select Discount Type */}
          <div className="space-y-2">
            <Label>Select Discount Type <span className="text-red-500">*</span></Label>
            <RadioGroup
              value={discountType}
              onValueChange={(value: "fixed" | "percentage") => {
                setDiscountType(value);
                // Clear both fields when switching types to ensure clean state
                onInputChange("value", "");
                onInputChange("value_in_percentage", "");
              }}
              className="flex gap-4 mt-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixed" id="fixed" />
                <Label
                  htmlFor="fixed"
                  className="text-muted-foreground"
                >
                  Fixed Value ({defaultCurrency?.symbol || '₱'})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label
                  htmlFor="percentage"
                  className="text-muted-foreground"
                >
                  Percentage (%)
                </Label>
              </div>
            </RadioGroup>
          </div>
          {/* Value Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={isEdit ? "edit-value" : "value"}>Fixed Value ({defaultCurrency?.symbol || '₱'})</Label>
              <Input
                id={isEdit ? "edit-value" : "value"}
                type="number"
                step="0.01"
                min="0"
                disabled={isLoading || discountType !== "fixed"}
                value={discountType === "fixed" ? formData.value : ""}
                onChange={(e) => {
                  let value = e.target.value;
                  // allow empty input
                  if (value === "") return onInputChange("value", "");
                  // only allow up to 20 digits before the decimal
                  if (value.replace(/\D/g, "").length > 20) return;
                  onInputChange("value", value);
                }}
              />
              {errors.value && <p className="text-red-500 text-sm">{errors.value}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor={isEdit ? "edit-value_in_percentage" : "value_in_percentage"}>Percentage (%)</Label>
              <Input
                id={isEdit ? "edit-value_in_percentage" : "value_in_percentage"}
                type="number"
                step="0.01"
                min="0"
                max="100"
                disabled={isLoading || discountType !== "percentage"}
                value={discountType === "percentage" ? formData.value_in_percentage : ""}
                onChange={(e) => {
                  let value = e.target.value;
                  if (value === "") return onInputChange("value_in_percentage", "");
                  const num = parseFloat(value);
                  if (!isNaN(num)) {
                    const clamped = Math.min(Math.max(num, 1), 100);
                    onInputChange("value_in_percentage", clamped.toString());
                  }
                }}
              />
              {errors.value_in_percentage && <p className="text-red-500 text-sm">{errors.value_in_percentage}</p>}
            </div>
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
                ? "Update Discount"
                : "Create Discount"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
