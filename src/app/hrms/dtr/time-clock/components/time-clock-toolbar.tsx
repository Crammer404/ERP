import React from 'react';
import type { DateRange } from 'react-day-picker';
import { Download, RefreshCw, CirclePlus, Clock, Archive, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { TimeClockTab } from '../hooks/use-time-clock-logs';

interface TimeClockToolbarProps {
  loading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  dateRange?: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
  selectedShift: string;
  onShiftChange: (value: string) => void;
  onExport: () => void;
  onClearFilters: () => void;
  canManageLogs: boolean;
  onAddLog: () => void;
  activeTab: TimeClockTab;
  onTabChange: (value: string) => void;
  earlyOutPendingCount?: number;
}

export function TimeClockToolbar(props: TimeClockToolbarProps) {
  return (
    <>
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-4 w-full min-w-0">
        <Button variant="default" className="bg-green-600 hover:bg-green-700 shrink-0" onClick={props.onExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Input
          placeholder="Search Name"
          value={props.searchTerm}
          onChange={(e) => props.onSearchChange(e.target.value)}
          className="w-full sm:flex-1 sm:min-w-[100px]"
        />
        <DateRangePicker
          date={props.dateRange}
          onDateChange={props.onDateRangeChange}
          placeholder="Select Date Range"
          className="w-full sm:flex-1 sm:min-w-[120px]"
        />
        <Select value={props.selectedShift} onValueChange={props.onShiftChange}>
          <SelectTrigger className="w-full sm:max-w-[110px] sm:min-w-[60px]">
            <SelectValue placeholder="All Shifts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Shifts</SelectItem>
            <SelectItem value="morning">Morning</SelectItem>
            <SelectItem value="afternoon">Afternoon</SelectItem>
            <SelectItem value="evening">Evening</SelectItem>
          </SelectContent>
        </Select>
        <Button
          className="w-full sm:w-auto flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white sm:flex-none shrink-0"
          variant="default"
          onClick={props.onClearFilters}
        >
          <RefreshCw className={`h-4 w-4 ${props.loading ? 'animate-spin' : ''}`} />
          Clear Filters
        </Button>
        {props.canManageLogs && (
          <Button variant="default" className="shrink-0" onClick={props.onAddLog}>
            <CirclePlus className="h-4 w-4 mr-2" />
            Add Log
          </Button>
        )}
      </div>

      {props.canManageLogs && (
        <div className="pt-3">
          <Tabs value={props.activeTab} onValueChange={props.onTabChange} className="w-full">
            <TabsList className="grid w-full mb-6 grid-cols-3">
              <TabsTrigger value="active" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Active
              </TabsTrigger>
              <TabsTrigger value="early_out" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Early Out
                {(props.earlyOutPendingCount ?? 0) > 0 && (
                  <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-transparent ml-1">
                    {props.earlyOutPendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="archive" className="flex items-center gap-2">
                <Archive className="h-4 w-4" />
                Archive
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}
    </>
  );
}

