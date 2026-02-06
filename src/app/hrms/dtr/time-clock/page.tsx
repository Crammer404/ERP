'use client';

import { useState, useEffect, useRef } from 'react';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Download, Smartphone, X, Clock, RefreshCw } from 'lucide-react';
import { getTimeClockLogs, clock as clockApi, exportTimesheet, DtrLogResponseItem } from '@/services/hrms/dtr';
import { useToast } from '@/hooks/use-toast';
import { Loader } from '@/components/ui/loader';
import { EmptyState } from '@/components/ui/empty-state';

// Data type used by the table
interface TimeClockLog {
  id: number;
  date: string;
  // raw date from API (YYYY-MM-DD) for filtering
  dateRaw: string;
  employee: string;
  branch: string;
  scheduleName: string;
  shift: string;
  clockIn: string;
  clockOut: string;
  late: string;
  overtime: string;
  totalWorkHours: string;
}

export default function TimeClockPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedShift, setSelectedShift] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState<TimeClockLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [clocking, setClocking] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportDateRange, setExportDateRange] = useState<DateRange | undefined>();
  const [userIdInput, setUserIdInput] = useState('');
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [isModalShaking, setIsModalShaking] = useState(false);
  const scannerRef = useRef<any>(null);
  const { toast } = useToast();

  // Compute earliest log date (for export range limits)
  const earliestLogDate: Date | undefined = (() => {
    if (!logs.length) return undefined;
    const timestamps = logs
      .map(l => new Date(l.dateRaw).getTime())
      .filter(t => isFinite(t));
    if (!timestamps.length) return undefined;
    return new Date(Math.min(...timestamps));
  })();

  const today = new Date();

  const mapLog = (item: DtrLogResponseItem): TimeClockLog => {
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
      if (!value || value <= 0) return '0h 0m';

      // If value looks like minutes (e.g., >= 60 or a whole number commonly used by API), treat as minutes
      // If value looks like decimal hours (e.g., 7.5), convert fractional part to minutes
      let hours = 0;
      let minutes = 0;

      if (Number.isInteger(value) && value >= 60) {
        // minutes
        hours = Math.floor(value / 60);
        minutes = Math.round(value % 60);
      } else if (!Number.isInteger(value) && value < 48) {
        // decimal hours (cap 2 days to be safe)
        hours = Math.floor(value);
        minutes = Math.round((value - hours) * 60);
      } else {
        // assume minutes if ambiguous
        hours = Math.floor(value / 60);
        minutes = Math.round(value % 60);
      }

      // Normalize minute overflow
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

    const computeTotalFromClockTimes = (startStr: string | null, endStr: string | null): string => {
      if (!startStr || !endStr) return '0h 0min';
      const start = new Date(startStr).getTime();
      const end = new Date(endStr).getTime();
      if (!isFinite(start) || !isFinite(end) || end <= start) return '0h 0min';
      const diffMinutes = Math.round((end - start) / 60000);
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours}h ${minutes}min`;
    };

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

    const nestedFirst = (item.user as any)?.user_info?.first_name;
    const nestedLast = (item.user as any)?.user_info?.last_name;
    const employeeName = item.user?.name
      || [item.user?.first_name, item.user?.last_name].filter(Boolean).join(' ')
      || [nestedFirst, nestedLast].filter(Boolean).join(' ')
      || `#${item.user_id}`;

    // Get branch name from first branch_user
    const branchName = item.user?.branch_users?.[0]?.branch?.name || '-';
    
    // Get schedule name from the API response
    const scheduleName = item.schedule_name || '-';

    return {
      id: item.id,
      date: toDate(item.date),
      dateRaw: item.date,
      employee: employeeName,
      branch: branchName,
      scheduleName: scheduleName,
      shift: item.shift || '-',
      clockIn: toTime(item.clock_in),
      clockOut: toTime(item.clock_out),
      overtime: `${item.overtime_minutes ?? 0} min`,
      totalWorkHours: formatHoursAndMinutes(item.total_work_hours),
      late: formatLateMinutes(item.late_minutes, item.grace_late_minutes),
    };
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await getTimeClockLogs();
      setLogs((res || []).map(mapLog));
    } catch (e: any) {
      const apiErr = e?.response?.data?.message || e?.message || 'Failed to load logs';
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
    // Auto-start scanner on page load
    setIsScanning(true);
  }, []);

  // Listen for branch context changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'branch_context') {
        // Branch changed, refetch logs
        fetchLogs();
      }
    };

    // Listen to storage events from other tabs/windows
    window.addEventListener('storage', handleStorageChange);

    // Also listen to custom event for same-window changes
    const handleBranchChange = () => {
      fetchLogs();
    };
    window.addEventListener('branchChanged', handleBranchChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('branchChanged', handleBranchChange);
    };
  }, []);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // QR Scanner lifecycle
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (!isScanning) return;
      try {
        const mod: any = await import('html5-qrcode');
        const Html5QrcodeScanner = mod.Html5QrcodeScanner;
        const config = {
          fps: 10,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const base = Math.min(viewfinderWidth, viewfinderHeight);
            const edge = Math.floor(base * 0.90);
            return { width: edge, height: edge };
          },
          rememberLastUsedCamera: true
        } as any;
        const scanner = new Html5QrcodeScanner('timeclock-qr-reader', config, false);
        scannerRef.current = scanner;

        const onScanSuccess = async (decodedText: string) => {
          if (!mounted || isProcessingScan) return; // Ignore if already processing
          
          setIsProcessingScan(true);
          
          try {
            // Parse QR data (could be JSON or just text with user ID)
            let userId: number | null = null;
            
            try {
              // Try parsing as JSON first (from our QR code generation)
              const qrData = JSON.parse(decodedText);
              userId = qrData.id;
            } catch {
              // Fallback: extract first number sequence as user ID
              const match = decodedText.match(/\d+/);
              if (match) {
                userId = parseInt(match[0], 10);
              }
            }
            
            if (userId) {
              await handleClockWithUserId(userId);
            } else {
              toast({
                title: 'Invalid QR Code',
                description: 'QR code does not contain a valid user ID.',
                variant: 'destructive',
              });
            }
          } finally {
            // Resume scanning after a short delay to prevent double-scanning same QR
            setTimeout(() => {
              setIsProcessingScan(false);
            }, 1500);
          }
        };

        const onScanFailure = () => {
          // Ignore continuous scan errors to avoid spamming UI
        };

        scanner.render(onScanSuccess, onScanFailure);
      } catch (err: any) {
        toast({
          title: 'Scanner Error',
          description: err?.message || 'Failed to start QR scanner',
          variant: 'destructive',
        });
      }
    };

    init();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch {}
        scannerRef.current = null;
      }
    };
  }, [isScanning, isProcessingScan]);

  // Helpers for date filter (normalize to start/end of day local time)
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  // Filter logs (search, shift, date range)
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.employee.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesShift = selectedShift === 'all' || log.shift.toLowerCase() === selectedShift.toLowerCase();
    const matchesDate = (() => {
      if (!dateRange?.from && !dateRange?.to) return true;
      const logDate = new Date(log.dateRaw);
      if (!isFinite(logDate.getTime())) return true; // if parse fails, don't exclude
      const from = dateRange?.from ? startOfDay(dateRange.from).getTime() : -Infinity;
      const to = dateRange?.to ? endOfDay(dateRange.to).getTime() : Infinity;
      return logDate.getTime() >= from && logDate.getTime() <= to;
    })();
    return matchesSearch && matchesShift && matchesDate;
  });

  const hasDateFilter = Boolean(dateRange?.from || dateRange?.to);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
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

    // Clamp range within [earliestLogDate, today]
    const minAllowed = earliestLogDate ? new Date(earliestLogDate.getFullYear(), earliestLogDate.getMonth(), earliestLogDate.getDate()) : undefined;
    const maxAllowed = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    let from = exportDateRange.from;
    let to = exportDateRange.to;
    let adjusted = false;
    if (minAllowed && from < minAllowed) { from = minAllowed; adjusted = true; }
    if (to > maxAllowed) { to = maxAllowed; adjusted = true; }

    // Format dates for display
    const fromStr = from.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const toStr = to.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    try {
      setExporting(true);
      
      // Format dates (use local date to avoid timezone issues)
      const startDate = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-${String(from.getDate()).padStart(2, '0')}`;
      const endDate = `${to.getFullYear()}-${String(to.getMonth() + 1).padStart(2, '0')}-${String(to.getDate()).padStart(2, '0')}`;
      
      console.log('Export dates:', { startDate, endDate, from: exportDateRange.from, to: exportDateRange.to });
      
      await exportTimesheet(startDate, endDate);
      
      toast({
        title: 'Export Successful',
        description: `Timesheet exported for ${fromStr} - ${toStr}${adjusted ? ' (adjusted to available data range)' : ''}`,
        variant: 'default',
      });

      // Close modal and reset
      setExportModalOpen(false);
      setExportDateRange(undefined);
    } catch (error: any) {
      console.error('Export error:', error);
      
      // Check if it's a "no data" error
      const statusCode = error?.status || error?.response?.status || 0;
      const errorMessage = error?.response?.data?.message || error?.message || '';
      const lowerMessage = errorMessage.toLowerCase();
      const isNoDataError = statusCode === 404 || statusCode === 204 ||
                           lowerMessage.includes('no time logs found') || 
                           lowerMessage.includes('no data') ||
                           lowerMessage.includes('no records');
      
      toast({
        title: isNoDataError ? 'No Data Found' : 'Export Failed',
        description: isNoDataError 
          ? `We couldn't find any time clock records between ${fromStr} and ${toStr}. Try another date range or ensure there are logs recorded for those days.`
          : (errorMessage || 'Failed to export timesheet. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleStartScanning = () => {
    setIsScanning(true);
  };

  const handleStopScanning = () => {
    setIsScanning(false);
    setIsProcessingScan(false);
  };

  const handleRestartScanning = async () => {
    setIsScanning(false);
    setIsProcessingScan(false);
    
    // Wait a bit for the scanner to fully stop
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setIsScanning(true);
  };

  const handleScanImage = () => {
    // TODO: Implement image file scanning
    console.log('Scan image file...');
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

  const handleClockWithUserId = async (uid: number) => {
    if (!uid || uid <= 0) {
      toast({
        title: 'Invalid User ID',
        description: 'Please provide a valid user ID.',
        variant: 'destructive',
      });
      return;
    }
    setClocking(true);
    try {
      const res = await clockApi(uid);
      const msg = res?.message || 'Clock action completed';
      toast({
        title: 'Success',
        description: msg,
        variant: 'default',
      });
      await fetchLogs();
    } catch (e: any) {
      const apiErr = e?.response?.data?.message || e?.message || 'Clock action failed';
      toast({
        title: 'Error',
        description: apiErr,
        variant: 'destructive',
      });
    } finally {
      setClocking(false);
    }
  };

  const handleClock = async () => {
    const uid = parseInt(userIdInput, 10);
    await handleClockWithUserId(uid);
  };

  const handleModalOutsideClick = () => {
    console.log('Outside click detected - triggering shake effect');
    // Trigger shake animation
    setIsModalShaking(true);
    setTimeout(() => setIsModalShaking(false), 600);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <BadgeCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-headline">Time Clock</h1>
          <p className="text-sm text-muted-foreground">
            Clock in and out of your shift.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Section: QR Scanner */}
        <div className="lg:w-[300px] shrink-0">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>QR Scanner</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isScanning ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="text-center">
                    <Smartphone className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Click the button below to start scanning
                    </p>
                  </div>
                  <Button 
                    onClick={handleStartScanning}
                    className="w-full"
                    size="lg"
                  >
                    Start Scanner
                  </Button>
                </div>
              ) : (
                <>
                  <div className="w-full max-w-[300px] mx-auto relative">
                    <div id="timeclock-qr-reader" className="w-full [&_img]:mx-auto [&>div]:flex [&>div]:flex-col [&>div]:items-center" />
                    {isProcessingScan && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                        <div className="text-center text-white">
                          <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
                          <p className="text-sm font-medium">Processing...</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground text-center">
                    Scan to Clock In/Out
                  </p>
                </>
              )}
              
              <div className="pt-4 border-t">
                <p className="text-sm font-medium">
                  Today: {formatDateTime(currentTime)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Section: Time Clock Records */}
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
            <Input
              placeholder="Search Name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sm:w-64 min-w-[200px] flex-1 sm:flex-none"
            />
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
                  <TableHead>Schedule Name</TableHead>
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
                    <TableCell colSpan={10} className="text-center py-8">
                      <Loader size="sm" />
                    </TableCell>
                  </TableRow>
                ) : paginatedLogs.length > 0 ? (
                  paginatedLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.date}</TableCell>
                      <TableCell className="font-medium">{log.employee}</TableCell>
                      <TableCell>{log.branch}</TableCell>
                      <TableCell>{log.scheduleName}</TableCell>
                      <TableCell>{log.shift}</TableCell>
                      <TableCell>{log.clockIn}</TableCell>
                      <TableCell>{log.clockOut}</TableCell>
                      <TableCell>{log.late}</TableCell>
                      <TableCell>{log.overtime}</TableCell>
                      <TableCell>{log.totalWorkHours}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="p-0">
                      {hasDateFilter ? (
                        <EmptyState
                          icon={Clock}
                          title="No data found"
                          description="No time clock records exist within the selected date range. Try a different range."
                        />
                      ) : (
                        <EmptyState
                          icon={Clock}
                          title="No time clock records found"
                          description="There are no clock-in/clock-out records for this branch yet. Employees will appear here once they clock in."
                        />
                      )}
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
              to={Math.min(currentPage * itemsPerPage, filteredLogs.length)}
              total={filteredLogs.length}
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
            <DialogTitle>Export Timesheet</DialogTitle>
            <DialogDescription>
              Select a date range to export the timesheet in Excel format
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
                minDate={earliestLogDate}
                maxDate={today}
              />
              <p className="text-xs text-muted-foreground">
                The timesheet will include all employees with time logs in the selected date range
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