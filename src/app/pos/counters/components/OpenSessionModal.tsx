'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CashRegister } from '../service/cashRegisterService';
import { useAuth } from '@/components/providers/auth-provider';

interface OpenSessionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  cashRegister: CashRegister;
  onSubmit: (payload: {
    cash_register_id: number;
    opening_balance: number;
    override_code?: string;
    override_reason?: string;
  }) => Promise<void>;
  isLoading: boolean;
  isManager: boolean;
}

export function OpenSessionModal({
  isOpen,
  onOpenChange,
  cashRegister,
  onSubmit,
  isLoading,
  isManager,
}: OpenSessionModalProps) {
  const { user } = useAuth();
  const [openingBalance, setOpeningBalance] = useState('');
  const [overrideCode, setOverrideCode] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isAssignedToCurrentUser = cashRegister.assigned_user_id === user?.id;
  const needsOverride = !isAssignedToCurrentUser && isManager;

  useEffect(() => {
    if (isOpen) {
      setOpeningBalance('');
      setOverrideCode('');
      setOverrideReason('');
      setErrors({});
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    if (!openingBalance || parseFloat(openingBalance) < 0) {
      setErrors({ opening_balance: 'Opening balance must be a positive number.' });
      return;
    }

    if (needsOverride && !overrideCode.trim()) {
      setErrors({ override_code: 'Override code is required to open a cash register assigned to another user.' });
      return;
    }

    if (needsOverride && overrideCode.length < 4) {
      setErrors({ override_code: 'Override code must be at least 4 characters.' });
      return;
    }

    try {
      await onSubmit({
        cash_register_id: cashRegister.id,
        opening_balance: parseFloat(openingBalance),
        override_code: needsOverride ? overrideCode : undefined,
        override_reason: needsOverride ? overrideReason : undefined,
      });
      // Reset form on success
      setOpeningBalance('');
      setOverrideCode('');
      setOverrideReason('');
    } catch (error) {
      // Error is handled by parent
    }
  };

  const handleCancel = () => {
    setOpeningBalance('');
    setOverrideCode('');
    setOverrideReason('');
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Open Cash Register Session</DialogTitle>
          <DialogDescription>
            Open a new session for {cashRegister.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Opening Balance */}
          <div className="space-y-2">
            <Label htmlFor="opening_balance">
              Opening Balance <span className="text-red-500">*</span>
            </Label>
            <Input
              id="opening_balance"
              type="number"
              step="0.01"
              min="0"
              value={openingBalance}
              onChange={(e) => {
                setOpeningBalance(e.target.value);
                if (errors.opening_balance) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.opening_balance;
                    return newErrors;
                  });
                }
              }}
              disabled={isLoading}
              placeholder="0.00"
            />
            {errors.opening_balance && (
              <p className="text-red-500 text-sm">{errors.opening_balance}</p>
            )}
          </div>

          {/* Override fields (only shown if needed) */}
          {needsOverride && (
            <>
              <div className="space-y-2">
                <Label htmlFor="override_code">
                  Override Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="override_code"
                  type="password"
                  value={overrideCode}
                  onChange={(e) => {
                    setOverrideCode(e.target.value);
                    if (errors.override_code) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.override_code;
                        return newErrors;
                      });
                    }
                  }}
                  disabled={isLoading}
                  placeholder="Enter override code"
                />
                <p className="text-xs text-muted-foreground">
                  Override code required to open a cash register assigned to another user.
                </p>
                {errors.override_code && (
                  <p className="text-red-500 text-sm">{errors.override_code}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="override_reason">Override Reason (Optional)</Label>
                <Textarea
                  id="override_reason"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  disabled={isLoading}
                  placeholder="Reason for override"
                  rows={3}
                />
              </div>
            </>
          )}

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
              {isLoading ? 'Opening...' : 'Open Session'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
