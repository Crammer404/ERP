/**
 * ScanResultDialog – confirmation & error dialogs shown after a QR scan.
 *
 * • ScanConfirmDialog  – success: shows employee name, action, and time.
 * • ScanErrorDialog    – failure: shows the error message.
 *
 * Both dialogs block outside-click / Escape so the user must press OK,
 * which lets the parent restart the scanner.
 */

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { BadgeCheck, AlertCircle, Clock } from 'lucide-react';
import { TimeDisplay } from './time-display';

const AUTO_CLOSE_MS = 3000;

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

export const ScanConfirmDialog = ({ open, data, onClose }: ScanConfirmDialogProps) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (open) {
      timerRef.current = setTimeout(() => onCloseRef.current(), AUTO_CLOSE_MS);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent
        className="sm:max-w-sm overflow-hidden"
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
                <span className="font-medium text-muted-foreground">{data.action}:</span>{' '}
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

        {open && (
          <div className="absolute bottom-0 left-0 right-0 h-1">
            <div
              className="h-full bg-green-600 rounded-b-lg"
              style={{
                animation: `shrinkWidth ${AUTO_CLOSE_MS}ms linear forwards`,
              }}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

/* ------------------------------------------------------------------ */
/*  Scan Error Dialog                                                  */
/* ------------------------------------------------------------------ */

interface ScanErrorDialogProps {
  open: boolean;
  message: string;
  onClose: () => void;
}

export const ScanErrorDialog = ({ open, message, onClose }: ScanErrorDialogProps) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (open) {
      timerRef.current = setTimeout(() => onCloseRef.current(), AUTO_CLOSE_MS);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent
        className="sm:max-w-sm overflow-hidden"
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

        {open && (
          <div className="absolute bottom-0 left-0 right-0 h-1">
            <div
              className="h-full bg-red-600 rounded-b-lg"
              style={{
                animation: `shrinkWidth ${AUTO_CLOSE_MS}ms linear forwards`,
              }}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

/* ------------------------------------------------------------------ */
/*  Overtime Confirm Dialog                                            */
/* ------------------------------------------------------------------ */

export interface OvertimePromptData {
  employeeName: string;
  logId: number;
  userId: number;
  shift: string;
  clockIn: string;
  clockOut: string;
  date: string;
}

interface OvertimeConfirmDialogProps {
  open: boolean;
  data: OvertimePromptData | null;
  confirming: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const OvertimeConfirmDialog = ({
  open,
  data,
  confirming,
  onConfirm,
  onCancel,
}: OvertimeConfirmDialogProps) => (
  <Dialog
    open={open}
    onOpenChange={(o) => {
      if (!o) onCancel();
    }}
  >
    <DialogContent
      className="sm:max-w-sm"
      onInteractOutside={(e) => e.preventDefault()}
      onEscapeKeyDown={(e) => e.preventDefault()}
    >
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-500" />
          Continue as Overtime?
        </DialogTitle>
        <DialogDescription>
          Your shift has already ended. Do you want to continue this as overtime?
        </DialogDescription>
      </DialogHeader>

      {data && (
        <div className="space-y-3 py-4">
          <div className="p-4 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 rounded-md space-y-2">
            <p className="text-sm">
              <span className="font-medium text-muted-foreground">Employee:</span>{' '}
              <span className="font-semibold">{data.employeeName}</span>
            </p>
            <p className="text-sm">
              <span className="font-medium text-muted-foreground">Shift:</span>{' '}
              <span className="font-semibold">{data.shift}</span>
            </p>
            <p className="text-sm">
              <span className="font-medium text-muted-foreground">Clock In:</span>{' '}
              <span className="font-semibold">
                <TimeDisplay value={data.clockIn} />
              </span>
            </p>
            <p className="text-sm">
              <span className="font-medium text-muted-foreground">Clock Out:</span>{' '}
              <span className="font-semibold">
                <TimeDisplay value={data.clockOut} />
              </span>
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Confirming will reopen your time log so you can continue working. Your previous clock-out will be cleared.
          </p>
        </div>
      )}

      <DialogFooter className="flex gap-2 sm:gap-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={confirming}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={confirming}
          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
        >
          {confirming ? 'Reopening...' : 'Yes, Continue'}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
