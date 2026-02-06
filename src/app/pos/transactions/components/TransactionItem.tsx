import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, ChevronDown } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import type { BackendTransaction } from '@/lib/types';
import { TransactionDetails } from './TransactionDetails';
import { useCurrency } from '@/contexts/CurrencyContext';
import { StatusDot } from '@/components/ui/data-table';

interface TransactionItemProps {
  transaction: BackendTransaction;
  customerId?: string;
}

export function TransactionItem({ transaction, customerId }: TransactionItemProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { defaultCurrency } = useCurrency();

  const handleViewReceipt = (transaction: BackendTransaction) => {
    sessionStorage.setItem('viewReceiptTransactionId', transaction.id.toString());
    if (customerId && pathname.includes('/customers/purchases')) {
      sessionStorage.setItem('receiptSource', 'purchases');
      sessionStorage.setItem('customerId', customerId);
    } else if (pathname.includes('/pos/transactions')) {
      sessionStorage.setItem('receiptSource', 'transactions');
    } else {
      sessionStorage.setItem('receiptSource', 'other');
    }
    router.push('/order-success');
  };

  // Status color mapping
  const getStatusType = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <AccordionItem
      key={transaction.id}
      value={String(transaction.id)}
      className="mx-4 my-2 first:mt-4 last:mb-4 border border-border/60 rounded-md bg-card 
        data-[state=open]:bg-muted/20 data-[state=open]:border-border transition-all duration-150">
      <AccordionTrigger className="hover:no-underline cursor-pointer px-4 py-3 rounded-md transition-colors duration-150
        hover:bg-muted/40 [&>svg]:hidden">
          <div className="grid gap-4 w-full text-sm font-normal items-center text-center min-w-[868px]"
            style={{ gridTemplateColumns: 'auto 1fr 1fr 1fr 1fr 1fr 1fr 1fr auto' }}>
              {/* Chevron indicator */}
              <div className="flex items-center justify-center w-6">
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
              </div>

              {/* Reference + date */}
              <div className="flex flex-col text-left">
                <span className="font-medium text-foreground">#{transaction.reference_no}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(transaction.created_at).toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
  
              {/* Branch */}
              <div className="flex flex-col">
                <span className="text-foreground">{transaction.branch?.name ?? '-'}</span>
              </div>

              {/* Cashier */}
              <div className="flex flex-col">
                <span className="text-foreground">{transaction.creator?.name ?? '-'}</span>
              </div>

              {/* Status with dot */}
              <div className="flex flex-col">
                <StatusDot 
                  status={getStatusType(transaction.status)} 
                  label={transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1).toLowerCase()} 
                />
              </div>

              {/* Total Items */}
              <div className="flex flex-col">
                <span className="text-foreground">
                  {transaction.order_items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}
                </span>
              </div>

              {/* Total Amount */}
              <div className="flex flex-col">
                <span className="text-foreground">
                  {defaultCurrency?.symbol || '₱'}{Number(transaction.grand_total || 0).toFixed(2)}
                </span>
              </div>

              {/* Amount Paid */}
              <div className="flex flex-col">
                <span className="text-foreground">
                  {defaultCurrency?.symbol || '₱'}{Number(transaction.paid_amount || 0).toFixed(2)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center w-8">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <span
                      className="inline-flex items-center justify-center h-8 w-8 cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewReceipt(transaction); }}>
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" />
                        <line x1="8" y1="7" x2="16" y2="7" stroke="currentColor" />
                        <line x1="8" y1="11" x2="16" y2="11" stroke="currentColor" />
                        <line x1="8" y1="15" x2="12" y2="15" stroke="currentColor" />
                      </svg>
                      View Receipt
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
          </div>
        </AccordionTrigger>

        <AccordionContent>
          <TransactionDetails transaction={transaction} />
        </AccordionContent>
    </AccordionItem>
  );
}
