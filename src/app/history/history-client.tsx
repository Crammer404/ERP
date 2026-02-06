'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import useLocalStorage from '@/hooks/use-local-storage';
import type { Transaction } from '@/lib/types';
import { format } from 'date-fns';
import { ReceiptText, History } from 'lucide-react';

export function HistoryClient() {
  const [isMounted, setIsMounted] = useState(false);
  const [transactions] = useLocalStorage<Transaction[]>('transactions', []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
        <div className="text-center text-muted-foreground">
            <p>Loading transaction history...</p>
        </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="py-20 text-center">
        <CardContent>
            <History className="mx-auto h-24 w-24 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold font-headline">No transactions yet</h3>
          <p className="text-muted-foreground">
            Complete a purchase to see your history here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <Accordion type="single" collapsible className="w-full">
          {transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((transaction) => (
            <AccordionItem key={transaction.id} value={transaction.id}>
              <AccordionTrigger>
                <div className="flex w-full justify-between items-center pr-4">
                    <div className="flex items-center gap-4">
                        <ReceiptText className="h-5 w-5 text-primary" />
                        <div className="text-left">
                            <p className="font-semibold">
                            Order #{transaction.id.substring(0, 8)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                            {format(new Date(transaction.date), 'MMMM d, yyyy h:mm a')}
                            </p>
                        </div>
                    </div>
                    <p className="text-lg font-semibold font-headline">
                        ${transaction.total.toFixed(2)}
                    </p>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pl-6 pr-2 space-y-4 border-l-2 ml-6 border-primary/20 py-4">
                    <h4 className="font-semibold">Items Purchased:</h4>
                    {transaction.items.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Image
                                src={item.image}
                                alt={item.name}
                                width={48}
                                height={48}
                                className="rounded-md border object-cover"
                                unoptimized
                            />
                            <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {item.quantity} x ${item.price.toFixed(2)}
                                </p>
                            </div>
                        </div>
                        <p className="font-medium">
                            ${(item.price * item.quantity).toFixed(2)}
                        </p>
                    </div>
                    ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
