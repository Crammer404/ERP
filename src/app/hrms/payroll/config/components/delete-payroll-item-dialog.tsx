'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DeleteTarget {
  code: string;
  label: string;
  group: string;
}

interface DeletePayrollItemDialogProps {
  target: DeleteTarget | null;
  ratesSaving: boolean;
  onCancel: () => void;
  onConfirm: (code: string, group: string) => void;
}

export function DeletePayrollItemDialog({
  target,
  ratesSaving,
  onCancel,
  onConfirm,
}: DeletePayrollItemDialogProps) {
  return (
    <Dialog
      open={Boolean(target)}
      onOpenChange={(open) => {
        if (!open && !ratesSaving) onCancel();
      }}
    >
      <DialogContent
        className="sm:max-w-md border-red-500 dark:border-red-700 [&>button]:hidden"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Delete Payroll Item</DialogTitle>
          <DialogDescription>
            {`Are you sure you want to delete "${target?.label || target?.code || 'this item'}"? This action cannot be undone.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={ratesSaving}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              if (target) onConfirm(target.code, target.group);
            }}
            disabled={ratesSaving}
          >
            {ratesSaving ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
