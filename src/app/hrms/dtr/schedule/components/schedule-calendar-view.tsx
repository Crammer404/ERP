'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DatesSetArg, EventClickArg, EventContentArg } from '@fullcalendar/core';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { EmptyState } from '@/components/ui/empty-state';
import { CalendarClock } from 'lucide-react';
import { SHIFT_CALENDAR_COLORS } from '@/config/colors.config';
import { dtrService, CalendarEvent } from '../services/schedule-service';
import { useToast } from '@/hooks/use-toast';
import { CalendarEventDetailDialog } from './calendar-event-detail-dialog';

interface ScheduleCalendarViewProps {
  refreshKey?: number;
  onEditSchedule: (scheduleId: number) => void;
  onAssignEmployees: (scheduleId: number) => void;
}

export function ScheduleCalendarView({
  refreshKey = 0,
  onEditSchedule,
  onAssignEmployees,
}: ScheduleCalendarViewProps) {
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [scheduleFilter, setScheduleFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);

  const fetchEvents = useCallback(
    async (start: string, end: string) => {
      setLoading(true);
      try {
        const response = await dtrService.getCalendarEvents(start, end);
        setEvents(response.events ?? []);
      } catch (error) {
        console.error('Error fetching calendar events:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch calendar events',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const handleDatesSet = useCallback(
    (arg: DatesSetArg) => {
      const start = format(arg.start, 'yyyy-MM-dd');
      const end = format(arg.end, 'yyyy-MM-dd');
      setDateRange({ start, end });
      void fetchEvents(start, end);
    },
    [fetchEvents]
  );

  useEffect(() => {
    if (dateRange) {
      void fetchEvents(dateRange.start, dateRange.end);
    }
  }, [refreshKey, dateRange, fetchEvents]);

  const scheduleOptions = useMemo(() => {
    const names = new Set(events.map((event) => event.schedule_name));
    return Array.from(names).sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        event.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.schedule_name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSchedule =
        scheduleFilter === 'all' || event.schedule_name === scheduleFilter;

      return matchesSearch && matchesSchedule;
    });
  }, [events, searchTerm, scheduleFilter]);

  const calendarEvents = useMemo(() => {
    const colors = SHIFT_CALENDAR_COLORS.schedule;

    return filteredEvents.map((event) => ({
      id: event.id,
      title: `${event.employee_name} - ${event.schedule_name}`,
      start: event.start,
      end: event.end,
      backgroundColor: colors.background,
      borderColor: colors.border,
      textColor: colors.text,
      extendedProps: { rawEvent: event },
    }));
  }, [filteredEvents]);

  const renderEventContent = (arg: EventContentArg) => {
    const rawEvent = arg.event.extendedProps.rawEvent as CalendarEvent | undefined;
    if (!rawEvent) {
      return <div className="px-1 text-[0.7rem] truncate">{arg.event.title}</div>;
    }

    return (
      <div className="px-1 py-0.5 leading-tight overflow-hidden">
        <div className="font-medium truncate text-[0.7rem]">
          {rawEvent.employee_name} - {rawEvent.schedule_name}
        </div>
      </div>
    );
  };

  const handleEventClick = (arg: EventClickArg) => {
    const rawEvent = arg.event.extendedProps.rawEvent as CalendarEvent | undefined;
    if (!rawEvent) return;
    setSelectedEvent(rawEvent);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by employee or schedule..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={scheduleFilter} onValueChange={setScheduleFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Filter by schedule" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All schedules</SelectItem>
            {scheduleOptions.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="relative rounded-md border p-2 sm:p-4 schedule-calendar">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 rounded-md">
            <Loader size="sm" />
          </div>
        )}

        {!loading && events.length === 0 && (
          <div className="mb-4">
            <EmptyState
              icon={CalendarClock}
              title="No schedule events"
              description="No employee shifts found for this month. Assign employees to schedules to see them here."
            />
          </div>
        )}

        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: '',
          }}
          height="auto"
          events={calendarEvents}
          datesSet={handleDatesSet}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          dayMaxEvents={3}
          fixedWeekCount={false}
          eventDisplay="block"
        />
      </div>

      <CalendarEventDetailDialog
        event={selectedEvent}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEditSchedule={onEditSchedule}
        onAssignEmployees={onAssignEmployees}
      />

      <style jsx global>{`
        .schedule-calendar .fc {
          --fc-border-color: hsl(var(--border));
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: hsl(var(--muted));
          --fc-today-bg-color: hsl(var(--accent) / 0.5);
          --fc-event-border-color: transparent;
        }

        .schedule-calendar .fc .fc-toolbar-title {
          font-size: 1.125rem;
          font-weight: 600;
        }

        .schedule-calendar .fc .fc-button {
          background: hsl(var(--primary));
          border-color: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }

        .schedule-calendar .fc .fc-button:hover {
          opacity: 0.9;
        }

        .schedule-calendar .fc .fc-button:disabled {
          opacity: 0.5;
        }

        .schedule-calendar .fc .fc-col-header-cell-cushion,
        .schedule-calendar .fc .fc-daygrid-day-number {
          color: hsl(var(--foreground));
          text-decoration: none;
        }

        .schedule-calendar .fc .fc-daygrid-event {
          font-size: 0.7rem;
          padding: 1px 3px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
