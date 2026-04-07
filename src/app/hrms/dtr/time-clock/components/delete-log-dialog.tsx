import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DeleteLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeName?: string;
  date?: string;
  title?: string;
  description?: React.ReactNode;
  confirmText?: string;
  onConfirm: () => void;
  loading?: boolean;
}

export function DeleteLogDialog({
  open,
  onOpenChange,
  employeeName,
  date,
  title,
  description,
  confirmText = 'Delete',
  onConfirm,
  loading = false,
}: DeleteLogDialogProps) {
  const defaultTitle = "Delete Time Log Can\u2019t Be Undone";
  const defaultDescription = (
    <>
      Are you sure you want to delete the time log for{' '}
      <span className="font-semibold">{employeeName}</span> on{' '}
      <span className="font-semibold">{date}</span>?
    </>
  );

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-red-500 dark:border-red-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            {title || defaultTitle}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {description || defaultDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Processing...' : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
