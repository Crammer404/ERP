'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { DeleteLogDialog } from './components/delete-log-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { PaginationInfos } from '@/components/ui/pagination-info';
import { Download, Clock, CheckCircle, XCircle } from 'lucide-react';
import { exportTimesheet, deleteManualLog, restoreManualLog, forceDeleteManualLog, approveEarlyOutRequest, rejectEarlyOutRequest } from '@/services/hrms/dtr';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/providers/auth-provider';
import { ManualLogModal, ManualLogData } from './components/manual-log-modal';
import { ScanConfirmDialog, ScanErrorDialog, OvertimeConfirmDialog } from './components/scan-result-dialog';
import { TimeClockToolbar } from './components/time-clock-toolbar';
import { QrScannerPanel } from './components/qr-scanner-panel';
import { TimeClockTable } from './components/time-clock-table';
import { LogDetailsModal } from './components/log-details-modal';
import type { TimeClockLog } from './types';
import { useTimeClockLogs } from './hooks/use-time-clock-logs';
import { useTimeClockDialogs } from './hooks/use-time-clock-dialogs';
import { useClockActions } from './hooks/use-clock-actions';
import { useQrScannerClock } from './hooks/use-qr-scanner-clock';

export default function TimeClockPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [clocking, setClocking] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [userIdInput, setUserIdInput] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logModalMode, setLogModalMode] = useState<'add' | 'edit'>('add');
  const [activeLog, setActiveLog] = useState<ManualLogData | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState<TimeClockLog | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [logToRestore, setLogToRestore] = useState<TimeClockLog | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [forceDeleteConfirmOpen, setForceDeleteConfirmOpen] = useState(false);
  const [logToForceDelete, setLogToForceDelete] = useState<TimeClockLog | null>(null);
  const [forceDeleting, setForceDeleting] = useState(false);
  const [earlyOutApproveModalOpen, setEarlyOutApproveModalOpen] = useState(false);
  const [earlyOutRejectModalOpen, setEarlyOutRejectModalOpen] = useState(false);
  const [earlyOutSubmitting, setEarlyOutSubmitting] = useState(false);
  const [earlyOutActionNotes, setEarlyOutActionNotes] = useState('');
  const [selectedEarlyOutLog, setSelectedEarlyOutLog] = useState<TimeClockLog | null>(null);
  const [selectedViewLog, setSelectedViewLog] = useState<TimeClockLog | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const today = new Date();
  const {
    exportModalOpen,
    setExportModalOpen,
    exportDateRange,
    setExportDateRange,
    isModalShaking,
    handleModalOutsideClick,
    scanConfirmOpen,
    setScanConfirmOpen,
    scanConfirmData,
    setScanConfirmData,
    scanErrorOpen,
    setScanErrorOpen,
    scanErrorMessage,
    setScanErrorMessage,
    overtimeConfirmOpen,
    setOvertimeConfirmOpen,
    overtimeConfirmData,
    setOvertimeConfirmData,
    overtimeConfirming,
    setOvertimeConfirming,
    earlyOutConfirmOpen,
    setEarlyOutConfirmOpen,
    earlyOutConfirming,
    setEarlyOutConfirming,
    earlyOutPromptData,
    setEarlyOutPromptData,
  } = useTimeClockDialogs();

  const {
    logs,
    loading,
    totalItems,
    totalPages,
    pageFrom,
    pageTo,
    earliestLogDate,
    earlyOutPendingCount,
    currentPage,
    itemsPerPage,
    searchTerm,
    dateRange,
    selectedShift,
    activeTab,
    setSearchTerm,
    setDateRange,
    setSelectedShift,
    setCurrentPage,
    setItemsPerPage,
    setActiveTab,
    clearLogsCache,
    fetchLogs,
    handleTabChange,
  } = useTimeClockLogs({
    onError: (message) =>
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      }),
  });

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'branch_context') {
        clearLogsCache();
        if (currentPage === 1) {
          fetchLogs({ page: 1, force: true });
        } else {
          setCurrentPage(1);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    const handleBranchChange = () => {
      clearLogsCache();
      if (currentPage === 1) {
        fetchLogs({ page: 1, force: true });
      } else {
        setCurrentPage(1);
      }
    };
    window.addEventListener('branchChanged', handleBranchChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('branchChanged', handleBranchChange);
    };
  }, [currentPage, itemsPerPage, searchTerm, selectedShift, dateRange?.from?.getTime(), dateRange?.to?.getTime()]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hasDateFilter = Boolean(dateRange?.from || dateRange?.to);

  const handleItemsPerPageChange = (value: string) => {
    const parsed = parseInt(value, 10);
    setItemsPerPage(Number.isNaN(parsed) ? 10 : parsed);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    const hasChanges =
      searchTerm !== '' ||
      selectedShift !== 'all' ||
      Boolean(dateRange?.from || dateRange?.to) ||
      currentPage !== 1;

    clearLogsCache();
    setSearchTerm('');
    setDateRange(undefined);
    setSelectedShift('all');
    setCurrentPage(1);
    setActiveTab('active');

    if (!hasChanges) {
      fetchLogs({ page: 1, force: true });
    }
  };


  const handleRestoreLog = (log: TimeClockLog) => {
    setLogToRestore(log);
    setRestoreConfirmOpen(true);
  };

  const confirmRestore = async () => {
    if (!logToRestore) return;
    try {
      setRestoring(true);
      await restoreManualLog(logToRestore.id);
      setRestoreConfirmOpen(false);
      setLogToRestore(null);
      clearLogsCache();
      await fetchLogs({ force: true });
      toast({ title: 'Restored', description: 'Time log restored successfully.' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || error?.message || 'Failed to restore time log.',
        variant: 'destructive',
      });
    } finally {
      setRestoring(false);
    }
  };

  const handleForceDeleteLog = (log: TimeClockLog) => {
    setLogToForceDelete(log);
    setForceDeleteConfirmOpen(true);
  };

  const confirmForceDelete = async () => {
    if (!logToForceDelete) return;
    try {
      setForceDeleting(true);
      await forceDeleteManualLog(logToForceDelete.id);
      setForceDeleteConfirmOpen(false);
      setLogToForceDelete(null);
      clearLogsCache();
      await fetchLogs({ force: true });
      toast({ title: 'Deleted', description: 'Time log permanently deleted.' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || error?.message || 'Failed to permanently delete time log.',
        variant: 'destructive',
      });
    } finally {
      setForceDeleting(false);
    }
  };

  const handleExport = () => {
    setExportModalOpen(true);
  };

  const handleConfirmExport = async () => {
    if (!exportDateRange?.from || !exportDateRange?.to) {
      toast({
        title: 'Date Range Required',
        description: 'Please select a date range to export.',
        variant: 'destructive',
      });
      return;
    }

    const minAllowed = earliestLogDate ? new Date(earliestLogDate.getFullYear(), earliestLogDate.getMonth(), earliestLogDate.getDate()) : undefined;
    const maxAllowed = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    let from = exportDateRange.from;
    let to = exportDateRange.to;
    let adjusted = false;
    if (minAllowed && from < minAllowed) { from = minAllowed; adjusted = true; }
    if (to > maxAllowed) { to = maxAllowed; adjusted = true; }

    const fromStr = from.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const toStr = to.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    try {
      setExporting(true);
      
      const startDate = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-${String(from.getDate()).padStart(2, '0')}`;
      const endDate = `${to.getFullYear()}-${String(to.getMonth() + 1).padStart(2, '0')}-${String(to.getDate()).padStart(2, '0')}`;
      
      console.log('Export dates:', { startDate, endDate, from: exportDateRange.from, to: exportDateRange.to });
      
      await exportTimesheet(startDate, endDate);
      
      toast({
        title: 'Export Successful',
        description: `Timesheet exported for ${fromStr} - ${toStr}${adjusted ? ' (adjusted to available data range)' : ''}`,
        variant: 'default',
      });

      setExportModalOpen(false);
      setExportDateRange(undefined);
    } catch (error: any) {
      console.error('Export error:', error);
      
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
    startScanner();
  };

  const handleStopScanning = () => {
    stopScanner();
    resetScanProcessingState();
  };

  const handleRestartScanning = async () => {
    stopScanner();
    resetScanProcessingState();
    await new Promise(resolve => setTimeout(resolve, 300));
    startScanner();
  };

  const handleScanImage = () => {
    console.log('Scan image file...');
  };

  const {
    clocking: isClocking,
    overtimeConfirming: isOvertimeConfirming,
    earlyOutConfirming: isEarlyOutConfirming,
    handleClockWithUserId,
    handleOvertimeConfirm: onOvertimeConfirm,
    handleOvertimeCancel,
    handleEarlyOutConfirm: onEarlyOutConfirm,
    handleEarlyOutCancel,
  } = useClockActions({
    onSuccess: (message) => toast({ title: 'Success', description: message, variant: 'default' }),
    onError: (message) => toast({ title: 'Error', description: message, variant: 'destructive' }),
    refreshLogs: async () => {
      clearLogsCache();
      await fetchLogs({ force: true });
    },
    stopScanner: () => {
      clearScannerResetTimeout();
      setIsScanning(false);
    },
    startScanner: () => setIsScanning(true),
    resetScanProcessingState: () => resetScanProcessingState(),
    setScanConfirmData,
    setScanConfirmOpen,
    setScanErrorMessage,
    setScanErrorOpen,
    setOvertimeConfirmData,
    setOvertimeConfirmOpen,
    setEarlyOutPromptData,
    setEarlyOutConfirmOpen,
  });

  useEffect(() => {
    setClocking(isClocking);
  }, [isClocking]);

  useEffect(() => {
    setOvertimeConfirming(isOvertimeConfirming);
  }, [isOvertimeConfirming]);

  useEffect(() => {
    setEarlyOutConfirming(isEarlyOutConfirming);
  }, [isEarlyOutConfirming]);

  const handleClock = async () => {
    const uid = parseInt(userIdInput, 10);
    await handleClockWithUserId(uid);
  };

  const {
    isScanning,
    setIsScanning,
    isScannerPanelCollapsed,
    setIsScannerPanelCollapsed,
    isProcessingScan,
    resetScanProcessingState,
    startScanner,
    stopScanner,
    clearScannerResetTimeout,
  } = useQrScannerClock({
    onScanUserId: async (userId) => handleClockWithUserId(userId, true),
    onScanInvalid: () => {
      stopScanner();
      setScanErrorMessage('QR code does not contain a valid user ID.');
      setScanErrorOpen(true);
    },
    onScannerError: (message) => {
      toast({
        title: 'Scanner Error',
        description: message,
        variant: 'destructive',
      });
    },
  });

  const handleScanConfirmClose = () => {
    setScanConfirmOpen(false);
    setScanConfirmData(null);
    resetScanProcessingState();
    // Restart the scanner (camera on) after the dialog closes
    setIsScanning(true);
  };

  const handleScanErrorClose = () => {
    setScanErrorOpen(false);
    setScanErrorMessage('');
    resetScanProcessingState();
    // Restart the scanner (camera on) after the error dialog closes
    setIsScanning(true);
  };

  const handleOvertimeConfirm = async () => {
    await onOvertimeConfirm(overtimeConfirmData);
  };

  const handleEarlyOutConfirm = async () => {
    if (earlyOutPromptData?.source === 'manual') {
      setEarlyOutConfirmOpen(false);
      setEarlyOutPromptData(null);
      return;
    }
    await onEarlyOutConfirm(earlyOutPromptData);
  };

  const canManageLogs = (): boolean => {
    if (!user?.role_name) return false;
    const roleName = user.role_name.toLowerCase();
    return roleName === 'super admin' || roleName === 'owner' || roleName === 'tenant manager' || roleName === 'branch manager';
  };

  const handleAddLog = () => {
    setLogModalMode('add');
    setActiveLog(null);
    setIsLogModalOpen(true);
  };

  const handleEditLog = (log: TimeClockLog) => {
    const manualLog: ManualLogData = {
      id: log.id,
      userId: log.userId,
      dateRaw: log.dateRaw,
      employee: log.employee,
      branch: log.branch,
      scheduleName: log.scheduleName,
      shift: log.shift,
      clockInRaw: log.clockInRaw,
      clockOutRaw: log.clockOutRaw,
    };

    setLogModalMode('edit');
    setActiveLog(manualLog);
    setIsLogModalOpen(true);
  };

  const handleDeleteLog = (log: TimeClockLog) => {
    setLogToDelete(log);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!logToDelete) return;

    setDeleting(true);
    try {
      const response = await deleteManualLog(logToDelete.id);
      
      if (response.status === 'success') {
        toast({
          title: 'Success',
          description: response.message || 'Time log deleted successfully',
        });
        
        setDeleteConfirmOpen(false);
        setLogToDelete(null);
        clearLogsCache();
        fetchLogs({ force: true });
      } else {
        throw new Error(response.message || 'Failed to delete time log');
      }
    } catch (error: any) {
      console.error('Error deleting time log:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || error.message || 'Failed to delete time log',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleApproveEarlyOut = (log: TimeClockLog) => {
    setSelectedEarlyOutLog(log);
    setEarlyOutActionNotes('');
    setEarlyOutApproveModalOpen(true);
  };

  const handleRejectEarlyOut = (log: TimeClockLog) => {
    setSelectedEarlyOutLog(log);
    setEarlyOutActionNotes('');
    setEarlyOutRejectModalOpen(true);
  };

  const handleViewLog = (log: TimeClockLog) => {
    setSelectedViewLog(log);
    setViewModalOpen(true);
  };

  const confirmApproveEarlyOut = async () => {
    if (!selectedEarlyOutLog?.earlyOutRequestId) {
      toast({
        title: 'Error',
        description: 'Early-out request record not found for this log.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setEarlyOutSubmitting(true);
      await approveEarlyOutRequest(selectedEarlyOutLog.earlyOutRequestId, earlyOutActionNotes || undefined);
      toast({
        title: 'Early Out Approved',
        description: `Early-out request for ${selectedEarlyOutLog.employee} has been approved.`,
      });
      setEarlyOutApproveModalOpen(false);
      setSelectedEarlyOutLog(null);
      setEarlyOutActionNotes('');
      clearLogsCache();
      await fetchLogs({ force: true });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || error?.message || 'Failed to approve early-out request.',
        variant: 'destructive',
      });
    } finally {
      setEarlyOutSubmitting(false);
    }
  };

  const confirmRejectEarlyOut = async () => {
    if (!selectedEarlyOutLog?.earlyOutRequestId) {
      toast({
        title: 'Error',
        description: 'Early-out request record not found for this log.',
        variant: 'destructive',
      });
      return;
    }

    if (!earlyOutActionNotes.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a rejection reason.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setEarlyOutSubmitting(true);
      await rejectEarlyOutRequest(selectedEarlyOutLog.earlyOutRequestId, earlyOutActionNotes.trim());
      toast({
        title: 'Early Out Rejected',
        description: `Early-out request for ${selectedEarlyOutLog.employee} has been rejected.`,
      });
      setEarlyOutRejectModalOpen(false);
      setSelectedEarlyOutLog(null);
      setEarlyOutActionNotes('');
      clearLogsCache();
      await fetchLogs({ force: true });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || error?.message || 'Failed to reject early-out request.',
        variant: 'destructive',
      });
    } finally {
      setEarlyOutSubmitting(false);
    }
  };


  return (
    <div className="container mx-auto py-6 px-4 overflow-x-hidden">
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full max-w-full overflow-x-hidden">
        <QrScannerPanel
          isScannerPanelCollapsed={isScannerPanelCollapsed}
          setIsScannerPanelCollapsed={setIsScannerPanelCollapsed}
          isScanning={isScanning}
          isProcessingScan={isProcessingScan}
          onStartScanning={handleStartScanning}
          currentTime={currentTime}
        />

        {/* Main Section: Time Clock Records */}
        <div className="flex-1 min-w-0 w-full">
       <Card className="w-full">
        <CardHeader>
          <TimeClockToolbar
            loading={loading}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            selectedShift={selectedShift}
            onShiftChange={setSelectedShift}
            onExport={handleExport}
            onClearFilters={handleRefresh}
            canManageLogs={canManageLogs()}
            onAddLog={handleAddLog}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            earlyOutPendingCount={earlyOutPendingCount}
          />
        </CardHeader>

        <CardContent>
          <TimeClockTable
            loading={loading}
            logs={logs}
            activeTab={activeTab}
            canManageLogs={canManageLogs()}
            hasDateFilter={hasDateFilter}
            onViewLog={handleViewLog}
            onEditLog={handleEditLog}
            onDeleteLog={handleDeleteLog}
            onRestoreLog={handleRestoreLog}
            onForceDeleteLog={handleForceDeleteLog}
            onApproveEarlyOut={handleApproveEarlyOut}
            onRejectEarlyOut={handleRejectEarlyOut}
          />

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6">
            <PaginationInfos.Standard
              from={pageFrom}
              to={pageTo}
              total={totalItems}
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
        setExportModalOpen(open);
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

      {/* Manual Log Modal */}
      {canManageLogs() && (
        <ManualLogModal
          isOpen={isLogModalOpen}
          mode={logModalMode}
          log={activeLog}
          onClose={() => setIsLogModalOpen(false)}
          onSuccess={async (result) => {
            clearLogsCache();
            await fetchLogs({ force: true });
            if (result?.earlyOutWarning) {
              setEarlyOutPromptData({
                userId: activeLog?.userId ?? 0,
                employeeName: result.earlyOutWarning.employee_name,
                attemptedClockOut: result.earlyOutWarning.attempted_clock_out,
                scheduledClockOut: result.earlyOutWarning.scheduled_clock_out,
                remainingMinutes: Number(result.earlyOutWarning.remaining_minutes || 0),
                source: 'manual',
              });
              setEarlyOutConfirmOpen(true);
            }
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {canManageLogs() && (
        <DeleteLogDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          employeeName={logToDelete?.employee}
          date={logToDelete?.date}
          onConfirm={confirmDelete}
          loading={deleting}
        />
      )}

      {canManageLogs() && (
        <ConfirmDialog
          open={restoreConfirmOpen}
          onOpenChange={setRestoreConfirmOpen}
          title="Restore time log?"
          description="This will move the log back to Active logs."
          confirmText="Restore"
          cancelText="Cancel"
          onConfirm={confirmRestore}
          variant="warning"
          contentClassName="border border-yellow-500"
          loading={restoring}
        />
      )}

      {canManageLogs() && (
        <DeleteLogDialog
          open={forceDeleteConfirmOpen}
          onOpenChange={setForceDeleteConfirmOpen}
          employeeName={logToForceDelete?.employee}
          date={logToForceDelete?.date}
          title="Permanently delete time log?"
          description="This action cannot be undone."
          confirmText="Delete permanently"
          onConfirm={confirmForceDelete}
          loading={forceDeleting}
        />
      )}

      {/* Scan Confirmation Dialog */}
      <ScanConfirmDialog
        open={scanConfirmOpen}
        data={scanConfirmData}
        onClose={handleScanConfirmClose}
      />

      {/* Scan Error Dialog */}
      <ScanErrorDialog
        open={scanErrorOpen}
        message={scanErrorMessage}
        onClose={handleScanErrorClose}
      />

      {/* Overtime Confirmation Dialog */}
      <OvertimeConfirmDialog
        open={overtimeConfirmOpen}
        data={overtimeConfirmData}
        confirming={overtimeConfirming}
        onConfirm={handleOvertimeConfirm}
        onCancel={handleOvertimeCancel}
      />

      <ConfirmDialog
        open={earlyOutConfirmOpen}
        onOpenChange={setEarlyOutConfirmOpen}
        title="Early clock-out detected"
        description={
          earlyOutPromptData
            ? `${earlyOutPromptData.employeeName}, this clock-out is ${earlyOutPromptData.remainingMinutes.toFixed(2)} minute(s) earlier than your scheduled out (${earlyOutPromptData.scheduledClockOut}). Early clock-out is subject to disciplinary action and requires admin approval before payroll processing.`
            : 'This clock-out is earlier than scheduled and requires approval.'
        }
        confirmText={earlyOutPromptData?.source === 'manual' ? 'Okay' : (earlyOutConfirming ? 'Processing...' : 'Proceed Clock Out')}
        cancelText={earlyOutPromptData?.source === 'manual' ? 'Close' : 'Cancel'}
        onConfirm={handleEarlyOutConfirm}
        variant="warning"
        loading={earlyOutPromptData?.source === 'manual' ? false : earlyOutConfirming}
      />

      <Dialog open={earlyOutApproveModalOpen} onOpenChange={setEarlyOutApproveModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Early Out Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this early-out request?
            </DialogDescription>
          </DialogHeader>

          {selectedEarlyOutLog && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm"><strong>Employee:</strong> {selectedEarlyOutLog.employee}</p>
                <p className="text-sm"><strong>Date:</strong> {selectedEarlyOutLog.date}</p>
                <p className="text-sm"><strong>Shift:</strong> {selectedEarlyOutLog.shift}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Notes (Optional)</label>
                <Textarea
                  value={earlyOutActionNotes}
                  onChange={(e) => setEarlyOutActionNotes(e.target.value.slice(0, 1000))}
                  placeholder="Optionally add approval notes (maximum 1000 characters)."
                  className="mt-1"
                  rows={3}
                  maxLength={1000}
                />
                <p className="mt-1 text-xs text-muted-foreground">{earlyOutActionNotes.length}/1000 characters</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEarlyOutApproveModalOpen(false)}
              disabled={earlyOutSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmApproveEarlyOut}
              className="bg-green-600 hover:bg-green-700"
              disabled={earlyOutSubmitting}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {earlyOutSubmitting ? 'Approving...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={earlyOutRejectModalOpen} onOpenChange={setEarlyOutRejectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Early Out Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this early-out request?
            </DialogDescription>
          </DialogHeader>

          {selectedEarlyOutLog && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm"><strong>Employee:</strong> {selectedEarlyOutLog.employee}</p>
                <p className="text-sm"><strong>Date:</strong> {selectedEarlyOutLog.date}</p>
                <p className="text-sm"><strong>Shift:</strong> {selectedEarlyOutLog.shift}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Rejection Reason *</label>
                <Textarea
                  value={earlyOutActionNotes}
                  onChange={(e) => setEarlyOutActionNotes(e.target.value.slice(0, 1000))}
                  placeholder="Clearly explain why this request is being rejected (maximum 1000 characters)."
                  className="mt-1"
                  rows={3}
                  maxLength={1000}
                />
                <p className="mt-1 text-xs text-muted-foreground">{earlyOutActionNotes.length}/1000 characters</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEarlyOutRejectModalOpen(false)}
              disabled={earlyOutSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmRejectEarlyOut}
              className="bg-red-600 hover:bg-red-700"
              disabled={earlyOutSubmitting || !earlyOutActionNotes.trim()}
            >
              <XCircle className="h-4 w-4 mr-2" />
              {earlyOutSubmitting ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LogDetailsModal
        open={viewModalOpen}
        onOpenChange={(open) => {
          setViewModalOpen(open);
          if (!open) {
            setSelectedViewLog(null);
          }
        }}
        log={selectedViewLog}
        title="Time Clock Log Details"
        description="Detailed information of the selected time clock log."
      />
    </div>
  );
}
