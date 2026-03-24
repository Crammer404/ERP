'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AddGroupDialogProps {
  open: boolean;
  tempGroupName: string;
  tempGroupError: string;
  ratesSaving: boolean;
  onTempGroupNameChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function AddGroupDialog({
  open,
  tempGroupName,
  tempGroupError,
  ratesSaving,
  onTempGroupNameChange,
  onSubmit,
  onCancel,
}: AddGroupDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onCancel() : undefined)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Item Group</DialogTitle>
          <DialogDescription>
            Enter a new group name. It will be selected immediately after adding.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Group Name</Label>
          <Input
            value={tempGroupName}
            onChange={(e) => onTempGroupNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSubmit();
              }
            }}
            placeholder="e.g. Employer Contributions"
          />
          {tempGroupError && <p className="text-xs text-destructive">{tempGroupError}</p>}
        </div>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={onSubmit} disabled={ratesSaving}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
