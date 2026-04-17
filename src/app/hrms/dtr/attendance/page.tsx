'use client';

import { useState, useEffect, useRef } from 'react';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { PaginationInfos } from '@/components/ui/pagination-info';
import { Download, Loader2, RefreshCw, Clock } from 'lucide-react';
import { EmployeeIdCard } from '../employee-id/components/employee-id';
import { useToast } from '@/hooks/use-toast';
import { exportAttendance, getAttendanceLogs } from '@/services/hrms/dtr';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { TimeClockTable } from '../time-clock/components/time-clock-table';
import { LogDetailsModal } from '../time-clock/components/log-details-modal';
import type { TimeClockLog } from '../time-clock/types';
import { mapTimeClockLog } from '../time-clock/utils/log-mappers';

export default function AttendancePage() {
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedShift, setSelectedShift] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [records, setRecords] = useState<TimeClockLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportDateRange, setExportDateRange] = useState<DateRange | undefined>();
  const [isModalShaking, setIsModalShaking] = useState(false);
  const [leftPanelHeight, setLeftPanelHeight] = useState(0);
  const leftPanelRef = useRef<HTMLDivElement | null>(null);
  const employeeIdDownloadRef = useRef<(() => Promise<void>) | null>(null);
  const [downloadingEmployeeId, setDownloadingEmployeeId] = useState(false);
  const [selectedLog, setSelectedLog] = useState<TimeClockLog | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await getAttendanceLogs();
      setRecords((res || []).map(mapTimeClockLog));
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
        const recordDate = new Date(record.dateRaw || record.date);
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
  const hasDateFilter = Boolean(dateRange?.from || dateRange?.to);
  const isTableEmpty = !loading && filteredRecords.length === 0;

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

  const handleViewLog = (log: TimeClockLog) => {
    setSelectedLog(log);
    setViewModalOpen(true);
  };

  useEffect(() => {
    if (!leftPanelRef.current || typeof ResizeObserver === 'undefined') return;
    const el = leftPanelRef.current;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setLeftPanelHeight(Math.ceil(entry.contentRect.height));
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, []);


  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Section: Employee Profile */}
        <div ref={leftPanelRef} className="lg:w-[300px] shrink-0">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base font-semibold uppercase text-center">Digital Employee ID</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <EmployeeIdCard
                  compact
                  hideDownloadButton
                  onDownloadRequestReady={(handler) => {
                    employeeIdDownloadRef.current = handler;
                  }}
                />
              </div>
              <div className="flex justify-center">
                <Button
                  className="text-xs"
                  disabled={downloadingEmployeeId || !employeeIdDownloadRef.current}
                  onClick={async () => {
                    if (!employeeIdDownloadRef.current) return;
                    setDownloadingEmployeeId(true);
                    try {
                      await employeeIdDownloadRef.current();
                    } finally {
                      setDownloadingEmployeeId(false);
                    }
                  }}
                >
                  {downloadingEmployeeId ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-3 w-3" />
                      Download ID Card
                    </>
                  )}
                </Button>
              </div>
              <div className="pt-4 border-t text-center">
                <p className="text-sm font-normal">
                  Today: {formatDateTime(currentTime)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Section: Attendance Records */}
        <div className="flex-1 min-w-0">
          <Card
            className={isTableEmpty ? 'h-full flex flex-col' : ''}
            style={isTableEmpty && leftPanelHeight > 0 ? { minHeight: `${leftPanelHeight}px` } : undefined}
          >
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
                  className="w-full sm:flex-1 sm:min-w-[110px]"
                />
                <Select value={selectedShift} onValueChange={setSelectedShift}>
                  <SelectTrigger className="w-full sm:flex-1 sm:min-w-[110px]">
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
                  Refresh
                </Button>
              </div>
            </CardHeader>

            <CardContent className={cn(isTableEmpty && 'flex flex-1 min-h-0 flex-col')}>
              <TimeClockTable
                loading={loading}
                logs={paginatedRecords}
                activeTab="active"
                canManageLogs={true}
                actionMode="view"
                hasDateFilter={hasDateFilter}
                onViewLog={handleViewLog}
                onEditLog={() => {}}
                onDeleteLog={() => {}}
                onRestoreLog={() => {}}
                onForceDeleteLog={() => {}}
                onApproveEarlyOut={() => {}}
                onRejectEarlyOut={() => {}}
              />

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

      <LogDetailsModal
        open={viewModalOpen}
        onOpenChange={(open) => {
          setViewModalOpen(open);
          if (!open) {
            setSelectedLog(null);
          }
        }}
        log={selectedLog}
        title="Attendance Log Details"
        description="Detailed information of the attendance log."
      />
    </div>
  );
}