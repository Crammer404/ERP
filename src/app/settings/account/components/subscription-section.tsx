'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import type { AccountOverview } from '../services/account-management-service';

interface SubscriptionSectionProps {
  overview: AccountOverview | null;
  statusVariant: 'default' | 'secondary' | 'destructive' | 'outline';
  submitting: boolean;
  onPlanChange: (planId: number) => void;
}

export function SubscriptionSection({ overview, statusVariant, submitting, onPlanChange }: SubscriptionSectionProps) {
  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Subscription Management</CardTitle>
        <CardDescription>Review your current plan and update it when needed.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Badge variant={statusVariant}>{overview?.subscription?.status || 'none'}</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Current Plan</Label>
            <Input value={overview?.subscription?.plan?.name || 'No active plan'} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Billing Cycle</Label>
            <Input value={overview?.subscription?.billing_cycle || '-'} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input value={overview?.subscription?.amount || '0'} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Next Billing Date</Label>
            <Input value={overview?.subscription?.next_billing_date || '-'} readOnly />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Features</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {(overview?.subscription?.plan?.features || []).map((feature) => (
              <div key={feature.slug} className="text-sm border rounded-md p-2">
                <div className="font-medium">{feature.name}</div>
                <div className="text-muted-foreground">{feature.description}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Change Plan</Label>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onPlanChange(1)} disabled={submitting}>Starter</Button>
            <Button variant="outline" onClick={() => onPlanChange(2)} disabled={submitting}>Plus</Button>
            <Button variant="outline" onClick={() => onPlanChange(3)} disabled={submitting}>Professional</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
