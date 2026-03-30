'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { holidaysService, type HolidayPreviewItem, type PayrollHolidayItem } from './services/holidays-service';

export default function HolidaysPage() {
  const { toast } = useToast();
  const [holidayYear, setHolidayYear] = useState<number>(new Date().getFullYear());
  const [holidays, setHolidays] = useState<PayrollHolidayItem[]>([]);
  const [holidayLoading, setHolidayLoading] = useState(false);
  const [holidaySyncing, setHolidaySyncing] = useState(false);
  const [hasSyncedPreview, setHasSyncedPreview] = useState(false);
  const [previewHolidays, setPreviewHolidays] = useState<HolidayPreviewItem[]>([]);
  const [holidaySaving, setHolidaySaving] = useState(false);
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayType, setNewHolidayType] = useState<'regular' | 'special_non_working'>('regular');

  const holidayYearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, index) => currentYear - index);
  }, []);

  useEffect(() => {
    setHasSyncedPreview(false);
    setPreviewHolidays([]);
    void fetchHolidayData(holidayYear);
  }, [holidayYear]);

  const fetchHolidayData = async (year: number) => {
    try {
      setHolidayLoading(true);
      const response = await holidaysService.list(year);
      setHolidays(response.holidays || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to load holidays',
        variant: 'destructive',
      });
    } finally {
      setHolidayLoading(false);
    }
  };

  const handleSyncHolidays = async () => {
    try {
      setHolidaySyncing(true);
      if (!hasSyncedPreview) {
        const response = await holidaysService.sync(holidayYear);
        setPreviewHolidays(response.holidays || []);
        setHasSyncedPreview(true);
        toast({
          title: 'Synced',
          description: `${response.total} holidays fetched. Click "Update DB Holiday" to apply.`,
        });
      } else {
        const response = await holidaysService.updateDb(
          holidayYear,
          previewHolidays.map((holiday) => ({
            holiday_date: holiday.holiday_date,
            holiday_name: holiday.holiday_name,
            holiday_type: holiday.holiday_type,
          }))
        );
        setHasSyncedPreview(false);
        setPreviewHolidays([]);
        await fetchHolidayData(holidayYear);
        toast({
          title: 'Success',
          description: `DB updated. Deleted ${response.deleted}, seeded ${response.seeded}.`,
        });
      }
    } catch (error: any) {
      toast({
        title: hasSyncedPreview ? 'Update DB Failed' : 'Sync Failed',
        description: error?.message || 'Failed to process holiday request.',
        variant: 'destructive',
      });
    } finally {
      setHolidaySyncing(false);
    }
  };

  const handleCreateHoliday = async () => {
    if (!newHolidayDate || !newHolidayName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Date and holiday name are required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setHolidaySaving(true);
      await holidaysService.create({
        holiday_date: newHolidayDate,
        holiday_name: newHolidayName.trim(),
        holiday_type: newHolidayType,
        is_active: true,
      });
      setNewHolidayDate('');
      setNewHolidayName('');
      await fetchHolidayData(holidayYear);
      toast({ title: 'Success', description: 'Holiday added successfully.' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to add holiday.',
        variant: 'destructive',
      });
    } finally {
      setHolidaySaving(false);
    }
  };

  const handleUpdateHolidayType = async (id: number, holiday_type: 'regular' | 'special_non_working') => {
    try {
      await holidaysService.update(id, { holiday_type });
      setHolidays((prev) => prev.map((h) => (h.id === id ? { ...h, holiday_type } : h)));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update holiday type.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    try {
      await holidaysService.delete(id);
      setHolidays((prev) => prev.filter((h) => h.id !== id));
      toast({ title: 'Deleted', description: 'Holiday removed.' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete holiday.',
        variant: 'destructive',
      });
    }
  };

  const handleRemovePreviewHoliday = (holidayDate: string, holidayName: string) => {
    setPreviewHolidays((prev) =>
      prev.filter(
        (holiday) => !(holiday.holiday_date === holidayDate && holiday.holiday_name === holidayName)
      )
    );
  };

  const handleUpdatePreviewHolidayType = (
    holidayDate: string,
    holidayName: string,
    holidayType: 'regular' | 'special_non_working'
  ) => {
    setPreviewHolidays((prev) =>
      prev.map((holiday) =>
        holiday.holiday_date === holidayDate && holiday.holiday_name === holidayName
          ? { ...holiday, holiday_type: holidayType }
          : holiday
      )
    );
  };

  const formatDateToUs = (dateValue: string): string => {
    // Handles both "YYYY-MM-DD" and ISO datetime values from API.
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      const [year, month, day] = dateValue.split('-').map((part) => Number(part));
      const date = new Date(Date.UTC(year, month - 1, day));
      return format(date, 'MMM d, yyyy');
    }

    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) {
      return dateValue;
    }

    // Use Philippines timezone to avoid off-by-one rendering from UTC timestamps.
    return format(parsed, 'MMM d, yyyy');
  };

  const displayedHolidays: Array<PayrollHolidayItem | HolidayPreviewItem> = hasSyncedPreview ? previewHolidays : holidays;
  const selectedManualHolidayDate = newHolidayDate ? new Date(`${newHolidayDate}T00:00:00`) : undefined;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="italic md:text-lg font-semibold">Philippines Holidays</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={String(holidayYear)} onValueChange={(value) => setHolidayYear(Number(value))}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {holidayYearOptions.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleSyncHolidays} disabled={holidaySyncing}>
                {holidaySyncing
                  ? hasSyncedPreview
                    ? 'Updating DB...'
                    : 'Syncing...'
                  : hasSyncedPreview
                    ? 'Update DB Holiday'
                    : 'Sync API Holiday'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'justify-start text-left font-normal',
                    !newHolidayDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newHolidayDate ? format(selectedManualHolidayDate as Date, 'MMM d, yyyy') : 'Select holiday date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedManualHolidayDate}
                  onSelect={(date) => {
                    if (!date) {
                      setNewHolidayDate('');
                      return;
                    }
                    setNewHolidayDate(format(date, 'yyyy-MM-dd'));
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Input
              placeholder="Holiday name"
              value={newHolidayName}
              onChange={(e) => setNewHolidayName(e.target.value)}
            />
            <Select value={newHolidayType} onValueChange={(value: 'regular' | 'special_non_working') => setNewHolidayType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="special_non_working">Special Non-Working</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleCreateHoliday} disabled={holidaySaving}>
              Add Manual Holiday
            </Button>
          </div>

          {holidayLoading ? (
            <p className="text-sm text-muted-foreground">Loading holidays...</p>
          ) : displayedHolidays.length === 0 ? (
            <p className="text-sm text-muted-foreground">No holidays configured for this year.</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Source</th>
                    <th className="text-left p-2">Active</th>
                    <th className="text-left p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedHolidays.map((holiday) => (
                    <tr key={'id' in holiday ? holiday.id : `${holiday.holiday_date}-${holiday.holiday_name}`} className="border-t">
                      <td className="p-2">{formatDateToUs(holiday.holiday_date)}</td>
                      <td className="p-2">{holiday.holiday_name}</td>
                      <td className="p-2">
                        <Select
                          value={holiday.holiday_type || 'regular'}
                          onValueChange={(value: 'regular' | 'special_non_working') =>
                            'id' in holiday
                              ? handleUpdateHolidayType(holiday.id, value)
                              : handleUpdatePreviewHolidayType(holiday.holiday_date, holiday.holiday_name, value)
                          }
                        >
                          <SelectTrigger className="h-8 w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="regular">Regular</SelectItem>
                            <SelectItem value="special_non_working">Special Non-Working</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">{holiday.source}</td>
                      <td className="p-2">{holiday.is_active ? 'Yes' : 'No'}</td>
                      <td className="p-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            'id' in holiday
                              ? handleDeleteHoliday(holiday.id)
                              : handleRemovePreviewHoliday(holiday.holiday_date, holiday.holiday_name)
                          }
                        >
                          {'id' in holiday ? 'Delete' : 'Remove'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

