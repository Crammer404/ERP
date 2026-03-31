import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface DeleteColaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving: boolean;
  employeeLabel: string;
  onConfirm: () => Promise<void> | void;
}

export function DeleteColaModal({ open, onOpenChange, saving, employeeLabel, onConfirm }: DeleteColaModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => (saving ? undefined : onOpenChange(next))}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete COLA</DialogTitle>
          <DialogDescription>
            This will remove COLA for {employeeLabel}. You can add it again later.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={saving}
            size="sm"
            className="h-8 px-3 text-xs"
            variant="destructive"
          >
            {saving ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

