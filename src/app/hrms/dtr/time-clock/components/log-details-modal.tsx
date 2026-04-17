'use client';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { TimeClockLog } from '../types';
import { formatStatusLabel } from '../utils/log-mappers';

interface LogDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: TimeClockLog | null;
  title?: string;
  description?: string;
}

const formatReviewedAt = (value: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

const hasEarlyOutReview = (log: TimeClockLog | null) => {
  if (!log) return false;
  return Boolean(
    log.earlyOutRequestId ||
      log.earlyOutRequestStatus ||
      log.earlyOutRemainingMinutes > 0 ||
      log.earlyOutReviewNotes ||
      log.earlyOutReviewedAt ||
      (log.reviewedBy && log.reviewedBy !== '-')
  );
};

export function LogDetailsModal({
  open,
  onOpenChange,
  log,
  title = 'Attendance Log Details',
  description = 'Detailed information of the attendance log.',
}: LogDetailsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {log && (
          <div className="space-y-4 py-2 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="font-semibold">Employee:</span> {log.employee}</div>
              <div><span className="font-semibold">Date:</span> {log.date}</div>
              <div><span className="font-semibold">Shift:</span> {log.shift}</div>
              <div><span className="font-semibold">Status:</span> {formatStatusLabel(log.status)}</div>
              <div><span className="font-semibold">Clock In:</span> {log.clockIn}</div>
              <div><span className="font-semibold">Clock Out:</span> {log.clockOut}</div>
              <div><span className="font-semibold">Late:</span> {log.late}</div>
              <div><span className="font-semibold">Overtime:</span> {log.overtime}</div>
              <div><span className="font-semibold">Actual Hours:</span> {log.actualHours}</div>
              <div><span className="font-semibold">Total Hours:</span> {log.totalWorkHours}</div>
            </div>

            {hasEarlyOutReview(log) && (
              <div className="rounded-md border p-3 space-y-2">
                <p className="font-semibold">Early-Out Review</p>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <p>
                      <span className="font-medium">Request Status:</span>{' '}
                      {log.earlyOutRequestStatus ? formatStatusLabel(log.earlyOutRequestStatus) : '-'}
                    </p>
                    <p>
                      <span className="font-medium">Remaining Minutes:</span>{' '}
                      {log.earlyOutRemainingMinutes || 0}
                    </p>
                  </div>

                  <div className="grid grid-cols-1">
                    <p className="break-words">
                      <span className="font-medium">Reviewed At:</span>{' '}
                      {formatReviewedAt(log.earlyOutReviewedAt)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <p>
                      <span className="font-medium">Reviewed By:</span>{' '}
                      {log.reviewedBy || '-'}
                    </p>
                    <p className="break-words">
                      <span className="font-medium">Review Notes:</span>{' '}
                      {log.earlyOutReason || log.earlyOutReviewNotes || '-'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
