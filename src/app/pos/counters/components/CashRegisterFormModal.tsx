'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormError } from "@/components/ui/form-error";
import { tenantContextService } from '@/services/tenant/tenantContextService';
import { api } from '@/services/api';
import { API_ENDPOINTS } from '@/config/api.config';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, EyeOff } from 'lucide-react';

interface CashRegisterFormData {
  name: string;
  code: string;
  assigned_user_id: number | null;
  is_active: boolean;
}

interface CashRegisterFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isEdit?: boolean;
  formData: CashRegisterFormData;
  onInputChange: (field: string, value: string | number | boolean | null) => void;
  errors: Record<string, string>;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  currentCashRegisterId?: number | null;
  existingCashRegisters?: Array<{ id: number; assigned_user_id: number | null }>;
}

interface User {
  id: number;
  email: string;
  user_info?: {
    first_name: string;
    last_name: string;
  };
}

export function CashRegisterFormModal({
  isOpen,
  onOpenChange,
  isEdit = false,
  formData,
  onInputChange,
  errors,
  isLoading,
  onSubmit,
  currentCashRegisterId,
  existingCashRegisters = [],
}: CashRegisterFormModalProps) {
  const selectedBranch = tenantContextService.getStoredBranchContext();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setShowCode(false); // Reset code visibility when modal opens
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      // Fetch users from management API
      const response = await api(`${API_ENDPOINTS.USERS.BASE}?per_page=200`);
      const fetchedUsers = response.users || [];
      setUsers(fetchedUsers);
    } catch (error) {
      // console.error('Failed to fetch users:', error);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const getUserDisplayName = (user: User) => {
    if (user.user_info) {
      const name = `${user.user_info.first_name} ${user.user_info.last_name}`.trim();
      return name || user.email;
    }
    return user.email;
  };

  // Filter out users who are already assigned to other cash registers
  // But allow the currently assigned user if editing
  const availableUsers = users.filter((user) => {
    const assignedToRegister = existingCashRegisters.find(
      (cr) => cr.assigned_user_id === user.id && cr.id !== currentCashRegisterId
    );
    return !assignedToRegister;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Cash Register" : "Add New Cash Register"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update cash register details below."
              : "Enter cash register details below. Name is required."}
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
            <Label htmlFor="name">Cash Register Name <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              type="text"
              disabled={isLoading}
              value={formData.name}
              onChange={(e) => onInputChange("name", e.target.value)}
              placeholder="e.g., Counter 1, Register A"
            />
            <FormError message={errors.name} />
          </div>

          {/* Code */}
          <div className="space-y-2">
            <Label htmlFor="code">Code <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Input
                id="code"
                type={showCode ? "text" : "password"}
                disabled={isLoading}
                value={formData.code}
                onChange={(e) => onInputChange("code", e.target.value)}
                placeholder="Enter a secure code"
                maxLength={50}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showCode ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <FormError message={errors.code} />
          </div>

          {/* Cashier */}
          <div className="space-y-2">
            <Label htmlFor="assigned_user_id">  Cashier <span className="text-red-500">*</span></Label>
            {loadingUsers ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={formData.assigned_user_id?.toString() || "unassigned"}
                onValueChange={(value) => onInputChange("assigned_user_id", value === "unassigned" ? null : parseInt(value))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={availableUsers.length > 0 ? "Unassigned" : "No user found"} />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.length > 0 ? (
                    <>
                       <SelectItem value="unassigned">Select a user</SelectItem>
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {getUserDisplayName(user)}
                        </SelectItem>
                      ))}
                    </>
                  ) : (
                    <SelectItem value="unassigned">No user found</SelectItem>
                  )}  
                </SelectContent>
              </Select>
            )}
            <FormError message={errors.assigned_user_id} />
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => onInputChange("is_active", checked)}
              disabled={isLoading}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <FormError message={errors.general} />

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
                ? "Update"
                : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
