/**
 * ScanResultDialog – confirmation & error dialogs shown after a QR scan.
 *
 * • ScanConfirmDialog  – success: shows employee name, action, and time.
 * • ScanErrorDialog    – failure: shows the error message.
 *
 * Both dialogs block outside-click / Escape so the user must press OK,
 * which lets the parent restart the scanner.
 */

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { BadgeCheck, AlertCircle } from 'lucide-react';
import { TimeDisplay } from './time-display';

/* ------------------------------------------------------------------ */
/*  Scan Confirm Dialog                                                */
/* ------------------------------------------------------------------ */

export interface ScanConfirmData {
  employeeName: string;
  action: string;
  time: string;
}

interface ScanConfirmDialogProps {
  open: boolean;
  data: ScanConfirmData | null;
  onClose: () => void;
}

export const ScanConfirmDialog = ({ open, data, onClose }: ScanConfirmDialogProps) => (
  <Dialog
    open={open}
    onOpenChange={(o) => {
      if (!o) onClose();
    }}
  >
    <DialogContent
      className="sm:max-w-sm"
      onInteractOutside={(e) => e.preventDefault()}
      onEscapeKeyDown={(e) => e.preventDefault()}
    >
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <BadgeCheck className="h-5 w-5 text-green-600" />
          Clock Recorded
        </DialogTitle>
        <DialogDescription>
          The following time entry has been recorded successfully.
        </DialogDescription>
      </DialogHeader>

      {data && (
        <div className="space-y-3 py-4">
          <div className="p-4 bg-muted rounded-md space-y-2">
            <p className="text-sm">
              <span className="font-medium text-muted-foreground">Employee:</span>{' '}
              <span className="font-semibold">{data.employeeName}</span>
            </p>
            <p className="text-sm">
              <span className="font-medium text-muted-foreground">Action:</span>{' '}
              <span className="font-semibold">{data.action}</span>
            </p>
            <p className="text-sm">
              <span className="font-medium text-muted-foreground">Time:</span>{' '}
              <span className="font-semibold">
                <TimeDisplay value={data.time} />
              </span>
            </p>
          </div>
        </div>
      )}

      <DialogFooter>
        <Button onClick={onClose} className="w-full">
          OK
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

/* ------------------------------------------------------------------ */
/*  Scan Error Dialog                                                  */
/* ------------------------------------------------------------------ */

interface ScanErrorDialogProps {
  open: boolean;
  message: string;
  onClose: () => void;
}

export const ScanErrorDialog = ({ open, message, onClose }: ScanErrorDialogProps) => (
  <Dialog
    open={open}
    onOpenChange={(o) => {
      if (!o) onClose();
    }}
  >
    <DialogContent
      className="sm:max-w-sm"
      onInteractOutside={(e) => e.preventDefault()}
      onEscapeKeyDown={(e) => e.preventDefault()}
    >
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          Clock Failed
        </DialogTitle>
        <DialogDescription>
          The clock action could not be completed.
        </DialogDescription>
      </DialogHeader>

      {message && (
        <div className="space-y-3 py-4">
          <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-md">
            <p className="text-sm text-red-700 dark:text-red-400">
              {message}
            </p>
          </div>
        </div>
      )}

      <DialogFooter>
        <Button onClick={onClose} variant="destructive" className="w-full">
          OK
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
