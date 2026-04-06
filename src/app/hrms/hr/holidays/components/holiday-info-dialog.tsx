'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type HolidayType = 'regular' | 'special_non_working';

export type EditHolidayFormState = {
  holiday_date: string;
  holiday_name: string;
  holiday_type: HolidayType;
  is_active: boolean;
};

export function HolidayInfoDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving: boolean;
  mode: 'create' | 'edit';
  value: EditHolidayFormState;
  onChange: (next: EditHolidayFormState) => void;
  onSave: () => void;
}) {
  const { open, onOpenChange, saving, mode, value, onChange, onSave } = props;

  const selectedDate = value.holiday_date ? new Date(`${value.holiday_date}T00:00:00`) : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add Manual Holiday' : 'Update Holiday'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Add a holiday manually.' : 'Update date, name, type, and status.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3">
          <div className="grid gap-1">
            <span className="text-sm font-medium">Date</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('justify-start text-left font-normal', !value.holiday_date && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {value.holiday_date && selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (!date) return;
                    onChange({ ...value, holiday_date: format(date, 'yyyy-MM-dd') });
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-1">
            <span className="text-sm font-medium">Name</span>
            <Input
              value={value.holiday_name}
              onChange={(e) => onChange({ ...value, holiday_name: e.target.value })}
            />
          </div>

          <div className="grid gap-1">
            <span className="text-sm font-medium">Type</span>
            <Select
              value={value.holiday_type}
              onValueChange={(next: HolidayType) => onChange({ ...value, holiday_type: next })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="special_non_working">Special Non-Working</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1">
            <span className="text-sm font-medium">Status</span>
            <Select
              value={value.is_active ? 'active' : 'inactive'}
              onValueChange={(next) => onChange({ ...value, is_active: next === 'active' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? 'Saving...' : mode === 'create' ? 'Add holiday' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

