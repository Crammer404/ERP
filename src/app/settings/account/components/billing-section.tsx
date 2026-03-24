'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AccountOverview } from '../services/account-management-service';

interface BillingSectionProps {
  overview: AccountOverview | null;
}

export function BillingSection({ overview }: BillingSectionProps) {
  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Billing History</CardTitle>
        <CardDescription>Recent payment transactions for your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {(overview?.billing_history || []).map((item) => (
            <div key={item.id} className="border rounded-md p-3 grid grid-cols-1 md:grid-cols-5 gap-2 text-sm">
              <div>
                <div className="text-muted-foreground">Reference</div>
                <div className="font-medium">{item.reference_number}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Amount</div>
                <div className="font-medium">{item.currency} {item.amount}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Status</div>
                <Badge variant={item.status === 'completed' ? 'default' : 'secondary'}>{item.status}</Badge>
              </div>
              <div>
                <div className="text-muted-foreground">Date</div>
                <div className="font-medium">{item.paid_at || item.created_at}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Payment Method</div>
                <div className="font-medium">{item.payment_method || '-'}</div>
              </div>
            </div>
          ))}
          {overview?.billing_history?.length === 0 && (
            <div className="text-sm text-muted-foreground">No billing records found.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
