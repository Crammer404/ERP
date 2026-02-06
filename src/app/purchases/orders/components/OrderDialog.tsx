'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { useToast } from '@/hooks/use-toast';
import { OrderForm, OrderFormValues } from './OrderForm';
import { motion } from 'framer-motion';

interface OrderDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  order?: any | null;
  onSave: (values: any, id?: number) => Promise<void>;
  onRefresh?: () => void;
  children?: React.ReactNode;
  currentBranch?: { id: number; name: string } | null;
}

export function OrderDialog({
  open,
  onOpenChange,
  title,
  order,
  onSave,
  onRefresh,
  children,
  currentBranch,
}: OrderDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pop, setPop] = useState(false);
  const { toast } = useToast();

  const isControlled = open !== undefined && onOpenChange !== undefined;
  const dialogOpen = isControlled ? open : internalOpen;
  const setDialogOpen = isControlled ? onOpenChange! : setInternalOpen;

  const computedTitle = title ?? (order ? `Edit Purchase Order` : `Add Purchase Order`);

  const handleSave = async (values: any) => {
    setDialogOpen(false);
    setIsLoading(true);

    try {
      await onSave(values, order?.id);
      if (onRefresh) await onRefresh();

      toast({
        title: order ? `Order Updated` : `Order Added`,
        description: `Purchase order has been ${order ? 'updated' : 'added'} successfully.`,
        variant: 'success',
      });
    } catch (error: any) {
      console.error(`Error saving order:`, error);
      toast({
        title: `Error`,
        description: `Failed to save purchase order. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setDialogOpen(nextOpen);
  };

  const handleOutsideClick = () => {
    setPop(true);
    setTimeout(() => setPop(false), 250);
  };

  return (
    <>
      {isLoading && <Loader overlay={true} size="lg" />}

      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        {children && <DialogTrigger asChild>{children}</DialogTrigger>}

        <DialogContent
          onInteractOutside={(e) => {
            e.preventDefault();
            handleOutsideClick();
          }}
          className="sm:max-w-[800px] max-h-[90vh] p-0 flex flex-col overflow-hidden rounded-lg bg-background"
        >
          <motion.div
            key={dialogOpen ? 'open' : 'close'}
            initial={{ opacity: 1, scale: 1 }}
            animate={
              pop
                ? { scale: [1, 1.05, 1], opacity: [1, 0.9, 1] }
                : { scale: 1, opacity: 1 }
            }
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <DialogHeader className="shrink-0 sticky top-0 bg dark:bg px-6 py-3 border-b border dark:border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DialogTitle>{computedTitle}</DialogTitle>
                </div>
              </div>
            </DialogHeader>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
              <OrderForm
                order={order}
                onSave={handleSave}
                onCancel={() => handleOpenChange(false)}
                currentBranch={currentBranch}
              />
            </div>

            {/* Footer */}
            <div className="shrink-0 bg dark:bg border-t border dark:border px-6 py-3 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" form="order-form">
                Save
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
}