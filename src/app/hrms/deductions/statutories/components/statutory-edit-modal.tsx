import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { StatutoryEntry, StatutoryType } from '../services/statutories-service';

export type StatutoryEditModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: StatutoryType;
  entry: StatutoryEntry | null;
  employeeName: string;
  onSave: (payload: { user_id: number; amount: number; is_rate: 0 | 1 }) => Promise<void> | void;
};

export function StatutoryEditModal({ open, onOpenChange, type, entry, employeeName, onSave }: StatutoryEditModalProps) {
  const [saving, setSaving] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [isRate, setIsRate] = useState<boolean>(false);

  const formatInitialAmount = (value: unknown, rate: boolean): string => {
    const num = typeof value === 'string' ? Number(value) : (value as number);
    if (!Number.isFinite(num)) return '';
    const display = rate ? Number(num) * 100 : Number(num);
    return display.toFixed(2);
  };

  useEffect(() => {
    if (!open || !entry) return;
    const rate = Boolean(entry.is_rate);
    setIsRate(rate);
    setAmount(formatInitialAmount(entry.amount, rate));
    setSaving(false);
  }, [open, entry]);

  const modeLabel = useMemo(() => (type === 'sss' ? 'SSS' : type === 'philhealth' ? 'PhilHealth' : 'Pag-IBIG'), [type]);

  const canSave = Boolean(entry) && !saving;

  const handleSave = async () => {
    if (!entry || !canSave) return;
    setSaving(true);
    try {
      const raw = amount.trim();
      const parsed = raw === '' ? 0 : Number(raw);
      const nextAmount = Number.isFinite(parsed) ? parsed : 0;
      const persistedAmount = isRate ? nextAmount / 100 : nextAmount;
      await onSave({ user_id: entry.user_id, amount: persistedAmount, is_rate: isRate ? 1 : 0 });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit {modeLabel}</DialogTitle>
          <DialogDescription>Update amount and mode for <span className="font-medium">{employeeName || 'employee'}</span>.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="statutory-amount">Amount</Label>
            <Input
              id="statutory-amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(ev) => setAmount(ev.target.value)}
              disabled={saving || !entry}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Mode</div>
              <div className="text-xs text-muted-foreground">{isRate ? 'Rate (percent)' : 'Fixed (currency amount)'}</div>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">{isRate ? 'Rate' : 'Fixed'}</Label>
              <Switch checked={isRate} onCheckedChange={setIsRate} disabled={saving || !entry} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

