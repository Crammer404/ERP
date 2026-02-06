'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { CashRegister, CashRegisterSession } from '../service/cashRegisterService';

interface CloseSessionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  cashRegister: CashRegister;
  session: CashRegisterSession | null;
  onSubmit: (payload: {
    counted_closing_balance: number;
    notes?: string;
  }) => Promise<void>;
  isLoading: boolean;
}

export function CloseSessionModal({
  isOpen,
  onOpenChange,
  cashRegister,
  session,
  onSubmit,
  isLoading,
}: CloseSessionModalProps) {
  const [countedClosingBalance, setCountedClosingBalance] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate expected closing balance from session
  const expectedClosingBalance = useMemo(() => {
    if (!session) return 0;
    // This should ideally come from backend calculation
    // For now, we'll display what we have
    return session.expected_closing_balance || 0;
  }, [session]);

  useEffect(() => {
    if (isOpen && session) {
      // Pre-fill with expected balance as a starting point
      setCountedClosingBalance(expectedClosingBalance.toString());
      setNotes('');
      setErrors({});
    }
  }, [isOpen, session, expectedClosingBalance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!countedClosingBalance || parseFloat(countedClosingBalance) < 0) {
      setErrors({ counted_closing_balance: 'Counted closing balance must be a positive number.' });
      return;
    }

    try {
      await onSubmit({
        counted_closing_balance: parseFloat(countedClosingBalance),
        notes: notes.trim() || undefined,
      });
      // Reset form on success
      setCountedClosingBalance('');
      setNotes('');
    } catch (error) {
      // Error is handled by parent
    }
  };

  const handleCancel = () => {
    setCountedClosingBalance('');
    setNotes('');
    setErrors({});
    onOpenChange(false);
  };

  if (!session) {
    return null;
  }

  const variance = parseFloat(countedClosingBalance || '0') - expectedClosingBalance;
  const hasVariance = Math.abs(variance) > 0.01;

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Close Cash Register Session</DialogTitle>
          <DialogDescription>
            Close the session for {cashRegister.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Session Info */}
          <div className="bg-muted p-3 rounded-md space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Opening Balance:</span>
              <span className="font-medium">${(Number(session.opening_balance) || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Expected Closing Balance:</span>
              <span className="font-medium">${(Number(expectedClosingBalance) || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Opened At:</span>
              <span className="font-medium">
                {new Date(session.opened_at).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Counted Closing Balance */}
          <div className="space-y-2">
            <Label htmlFor="counted_closing_balance">
              Counted Closing Balance <span className="text-red-500">*</span>
            </Label>
            <Input
              id="counted_closing_balance"
              type="number"
              step="0.01"
              min="0"
              value={countedClosingBalance}
              onChange={(e) => {
                setCountedClosingBalance(e.target.value);
                if (errors.counted_closing_balance) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.counted_closing_balance;
                    return newErrors;
                  });
                }
              }}
              disabled={isLoading}
              placeholder="0.00"
            />
            {errors.counted_closing_balance && (
              <p className="text-red-500 text-sm">{errors.counted_closing_balance}</p>
            )}
          </div>

          {/* Variance Display (calculated) */}
          {countedClosingBalance && !isNaN(parseFloat(countedClosingBalance)) && (
            <div className="space-y-2">
              <Label>Variance</Label>
              <div className={`p-3 rounded-md border ${
                hasVariance
                  ? variance > 0
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                  : 'bg-muted border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {hasVariance
                      ? variance > 0
                        ? 'Over'
                        : 'Short'
                      : 'Perfect'}
                  </span>
                  <Badge variant={hasVariance ? (variance > 0 ? 'default' : 'destructive') : 'secondary'}>
                    ${Math.abs(variance).toFixed(2)}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
              placeholder="Add any notes about the closing"
              rows={3}
            />
          </div>

          {errors.general && (
            <p className="text-red-500 text-sm">{errors.general}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Closing...' : 'Close Session'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
