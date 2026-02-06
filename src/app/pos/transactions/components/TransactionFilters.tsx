'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

export type PeriodFilter = 'day' | 'month' | 'year' | 'range';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface TransactionFiltersProps {
  periodFilter: PeriodFilter;
  setPeriodFilter: (value: PeriodFilter) => void;
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  years: number[];
  hasCustomSelection: boolean;
  onClear: () => void;
}

export function TransactionFilters({
  periodFilter,
  setPeriodFilter,
  selectedDate,
  setSelectedDate,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  dateRange,
  setDateRange,
  years,
  hasCustomSelection,
  onClear,
}: TransactionFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="period-filter" className="text-sm text-muted-foreground">
        Period:
      </Label>
      <Select value={periodFilter} onValueChange={(value) => setPeriodFilter(value as PeriodFilter)}>
        <SelectTrigger id="period-filter" className="w-[140px]">
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="day">Day</SelectItem>
          <SelectItem value="month">Month</SelectItem>
          <SelectItem value="year">Year</SelectItem>
          <SelectItem value="range">Range</SelectItem>
        </SelectContent>
      </Select>

      {periodFilter === 'day' && (
        <>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {hasCustomSelection && (
            <Button
              variant="outline"
              onClick={onClear}
              className="h-10"
              title="Reset to today"
            >
              Clear
            </Button>
          )}
        </>
      )}

      {periodFilter === 'month' && (
        <>
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasCustomSelection && (
            <Button
              variant="outline"
              onClick={onClear}
              className="h-10"
              title="Reset to current month"
            >
              Clear
            </Button>
          )}
        </>
      )}

      {periodFilter === 'year' && (
        <>
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasCustomSelection && (
            <Button
              variant="outline"
              onClick={onClear}
              className="h-10"
              title="Reset to current year"
            >
              Clear
            </Button>
          )}
        </>
      )}

      {periodFilter === 'range' && (
        <>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[250px] justify-start text-left font-normal",
                  !dateRange?.from && "text-muted-foreground"
                )}
              >
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  "Pick a date range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          {hasCustomSelection && (
            <Button
              variant="outline"
              onClick={onClear}
              className="h-10"
              title="Reset to default range"
            >
              Clear
            </Button>
          )}
        </>
      )}
    </div>
  );
}
