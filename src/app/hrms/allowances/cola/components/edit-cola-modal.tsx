import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface EditColaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving: boolean;
  employeeLabel: string;
  amount: string;
  onAmountChange: (value: string) => void;
  onSave: () => Promise<void> | void;
}

export function EditColaModal({
  open,
  onOpenChange,
  saving,
  employeeLabel,
  amount,
  onAmountChange,
  onSave,
}: EditColaModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => (saving ? undefined : onOpenChange(next))}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit COLA</DialogTitle>
          <DialogDescription>Update COLA amount for {employeeLabel}.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label>Amount</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            disabled={saving}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving} size="sm" className="h-8 px-3 text-xs">
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

