'use client';

import { useState, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { BadgeCheck } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { PaginationInfos } from '@/components/ui/pagination-info';
import { useAuth } from '@/components/providers/auth-provider';
import { Download, User, RefreshCw, Clock } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/hooks/use-toast';
import { exportAttendance, getAttendanceLogs, DtrLogResponseItem } from '@/services/hrms/dtr';

// Data type used by the table
interface AttendanceRecord {
  id: number;
  date: string;
  employee: string;
  branch: string;
  shift: string;
  clockIn: string;
  clockOut: string;
  late: string;
  overtime: string;
  totalWorkHours: string;
}

export default function AttendancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedShift, setSelectedShift] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportDateRange, setExportDateRange] = useState<DateRange | undefined>();
  const [isModalShaking, setIsModalShaking] = useState(false);

  const mapLog = (item: DtrLogResponseItem): AttendanceRecord => {
    const toTime = (ts: string | null): string => {
      if (!ts) return '-';
      const d = new Date(ts);
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    const toDate = (dateStr: string): string => {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      // Fallback if backend sends formatted date already
      return item.date;
    };

    const formatHoursAndMinutes = (
      raw: number | string | null | undefined,
      fallback?: number | string | null | undefined
    ): string => {
      const toNum = (v: any): number | null => {
        if (v === null || v === undefined) return null;
        const n = typeof v === 'number' ? v : parseFloat(String(v));
        return isNaN(n) ? null : n;
      };

      const primary = toNum(raw);
      const secondary = toNum(fallback);
      const value = primary ?? secondary ?? 0;
      if (!value || value <= 0) return '0h 0min';

      let hours = 0;
      let minutes = 0;

      if (Number.isInteger(value) && value >= 60) {
        hours = Math.floor(value / 60);
        minutes = Math.round(value % 60);
      } else if (!Number.isInteger(value) && value < 48) {
        hours = Math.floor(value);
        minutes = Math.round((value - hours) * 60);
      } else {
        hours = Math.floor(value / 60);
        minutes = Math.round(value % 60);
      }

      if (minutes >= 60) {
        hours += Math.floor(minutes / 60);
        minutes = minutes % 60;
      }

      return `${hours}h ${minutes}min`;
    };

    const formatLateMinutes = (
      late: number | string | null | undefined,
      grace: number | string | null | undefined
    ): string => {
      const toNum = (value: any): number | null => {
        if (value === null || value === undefined) return null;
        const parsed = typeof value === 'number' ? value : parseFloat(String(value));
        return Number.isNaN(parsed) ? null : parsed;
      };

      const lateMinutes = toNum(late) ?? 0;
      const graceMinutes = toNum(grace) ?? 0;

      if (lateMinutes <= 0) return '-';
      if (graceMinutes > 0 && lateMinutes <= graceMinutes) return '-';

      return `${lateMinutes} min`;
    };

    const nestedFirst = (item.user as any)?.user_info?.first_name;
    const nestedLast = (item.user as any)?.user_info?.last_name;
    const employeeName = item.user?.name
      || [item.user?.first_name, item.user?.last_name].filter(Boolean).join(' ')
      || [nestedFirst, nestedLast].filter(Boolean).join(' ')
      || `#${item.user_id}`;

    // Get branch name from first branch_user
    const branchName = item.user?.branch_users?.[0]?.branch?.name || '-';

    return {
      id: item.id,
      date: toDate(item.date),
      employee: employeeName,
      branch: branchName,
      shift: item.shift || '-',
      clockIn: toTime(item.clock_in),
      clockOut: toTime(item.clock_out),
      late: formatLateMinutes(item.late_minutes, item.grace_late_minutes),
      overtime: `${item.overtime_minutes ?? 0} min`,
      totalWorkHours: formatHoursAndMinutes(item.total_work_hours),
    };
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await getAttendanceLogs();
      setRecords((res || []).map(mapLog));
    } catch (e: any) {
      const apiErr = e?.response?.data?.message || e?.message || 'Failed to load attendance records';
      toast({
        title: 'Error',
        description: apiErr,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchLogs();
  }, []);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter records
  const filteredRecords = records.filter(record => {
    const matchesSearch = record.employee.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesShift = selectedShift === 'all' || record.shift.toLowerCase() === selectedShift.toLowerCase();
    
    // Date range filter
    let matchesDateRange = true;
    if (dateRange?.from || dateRange?.to) {
      try {
        const recordDate = new Date(record.date);
        if (dateRange.from && recordDate < dateRange.from) {
          matchesDateRange = false;
        }
        if (dateRange.to && recordDate > dateRange.to) {
          matchesDateRange = false;
        }
      } catch (e) {
        // If date parsing fails, exclude the record
        matchesDateRange = false;
      }
    }
    
    return matchesSearch && matchesShift && matchesDateRange;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setSearchTerm('');
    setDateRange(undefined);
    setSelectedShift('all');
    setCurrentPage(1);
    fetchLogs();
  };

  const handleExport = () => {
    // Open modal for date range selection
    setExportModalOpen(true);
  };

  const handleConfirmExport = async () => {
    // Validate date range is selected
    if (!exportDateRange?.from || !exportDateRange?.to) {
      toast({
        title: 'Date Range Required',
        description: 'Please select a date range to export.',
        variant: 'destructive',
      });
      return;
    }

    // Format dates for display
    const fromStr = exportDateRange.from.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const toStr = exportDateRange.to.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    try {
      setExporting(true);
      
      // Format dates (use local date to avoid timezone issues)
      const startDate = `${exportDateRange.from.getFullYear()}-${String(exportDateRange.from.getMonth() + 1).padStart(2, '0')}-${String(exportDateRange.from.getDate()).padStart(2, '0')}`;
      const endDate = `${exportDateRange.to.getFullYear()}-${String(exportDateRange.to.getMonth() + 1).padStart(2, '0')}-${String(exportDateRange.to.getDate()).padStart(2, '0')}`;
      
      console.log('Export dates:', { startDate, endDate, from: exportDateRange.from, to: exportDateRange.to });
      
      await exportAttendance(startDate, endDate);
      
      toast({
        title: 'Export Successful',
        description: `Attendance exported for ${fromStr} - ${toStr}`,
        variant: 'default',
      });

      // Close modal and reset
      setExportModalOpen(false);
      setExportDateRange(undefined);
    } catch (error: any) {
      console.error('Export error:', error);
      
      const statusCode = error?.status || error?.response?.status || 0;
      const errorMessage = error?.response?.data?.message || error?.message || '';
      const lowerMessage = errorMessage.toLowerCase();
      const isNoDataError = statusCode === 404 ||
                            lowerMessage.includes('no attendance records found') || 
                            lowerMessage.includes('no time logs found') || 
                            lowerMessage.includes('no data') ||
                            lowerMessage.includes('no records');

      const isInvalidDate = statusCode === 400 ||
                            lowerMessage.includes('invalid date range') ||
                            lowerMessage.includes('invalid date format');

      toast({
        title: isNoDataError ? 'No Data Found' : isInvalidDate ? 'Invalid Date Range' : 'Export Failed',
        description: isNoDataError 
          ? `No attendance records found for ${fromStr} - ${toStr}. Please select a different date range.`
          : (errorMessage || 'Failed to export attendance. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleModalOutsideClick = () => {
    console.log('Outside click detected - triggering shake effect');
    // Trigger shake animation
    setIsModalShaking(true);
    setTimeout(() => setIsModalShaking(false), 600);
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const getUserDisplayName = () => {
    if (!user) return 'Loading...';
    return user.name || user.email || 'User';
  };

  const getUserRole = () => {
    if (!user) return '';
    // Get role from user object if available
    return user.role_name || '(Employee)';
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <BadgeCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-headline">Attendance</h1>
          <p className="text-sm text-muted-foreground">
            Manage your attendance records.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Section: Employee Profile */}
        <div className="lg:w-[300px] shrink-0">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Employee Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Profile Picture */}
              <div className="flex flex-col items-center">
                <Avatar className="w-20 h-20 mb-2">
                  <AvatarFallback className="text-lg bg-muted">
                    <User className="w-10 h-10 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                
                {/* Employee Name and Role */}
                <div className="text-center">
                  <h3 className="text-sm font-semibold">{getUserDisplayName()}</h3>
                  <p className="text-xs text-muted-foreground">{getUserRole()}</p>
                </div>
              </div>
              
              {/* Current Date and Time */}
              <div className="pt-4 border-t">
                <p className="text-sm font-medium">
                  Today: {formatDateTime(currentTime)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Section: Attendance Records */}
        <div className="flex-1 min-w-0">
          <Card>
            <CardHeader>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-4">
                <Button 
                  variant="default" 
                  className="bg-green-600 hover:bg-green-700 shrink-0"
                  onClick={handleExport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <DateRangePicker
                  date={dateRange}
                  onDateChange={setDateRange}
                  placeholder="Select Date Range"
                  className="sm:w-auto min-w-[200px] flex-1 sm:flex-none"
                />
                <Select value={selectedShift} onValueChange={setSelectedShift}>
                  <SelectTrigger className="sm:w-40 min-w-[140px]">
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
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none shrink-0"
                  variant="default" 
                  onClick={handleRefresh}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Clear
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {/* Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Shift</TableHead>
                      <TableHead>Clock In</TableHead>
                      <TableHead>Clock Out</TableHead>
                      <TableHead>Late</TableHead>
                      <TableHead>Overtime</TableHead>
                      <TableHead>Total Work Hours</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <Loader size="sm" />
                        </TableCell>
                      </TableRow>
                    ) : paginatedRecords.length > 0 ? (
                      paginatedRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{record.date}</TableCell>
                          <TableCell className="font-medium">{record.employee}</TableCell>
                          <TableCell>{record.branch}</TableCell>
                          <TableCell>{record.shift}</TableCell>
                          <TableCell>{record.clockIn}</TableCell>
                          <TableCell>{record.clockOut}</TableCell>
                          <TableCell>{record.late}</TableCell>
                          <TableCell>{record.overtime}</TableCell>
                          <TableCell>{record.totalWorkHours}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="p-0">
                          <EmptyState
                            icon={Clock}
                            title="No attendance records found"
                            description="There are no attendance records for this branch yet. Records will appear here once employees clock in."
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6">
                <PaginationInfos.Standard
                  from={(currentPage - 1) * itemsPerPage + 1}
                  to={Math.min(currentPage * itemsPerPage, filteredRecords.length)}
                  total={filteredRecords.length}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />

                {totalPages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>

                      {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage === 1) {
                          pageNum = i + 1;
                        } else if (currentPage === totalPages) {
                          pageNum = totalPages - 2 + i;
                        } else {
                          pageNum = currentPage - 1 + i;
                        }
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setCurrentPage(pageNum)}
                              isActive={currentPage === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Export Modal */}
      <Dialog open={exportModalOpen} onOpenChange={(open) => {
        // Allow normal open/close behavior (X button will work)
        setExportModalOpen(open);
        // Reset date range when closing
        if (!open) {
          setExportDateRange(undefined);
        }
      }}>
        <DialogContent 
          className={`sm:max-w-md ${isModalShaking ? 'animate-shake animate-pulse-border !border-red-500' : ''}`}
          onInteractOutside={(e) => {
            e.preventDefault();
            handleModalOutsideClick();
          }}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            handleModalOutsideClick();
          }}
        >
          <DialogHeader>
            <DialogTitle>Export My Attendance</DialogTitle>
            <DialogDescription>
              Select a date range to export your attendance records in Excel format
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range *</label>
              <DateRangePicker
                date={exportDateRange}
                onDateChange={setExportDateRange}
                placeholder="Select Date Range"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Export will include only your attendance records for the selected date range
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setExportModalOpen(false);
                setExportDateRange(undefined);
              }}
              disabled={exporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmExport}
              disabled={exporting || !exportDateRange?.from || !exportDateRange?.to}
              className="bg-green-600 hover:bg-green-700"
            >
              {exporting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export to Excel
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}