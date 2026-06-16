'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEffect, useState } from 'react';
import {
  INACTIVE_EMPLOYMENT_STATUS_OPTIONS,
  type InactiveUserEmploymentStatus,
} from '../utils/employment-status';

interface DisableUserStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  loading?: boolean;
  error?: string;
  onConfirm: (status: InactiveUserEmploymentStatus) => void;
}

export function DisableUserStatusModal({
  open,
  onOpenChange,
  userName,
  loading = false,
  error,
  onConfirm,
}: DisableUserStatusModalProps) {
  const [status, setStatus] = useState<InactiveUserEmploymentStatus | ''>('');

  useEffect(() => {
    if (open) {
      setStatus('');
    }
  }, [open]);

  const handleConfirm = () => {
    if (!status) return;
    onConfirm(status);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set employee status</DialogTitle>
          <DialogDescription>
            Select a status for &quot;{userName}&quot;. The account will be disabled and API access revoked.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="employment-status">Employment status</Label>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as InactiveUserEmploymentStatus)}
            disabled={loading}
          >
            <SelectTrigger id="employment-status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {INACTIVE_EMPLOYMENT_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading || !status}
          >
            {loading ? 'Disabling...' : 'Disable account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
