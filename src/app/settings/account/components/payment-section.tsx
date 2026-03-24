'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Dispatch, SetStateAction } from 'react';
import type { AccountOverview, AccountPaymentMethod } from '../services/account-management-service';

interface PaymentFormState {
  type: string;
  provider: string;
  token: string;
  last4: string;
  brand: string;
  exp_month: string;
  exp_year: string;
  holder_name: string;
  is_default: boolean;
}

interface PaymentSectionProps {
  overview: AccountOverview | null;
  paymentForm: PaymentFormState;
  setPaymentForm: Dispatch<SetStateAction<PaymentFormState>>;
  editingPaymentId: number | null;
  submitting: boolean;
  onSavePaymentMethod: () => void;
  onResetPaymentForm: () => void;
  onEditPaymentMethod: (method: AccountPaymentMethod) => void;
  onSetDefaultPaymentMethod: (id: number) => void;
  onDeletePaymentMethod: (id: number) => void;
}

export function PaymentSection({
  overview,
  paymentForm,
  setPaymentForm,
  editingPaymentId,
  submitting,
  onSavePaymentMethod,
  onResetPaymentForm,
  onEditPaymentMethod,
  onSetDefaultPaymentMethod,
  onDeletePaymentMethod,
}: PaymentSectionProps) {
  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
        <CardDescription>Add, update, remove, and set default payment methods.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={paymentForm.type} onValueChange={(value) => setPaymentForm((prev) => ({ ...prev, type: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="debit_card">Debit Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="gcash">GCash</SelectItem>
                <SelectItem value="paymaya">PayMaya</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Provider</Label>
            <Input value={paymentForm.provider} onChange={(e) => setPaymentForm((prev) => ({ ...prev, provider: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Token</Label>
            <Input value={paymentForm.token} onChange={(e) => setPaymentForm((prev) => ({ ...prev, token: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Last 4</Label>
            <Input value={paymentForm.last4} maxLength={4} onChange={(e) => setPaymentForm((prev) => ({ ...prev, last4: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Brand</Label>
            <Input value={paymentForm.brand} onChange={(e) => setPaymentForm((prev) => ({ ...prev, brand: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Exp Month</Label>
            <Input value={paymentForm.exp_month} onChange={(e) => setPaymentForm((prev) => ({ ...prev, exp_month: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Exp Year</Label>
            <Input value={paymentForm.exp_year} onChange={(e) => setPaymentForm((prev) => ({ ...prev, exp_year: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Holder Name</Label>
            <Input value={paymentForm.holder_name} onChange={(e) => setPaymentForm((prev) => ({ ...prev, holder_name: e.target.value }))} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={paymentForm.is_default} onCheckedChange={(checked) => setPaymentForm((prev) => ({ ...prev, is_default: checked }))} />
          <span className="text-sm">Set as default</span>
        </div>
        <div className="flex gap-2">
          <Button onClick={onSavePaymentMethod} disabled={submitting}>{editingPaymentId ? 'Update Payment Method' : 'Add Payment Method'}</Button>
          {editingPaymentId && <Button variant="outline" onClick={onResetPaymentForm} disabled={submitting}>Cancel Edit</Button>}
        </div>
        <div className="space-y-2">
          {(overview?.payment_methods || []).map((method) => (
            <div key={method.id} className="border rounded-md p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <div className="font-medium">{method.type} {method.brand ? `(${method.brand})` : ''}</div>
                <div className="text-sm text-muted-foreground">
                  {method.provider || '-'} {method.last4 ? `• ****${method.last4}` : ''}
                </div>
              </div>
              <div className="flex gap-2">
                {method.is_default ? <Badge>Default</Badge> : <Button size="sm" variant="outline" onClick={() => onSetDefaultPaymentMethod(method.id)} disabled={submitting}>Set Default</Button>}
                <Button size="sm" variant="outline" onClick={() => onEditPaymentMethod(method)} disabled={submitting}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => onDeletePaymentMethod(method.id)} disabled={submitting}>Remove</Button>
              </div>
            </div>
          ))}
          {overview?.payment_methods?.length === 0 && (
            <div className="text-sm text-muted-foreground">No payment methods found.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
