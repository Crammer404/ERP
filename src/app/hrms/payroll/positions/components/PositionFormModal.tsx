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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { PayrollPosition, CreatePositionRequest, UpdatePositionRequest } from '../services/position-service';

interface PositionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  branches: { id: number; name: string }[];
  users: { id: number; email: string; user_info?: { first_name?: string; last_name?: string } }[];
  allowances: { id: number; label: string; value: string }[];
  initialData?: PayrollPosition;
  onSubmit: (data: CreatePositionRequest | UpdatePositionRequest) => Promise<void> | void;
  loading: boolean;
  errors: Record<string, string>;
  onClearError: (field: string) => void;
}

const getUserDisplayName = (user: { id: number; email: string; user_info?: { first_name?: string; last_name?: string } }) => {
  if (user.user_info?.first_name || user.user_info?.last_name) {
    return [user.user_info.first_name, user.user_info.last_name].filter(Boolean).join(' ');
  }
  return user.email;
};

export function PositionFormModal({
  isOpen,
  onClose,
  mode,
  branches,
  users,
  allowances,
  initialData,
  onSubmit,
  loading,
  errors,
  onClearError,
}: PositionFormModalProps) {
  const [formData, setFormData] = useState<CreatePositionRequest>({
    branch_id: 0,
    user_id: 0,
    name: '',
    base_salary: 0,
    allowance_id: null,
    is_active: true,
  });

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        branch_id: initialData.branch_id,
        user_id: initialData.user_id,
        name: initialData.name,
        base_salary: initialData.base_salary,
        allowance_id: initialData.allowance_id,
        is_active: initialData.is_active,
      });
    } else {
      setFormData({
        branch_id: 0,
        user_id: 0,
        name: '',
        base_salary: 0,
        allowance_id: null,
        is_active: true,
      });
    }
  }, [mode, initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof CreatePositionRequest, value: any) => {
    onClearError(field);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create Position' : 'Edit Position'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Add a new payroll position for an employee.'
              : 'Update the position details below.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Branch *</Label>
                <Select
                  value={formData.branch_id.toString()}
                  onValueChange={(value) => handleChange('branch_id', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id.toString()}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.branch_id && (
                  <p className="text-sm text-destructive">{errors.branch_id}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>User *</Label>
                <Select
                  value={formData.user_id.toString()}
                  onValueChange={(value) => handleChange('user_id', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {getUserDisplayName(user)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.user_id && (
                  <p className="text-sm text-destructive">{errors.user_id}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Position name"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Base Salary *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.base_salary}
                  onChange={(e) => handleChange('base_salary', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
                {errors.base_salary && (
                  <p className="text-sm text-destructive">{errors.base_salary}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Allowance</Label>
                <Select
                  value={formData.allowance_id?.toString() || ''}
                  onValueChange={(value) => handleChange('allowance_id', value ? parseInt(value) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select allowance (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {allowances.map((allowance) => (
                      <SelectItem key={allowance.id} value={allowance.id.toString()}>
                        {allowance.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.is_active ? 'active' : 'inactive'}
                onValueChange={(value) => handleChange('is_active', value === 'active')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {errors.general && (
              <p className="text-sm text-destructive">{errors.general}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Create' : 'Update'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
