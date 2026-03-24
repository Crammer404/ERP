'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import type { EditRateDraft, NewRateDraft, RateCategory, RateFormErrors } from './types';

interface PayrollItemFormDialogProps {
  open: boolean;
  editRate: EditRateDraft | null;
  newRate: NewRateDraft;
  rateGroupOptions: string[];
  formatGroupLabel: (groupKey: string) => string;
  rateFormErrors: RateFormErrors;
  ratesSaving: boolean;
  onOpenAddGroup: () => void;
  onCancel: () => void;
  onSubmit: () => void;
  onLabelChange: (value: string) => void;
  onGroupChange: (value: string) => void;
  onCategoryChange: (value: RateCategory) => void;
  onTypeChange: (value: 0 | 1) => void;
  onValueChange: (value: string) => void;
  clearRateFormError: (...fields: Array<keyof RateFormErrors>) => void;
}

export function PayrollItemFormDialog({
  open,
  editRate,
  newRate,
  rateGroupOptions,
  formatGroupLabel,
  rateFormErrors,
  ratesSaving,
  onOpenAddGroup,
  onCancel,
  onSubmit,
  onLabelChange,
  onGroupChange,
  onCategoryChange,
  onTypeChange,
  onValueChange,
  clearRateFormError,
}: PayrollItemFormDialogProps) {
  const activeLabel = editRate ? editRate.label : newRate.label;
  const activeGroup = editRate ? editRate.group || rateGroupOptions[0] || 'work_rate' : newRate.group || rateGroupOptions[0] || 'work_rate';
  const activeCategory: RateCategory = (editRate ? editRate.category : newRate.category) || 'earnings';
  const activeType = editRate ? editRate.is_rate : newRate.is_rate;
  const activeValue = editRate ? editRate.value : newRate.value;

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onCancel() : undefined)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editRate ? 'Edit Payroll Item' : 'Add Payroll Item'}</DialogTitle>
          <DialogDescription>
            {editRate
              ? 'Update the item details, category, group, type, and value. Changes are saved when you click Save.'
              : 'Add a new payroll item. If Type is Fixed, it is treated as a constant amount.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label>Item Name</Label>
              <Input
                value={activeLabel}
                onChange={(e) => onLabelChange(e.target.value)}
                onInput={() => clearRateFormError('label', 'code')}
                placeholder="e.g. Company Contribution"
              />
              {(rateFormErrors.label || rateFormErrors.code) && (
                <p className="text-xs text-destructive">{rateFormErrors.label || rateFormErrors.code}</p>
              )}
              {editRate && (
                <p className="text-xs text-muted-foreground">
                  Code: <span className="font-mono">{editRate.code}</span>
                </p>
              )}
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={activeCategory}
                onValueChange={(v) => {
                  onCategoryChange((v === 'deductions' ? 'deductions' : 'earnings') as RateCategory);
                  clearRateFormError('category');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="earnings">Earnings</SelectItem>
                  <SelectItem value="deductions">Deductions</SelectItem>
                </SelectContent>
              </Select>
              {rateFormErrors.category && (
                <p className="text-xs text-destructive">{rateFormErrors.category}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Item Group</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Select
                    value={activeGroup}
                    onValueChange={(v) => {
                      onGroupChange(v);
                      clearRateFormError('group');
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      {rateGroupOptions.map((groupKey) => (
                        <SelectItem key={groupKey} value={groupKey}>
                          {formatGroupLabel(groupKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  onClick={onOpenAddGroup}
                  disabled={ratesSaving}
                  aria-label="Add item group"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {rateFormErrors.group && <p className="text-xs text-destructive">{rateFormErrors.group}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Variable Type</Label>
              <Select
                value={String(activeType)}
                onValueChange={(v) => {
                  onTypeChange((v === '1' ? 1 : 0) as 0 | 1);
                  clearRateFormError('is_rate');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Rate</SelectItem>
                  <SelectItem value="0">Fixed</SelectItem>
                </SelectContent>
              </Select>
              {rateFormErrors.is_rate && <p className="text-xs text-destructive">{rateFormErrors.is_rate}</p>}
            </div>

            <div className="space-y-2">
              <Label>Value</Label>
              <Input
                type="number"
                step="0.0001"
                value={activeValue}
                onChange={(e) => onValueChange(e.target.value)}
                onInput={() => clearRateFormError('value')}
              />
              {rateFormErrors.value && <p className="text-xs text-destructive">{rateFormErrors.value}</p>}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={onSubmit} disabled={ratesSaving}>
            {ratesSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
