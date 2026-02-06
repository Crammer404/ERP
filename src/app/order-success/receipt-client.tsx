
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/config/api.config';
import { Printer, ShoppingBasket, ArrowLeft, ShoppingCart} from 'lucide-react';
import { ReceiptTemplate } from '@/components/forms/receipt/receipt-template';
import { useReceiptData } from './hooks/use-receipt';
import { useReceiptPrint } from './hooks/use-receipt-print';

export function ReceiptClient() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { receiptData, transactionToDisplay, isLoading, brandingLoaded } = useReceiptData();
  const { receiptRef, handlePrint } = useReceiptPrint();

  const from = typeof window !== 'undefined' ? sessionStorage.getItem('receiptSource') : null;
  const customerId = typeof window !== 'undefined' ? sessionStorage.getItem('customerId') : null;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || isLoading || !brandingLoaded) {
    return (
        <div className="text-center text-muted-foreground">
            <p>Loading receipt...</p>
        </div>
    );
  }

  if (!transactionToDisplay) {
    return (
      <div className="w-full max-w-md text-center p-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-xl font-bold mb-4">No Transaction Found</h2>
        <p className="mb-4">We couldn't find the details of your transaction.</p>
        <Button asChild>
          <Link href={ROUTES.POS.SALES} className="flex items-center">
              <ShoppingCart className="mr-2 h-4 w-4" />
              POS
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
        <div ref={receiptRef}>
          {receiptData && (
            <ReceiptTemplate data={receiptData} className="print:shadow-none print:border-none" />
          )}
        </div>
        <div className="mt-6 flex justify-center gap-4 print:hidden">
            <Button onClick={handlePrint} variant="outline">
                <Printer className="mr-2 h-4 w-4" />
                Print Receipt
            </Button>
            {from === 'purchases' && (
                <Button onClick={() => router.push(`/customers/purchases?id=${customerId}`)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Purchases
                </Button>
            )}
            {from === 'transactions' && (
                <Button onClick={() => router.push('/pos/transactions')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Transactions
                </Button>
            )}
            {from !== 'purchases' && from !== 'transactions' && (
                <Button asChild>
                  <Link href={ROUTES.POS.SALES} className="flex items-center">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      POS
                  </Link>
                </Button>
            )}
        </div>
    </div>
  );
}