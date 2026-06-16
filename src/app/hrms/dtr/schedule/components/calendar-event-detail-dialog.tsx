'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { CalendarEvent } from '../services/schedule-service';
import { SHIFT_COLOR_CLASSES } from '@/config/colors.config';

interface CalendarEventDetailDialogProps {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditSchedule: (scheduleId: number) => void;
  onAssignEmployees: (scheduleId: number) => void;
}

const formatEventTime = (value: string) => {
  try {
    return format(parseISO(value), 'h:mm a');
  } catch {
    return value;
  }
};

export function CalendarEventDetailDialog({
  event,
  open,
  onOpenChange,
  onEditSchedule,
  onAssignEmployees,
}: CalendarEventDetailDialogProps) {
  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{event.employee_name}</DialogTitle>
          <DialogDescription>Schedule details for this day</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Schedule</span>
            <span className="font-medium">{event.schedule_name}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Branch</span>
            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
              {event.branch}
            </Badge>
          </div>

          <div className="space-y-2">
            <span className="text-muted-foreground">Shifts</span>
            <div className="rounded-md border divide-y">
              {event.shifts.map((shift) => {
                const shiftClass = SHIFT_COLOR_CLASSES[shift.shift_label] ?? '';
                return (
                  <div key={shift.shift} className="flex items-center justify-between gap-2 px-3 py-2">
                    <span className={shiftClass}>{shift.shift_label}</span>
                    <span>
                      {formatEventTime(shift.start)} – {formatEventTime(shift.end)}
                      {shift.is_overnight ? ' (overnight)' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Grace Period</span>
            <span>{event.grace_period} min</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Overtime Threshold</span>
            <span>{event.overtime_threshold} min</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onAssignEmployees(event.schedule_id);
            }}
          >
            <Users className="h-4 w-4 mr-2" />
            Assign Employees
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              onEditSchedule(event.schedule_id);
            }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
