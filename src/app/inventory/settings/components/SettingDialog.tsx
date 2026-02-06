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
import { SettingForm, SettingFormValues } from './SettingForm';
import { motion } from 'framer-motion';

interface SettingDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  type: 'brand' | 'category' | 'attribute' | 'measurement';
  title?: string;
  setting?: any | null;
  onSave: (values: SettingFormValues, id?: number) => Promise<void>;
  onRefresh?: () => void;
  children?: React.ReactNode;
}

export function SettingDialog({
  open,
  onOpenChange,
  type,
  title,
  setting,
  onSave,
  onRefresh,
  children,
}: SettingDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pop, setPop] = useState(false); // only used for outside click
  const { toast } = useToast();

  const isControlled = open !== undefined && onOpenChange !== undefined;
  const dialogOpen = isControlled ? open : internalOpen;
  const setDialogOpen = isControlled ? onOpenChange! : setInternalOpen;

  const typeLabel = {
    brand: 'Brand',
    category: 'Category',
    attribute: 'Attribute',
    measurement: 'Measurement',
  }[type];

  const computedTitle = title ?? (setting ? `Edit ${typeLabel}` : `Add ${typeLabel}`);

  const handleSave = async (values: SettingFormValues) => {
    // ✅ Close smoothly, without pop
    setDialogOpen(false);
    setIsLoading(true);

    try {
      await onSave(values, setting?.id);
      if (onRefresh) await onRefresh();

      toast({
        title: setting ? `${typeLabel} Updated` : `${typeLabel} Added`,
        description: `${typeLabel} has been ${setting ? 'updated' : 'added'} successfully.`,
        variant: 'success',
      });
    } catch (error: any) {
      console.error(`Error saving ${type}:`, error);
      toast({
        title: `Error`,
        description: `Failed to save ${typeLabel}. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    // ✅ Remove pop animation when closing normally
    setDialogOpen(nextOpen);
  };

  const handleOutsideClick = () => {
    // ✅ Trigger pop animation only when clicked outside
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
            handleOutsideClick(); // ✅ Only outside click causes "pop"
          }}
          className="sm:max-w-[600px] max-h-[80vh] p-0 flex flex-col overflow-hidden rounded-lg bg-background"
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
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <SettingForm
                type={type}
                setting={setting}
                onSave={handleSave}
                onCancel={() => handleOpenChange(false)} // ✅ Smooth close
              />
            </div>

            {/* Footer */}
            <div className="shrink-0 bg dark:bg border-t border dark:border px-6 py-3 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" form="setting-form">
                Save
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
}
