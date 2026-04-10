'use client';

import { useState, useEffect, useRef } from 'react';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteLogDialog } from './components/delete-log-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Download, Smartphone, X, Clock, RefreshCw, Edit, CirclePlus, MoreVertical, Trash2, ChevronLeft, ChevronRight, Archive } from 'lucide-react';
import { getTimeClockLogs, clock as clockApi, exportTimesheet, DtrLogResponseItem, deleteManualLog, reopenForOvertime, restoreManualLog, forceDeleteManualLog } from '@/services/hrms/dtr';
import { useToast } from '@/hooks/use-toast';
import { Loader } from '@/components/ui/loader';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/components/providers/auth-provider';
import { ManualLogModal, ManualLogData } from './components/manual-log-modal';
import { Badge } from '@/components/ui/badge';
import { SHIFT_COLOR_CLASSES } from '@/config/colors.config';
import { TimeDisplay } from './components/time-display';
import { ScanConfirmDialog, ScanConfirmData, ScanErrorDialog, OvertimeConfirmDialog, OvertimePromptData } from './components/scan-result-dialog';

interface TimeClockLog {
  id: number;
  userId: number;
  date: string;
  dateRaw: string;
  deletedAt: string | null;
  employee: string;
  branch: string;
  scheduleName: string;
  shift: string;
  clockIn: string;
  clockOut: string;
  late: string;
  overtime: string;
  actualHours: string;
  totalWorkHours: string;
  clockInRaw: string | null;
  clockOutRaw: string | null;
}

interface CachedPageData {
  logs: TimeClockLog[];
  totalItems: number;
  totalPages: number;
  pageFrom: number;
  pageTo: number;
  earliestLogDate?: Date;
}

export default function TimeClockPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedShift, setSelectedShift] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isScanning, setIsScanning] = useState(false);
  const [isScannerPanelCollapsed, setIsScannerPanelCollapsed] = useState(false);
  const [logs, setLogs] = useState<TimeClockLog[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageFrom, setPageFrom] = useState(0);
  const [pageTo, setPageTo] = useState(0);
  const [loading, setLoading] = useState(false);
  const [clocking, setClocking] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportDateRange, setExportDateRange] = useState<DateRange | undefined>();
  const [userIdInput, setUserIdInput] = useState('');
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [isModalShaking, setIsModalShaking] = useState(false);
  const [earliestLogDate, setEarliestLogDate] = useState<Date | undefined>();
  const scannerRef = useRef<any>(null);
  const scannerResetTimeoutRef = useRef<number | null>(null);
  const isProcessingScanRef = useRef(false);
  const prevFilterKeyRef = useRef<string>('');
  const pageCacheRef = useRef<Map<string, CachedPageData>>(new Map());
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logModalMode, setLogModalMode] = useState<'add' | 'edit'>('add');
  const [activeLog, setActiveLog] = useState<ManualLogData | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState<TimeClockLog | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [scanConfirmOpen, setScanConfirmOpen] = useState(false);
  const [scanConfirmData, setScanConfirmData] = useState<ScanConfirmData | null>(null);
  const [scanErrorOpen, setScanErrorOpen] = useState(false);
  const [scanErrorMessage, setScanErrorMessage] = useState('');
  const [overtimeConfirmOpen, setOvertimeConfirmOpen] = useState(false);
  const [overtimeConfirmData, setOvertimeConfirmData] = useState<OvertimePromptData | null>(null);
  const [overtimeConfirming, setOvertimeConfirming] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'archive'>('active');
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [logToRestore, setLogToRestore] = useState<TimeClockLog | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [forceDeleteConfirmOpen, setForceDeleteConfirmOpen] = useState(false);
  const [logToForceDelete, setLogToForceDelete] = useState<TimeClockLog | null>(null);
  const [forceDeleting, setForceDeleting] = useState(false);

  const today = new Date();
  const tabsGridClass = 'grid-cols-2';

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

      let hours = 0;
      let minutes = 0;

      if (value < 48) {
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

    const toNum = (value: any): number | null => {
      if (value === null || value === undefined) return null;
      const parsed = typeof value === 'number' ? value : parseFloat(String(value));
      return Number.isNaN(parsed) ? null : parsed;
    };

    const formatLateMinutes = (
      late: number | string | null | undefined,
      grace: number | string | null | undefined
    ): string => {
      const lateMinutes = toNum(late) ?? 0;
      const graceMinutes = toNum(grace) ?? 0;

      if (lateMinutes <= 0) return '-';
      if (graceMinutes > 0 && lateMinutes <= graceMinutes) return '-';

      return `${lateMinutes} min`;
    };

    const formatOvertimeMinutes = (
      overtime: number | string | null | undefined,
      grace: number | string | null | undefined
    ): string => {
      const overtimeMin = toNum(overtime) ?? 0;
      const graceMin = toNum(grace) ?? 0;

      if (overtimeMin <= 0) return '-';
      if (graceMin > 0 && overtimeMin <= graceMin) return '-';

      return `${overtimeMin} min`;
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
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
    };

    const toDate = (dateStr: string): string => {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      return item.date;
    };

    const nestedFirst = (item.user as any)?.user_info?.first_name;
    const nestedLast = (item.user as any)?.user_info?.last_name;
    const employeeName = item.user?.name
      || [item.user?.first_name, item.user?.last_name].filter(Boolean).join(' ')
      || [nestedFirst, nestedLast].filter(Boolean).join(' ')
      || `#${item.user_id}`;

    const branchName = item.user?.branch_users?.[0]?.branch?.name || '-';
    const scheduleName = item.schedule_name || '-';

    return {
      id: item.id,
      userId: item.user_id,
      date: toDate(item.date),
      dateRaw: item.date,
      deletedAt: item.deleted_at || null,
      employee: employeeName,
      branch: branchName,
      scheduleName: scheduleName,
      shift: item.shift || '-',
      clockIn: toTime(item.clock_in),
      clockOut: toTime(item.clock_out),
      overtime: formatOvertimeMinutes(item.overtime_minutes, item.grace_overtime_minutes),
      actualHours: formatHoursAndMinutes(item.actual_hours, item.cleaned_total_work_hours),
      totalWorkHours: formatHoursAndMinutes(item.total_work_hours),
      late: formatLateMinutes(item.late_minutes, item.grace_late_minutes),
      clockInRaw: item.clock_in,
      clockOutRaw: item.clock_out,
    };
  };

  const toApiDate = (date?: Date): string | undefined => {
    if (!date) return undefined;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const clearLogsCache = () => {
    pageCacheRef.current.clear();
  };

  const clearScannerResetTimeout = () => {
    if (scannerResetTimeoutRef.current !== null) {
      window.clearTimeout(scannerResetTimeoutRef.current);
      scannerResetTimeoutRef.current = null;
    }
  };

  const pauseScanner = () => {
    const scannerInstance = scannerRef.current;
    if (!scannerInstance) return;
    try {
      // Html5QrcodeScanner.pause(true) pauses scanning AND freezes the video frame
      scannerInstance.pause(true);
    } catch {}
  };

  const clearScannerInstance = () => {
    const scannerInstance = scannerRef.current;
    if (!scannerInstance) return;
    scannerRef.current = null;
    try {
      const clearResult = scannerInstance.clear();
      if (clearResult && typeof clearResult.then === 'function') {
        clearResult.catch(() => {});
      }
    } catch {}
  };

  const getQrFileInput = (): HTMLInputElement | null => {
    return document.getElementById('html5-qrcode-private-filescan-input') as HTMLInputElement | null;
  };

  const clearQrFileInput = () => {
    const fileInput = getQrFileInput();
    if (!fileInput) return;
    fileInput.value = '';
  };

  const isFileScanMode = (): boolean => {
    const fileInput = getQrFileInput();
    return Boolean(fileInput && !fileInput.disabled);
  };

  const resetScanProcessingState = () => {
    isProcessingScanRef.current = false;
    setIsProcessingScan(false);
    clearQrFileInput();
  };

  const scheduleScanReset = (mounted: boolean) => {
    clearScannerResetTimeout();
    scannerResetTimeoutRef.current = window.setTimeout(() => {
      scannerResetTimeoutRef.current = null;
      if (!mounted) return;
      resetScanProcessingState();
    }, 1200);
  };

  const applyPageData = (snapshot: CachedPageData) => {
    setLogs(snapshot.logs);
    setTotalItems(snapshot.totalItems);
    setTotalPages(snapshot.totalPages);
    setPageFrom(snapshot.pageFrom);
    setPageTo(snapshot.pageTo);
    setEarliestLogDate(snapshot.earliestLogDate);
  };

  const fetchLogs = async (overrides?: { page?: number; perPage?: number; force?: boolean; tab?: 'active' | 'archive' }) => {
    try {
      const page = overrides?.page ?? currentPage;
      const perPage = overrides?.perPage ?? itemsPerPage;
      const forceRefresh = overrides?.force ?? false;
      const tab = overrides?.tab ?? activeTab;
      const cacheKey = [
        tab,
        page,
        perPage,
        debouncedSearch.trim().toLowerCase(),
        selectedShift,
        toApiDate(dateRange?.from) || '',
        toApiDate(dateRange?.to) || '',
      ].join('|');

      if (!forceRefresh) {
        const cachedPage = pageCacheRef.current.get(cacheKey);
        if (cachedPage) {
          applyPageData(cachedPage);
          return;
        }
      }

      setLoading(true);
      const search = debouncedSearch.trim();
      const response: any = await getTimeClockLogs({
        page,
        per_page: perPage,
        search: search || undefined,
        shift: selectedShift !== 'all' ? selectedShift : undefined,
        start_date: toApiDate(dateRange?.from),
        end_date: toApiDate(dateRange?.to),
        archived: tab === 'archive',
      });

      const isPaginatedShape = response && !Array.isArray(response) && Array.isArray(response.data);
      const rawLogs: DtrLogResponseItem[] = isPaginatedShape
        ? response.data
        : Array.isArray(response)
          ? response
          : [];

      const slicedLogs = isPaginatedShape
        ? rawLogs
        : rawLogs.slice((page - 1) * perPage, page * perPage);

      const mappedLogs = slicedLogs.map(mapLog);

      let snapshot: CachedPageData;
      if (isPaginatedShape) {
        const total = response.meta?.total || 0;
        const pages = response.meta?.last_page || 1;
        const from = response.meta?.from || 0;
        const to = response.meta?.to || 0;
        const earliestDateRaw = response.filters?.earliest_log_date;
        let earliest: Date | undefined;
        if (earliestDateRaw) {
          const parsed = new Date(earliestDateRaw);
          earliest = Number.isNaN(parsed.getTime()) ? undefined : parsed;
        }

        snapshot = {
          logs: mappedLogs,
          totalItems: total,
          totalPages: pages,
          pageFrom: from,
          pageTo: to,
          earliestLogDate: earliest,
        };
      } else {
        const total = rawLogs.length;
        const from = total > 0 ? (page - 1) * perPage + 1 : 0;
        const to = Math.min(page * perPage, total);
        const pages = Math.max(1, Math.ceil(total / perPage));
        const earliest = rawLogs
          .map((item) => new Date(item.date).getTime())
          .filter((value) => Number.isFinite(value))
          .sort((a, b) => a - b)[0];

        snapshot = {
          logs: mappedLogs,
          totalItems: total,
          totalPages: pages,
          pageFrom: from,
          pageTo: to,
          earliestLogDate: typeof earliest === 'number' ? new Date(earliest) : undefined,
        };
      }

      pageCacheRef.current.set(cacheKey, snapshot);
      applyPageData(snapshot);
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

  const handleTabChange = (value: string) => {
    const nextTab = (value === 'archive' ? 'archive' : 'active') as 'active' | 'archive';
    if (nextTab === activeTab) {
      return;
    }
    clearLogsCache();
    setActiveTab(nextTab);
    if (currentPage === 1) {
      fetchLogs({ page: 1, force: true, tab: nextTab });
      return;
    }
    setCurrentPage(1);
  };

  useEffect(() => {
    setIsScanning(true);
  }, []);

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
  }, [currentPage, itemsPerPage, debouncedSearch, selectedShift, dateRange?.from?.getTime(), dateRange?.to?.getTime()]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Debounce search input — only update debouncedSearch after 500ms of no typing
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchTerm]);

  useEffect(() => {
    isProcessingScanRef.current = isProcessingScan;
  }, [isProcessingScan]);

  useEffect(() => {
    if (isScannerPanelCollapsed) {
      clearScannerResetTimeout();
      isProcessingScanRef.current = false;
      setIsProcessingScan(false);
      clearQrFileInput();
    }
  }, [isScannerPanelCollapsed]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (!isScanning || isScannerPanelCollapsed) return;
      if (!document.getElementById('timeclock-qr-reader')) return;
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
          if (!mounted || isProcessingScanRef.current) return;
          
          isProcessingScanRef.current = true;
          setIsProcessingScan(true);
          // Immediately pause scanning to prevent any further decode callbacks
          pauseScanner();
          
          let dialogOpened = false;
          try {
            let userId: number | null = null;
            
            try {
              const qrData = JSON.parse(decodedText);
              userId = qrData.id;
            } catch {
              const match = decodedText.match(/\d+/);
              if (match) {
                userId = parseInt(match[0], 10);
              }
            }
            
            if (userId) {
              dialogOpened = await handleClockWithUserId(userId, true);
            } else {
              // Show error dialog for invalid QR codes too
              pauseScanner();
              clearScannerResetTimeout();
              clearScannerInstance();
              setIsScanning(false);
              setScanErrorMessage('QR code does not contain a valid user ID.');
              setScanErrorOpen(true);
              dialogOpened = true;
            }
          } finally {
            if (!dialogOpened) {
              scheduleScanReset(mounted);
            }
          }
        };

        const onScanFailure = () => {
          if (!isFileScanMode()) return;
          clearScannerResetTimeout();
          resetScanProcessingState();
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
      clearScannerResetTimeout();
      isProcessingScanRef.current = false;
      clearScannerInstance();
    };
  }, [isScanning, isScannerPanelCollapsed]);

  const hasDateFilter = Boolean(dateRange?.from || dateRange?.to);
  const filterKey = [
    debouncedSearch.trim().toLowerCase(),
    selectedShift,
    toApiDate(dateRange?.from) || '',
    toApiDate(dateRange?.to) || '',
    itemsPerPage,
  ].join('|');

  useEffect(() => {
    const filtersChanged = prevFilterKeyRef.current !== filterKey;
    prevFilterKeyRef.current = filterKey;

    if (filtersChanged && currentPage !== 1) {
      setCurrentPage(1);
      return;
    }

    fetchLogs();
  }, [currentPage, filterKey, activeTab]);

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
    setDebouncedSearch('');
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
    setDateRange(undefined);
    setSelectedShift('all');
    setCurrentPage(1);
    setActiveTab('active');

    if (!hasChanges) {
      fetchLogs({ page: 1, force: true });
    }
  };

  const toDaysLeft = (deletedAt: string | null): number | null => {
    if (!deletedAt) return null;
    const parse = (raw: string): Date | null => {
      const d = new Date(raw);
      if (!Number.isNaN(d.getTime())) return d;
      const normalized = raw.includes(' ') ? raw.replace(' ', 'T') : raw;
      const d2 = new Date(normalized);
      if (!Number.isNaN(d2.getTime())) return d2;
      return null;
    };
    const deleted = parse(deletedAt);
    if (!deleted) return null;
    const diffMs = Date.now() - deleted.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, 90 - diffDays);
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
    setIsScanning(true);
  };

  const handleStopScanning = () => {
    clearScannerResetTimeout();
    setIsScanning(false);
    isProcessingScanRef.current = false;
    setIsProcessingScan(false);
    clearQrFileInput();
  };

  const handleRestartScanning = async () => {
    clearScannerResetTimeout();
    setIsScanning(false);
    isProcessingScanRef.current = false;
    setIsProcessingScan(false);
    clearQrFileInput();
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setIsScanning(true);
  };

  const handleScanImage = () => {
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

  const handleClockWithUserId = async (uid: number, fromScanner = false): Promise<boolean> => {
    if (!uid || uid <= 0) {
      toast({
        title: 'Invalid User ID',
        description: 'Please provide a valid user ID.',
        variant: 'destructive',
      });
      return false;
    }
    setClocking(true);
    try {
      const res = await clockApi(uid);

      // Handle overtime prompt — the backend detected a completed shift for today
      if (res?.status === 'overtime_prompt') {
        const promptData: OvertimePromptData = {
          employeeName: res.employee_name || `User #${uid}`,
          logId: res.log_id,
          userId: uid,
          shift: res.shift || '-',
          clockIn: res.clock_in || '-',
          clockOut: res.clock_out || '-',
          date: res.date || new Date().toISOString().slice(0, 10),
        };

        if (fromScanner) {
          pauseScanner();
          clearScannerResetTimeout();
          clearScannerInstance();
          setIsScanning(false);
        }

        setOvertimeConfirmData(promptData);
        setOvertimeConfirmOpen(true);
        return true; // dialog opened
      }
      
      if (res?.status === 'error') {
        const shouldRefreshLogs = Boolean(res?.refresh_logs || res?.dead_time_deleted);
        if (shouldRefreshLogs) {
          clearLogsCache();
          try {
            await fetchLogs({ force: true });
          } catch {}
        }

        const msg = res?.message || 'Clock action failed';
        if (fromScanner) {
          pauseScanner();
          clearScannerResetTimeout();
          clearScannerInstance();
          setIsScanning(false);
          setScanErrorMessage(msg);
          setScanErrorOpen(true);
          return true;
        }
        toast({
          title: 'Error',
          description: msg,
          variant: 'destructive',
        });
        return false;
      }

      clearLogsCache();
      await fetchLogs({ force: true });

      if (fromScanner) {
        const now = new Date();
        setScanConfirmData({
          employeeName: res?.employee_name || `User #${uid}`,
          action: res?.action || (res?.clock_in ? 'Clock In' : 'Clock Out'),
          time: res?.time || now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        });
        // Immediately pause scanning (freezes camera frame, stops decoding)
        pauseScanner();
        // Then fully tear down the scanner and camera
        clearScannerResetTimeout();
        clearScannerInstance();
        setIsScanning(false);
        setScanConfirmOpen(true);
        return true;
      }

      const msg = res?.message || 'Clock action completed';
      toast({
        title: 'Success',
        description: msg,
        variant: 'default',
      });
      return false;
    } catch (e: any) {
      const responseData = e?.response?.data;
      const shouldRefreshLogs = Boolean(responseData?.refresh_logs || responseData?.dead_time_deleted);
      if (shouldRefreshLogs) {
        clearLogsCache();
        try {
          await fetchLogs({ force: true });
        } catch {}
      }

      const validationErrors = responseData?.errors
        ? Object.values(responseData.errors).flat().filter(Boolean).join(' ')
        : '';
      const apiErr = responseData?.message || validationErrors || e?.message || 'Clock action failed';
      if (fromScanner) {
        pauseScanner();
        clearScannerResetTimeout();
        clearScannerInstance();
        setIsScanning(false);
        setScanErrorMessage(apiErr);
        setScanErrorOpen(true);
        return true;
      }
      toast({
        title: 'Error',
        description: apiErr,
        variant: 'destructive',
      });
      return false;
    } finally {
      setClocking(false);
    }
  };

  const handleClock = async () => {
    const uid = parseInt(userIdInput, 10);
    await handleClockWithUserId(uid);
  };

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
    if (!overtimeConfirmData) return;
    setOvertimeConfirming(true);
    try {
      const res = await reopenForOvertime({
        user_id: overtimeConfirmData.userId,
        log_id: overtimeConfirmData.logId,
      });

      if (res?.status === 'error') {
        toast({
          title: 'Error',
          description: res?.message || 'Failed to reopen shift for overtime.',
          variant: 'destructive',
        });
      } else {
        // Show the success scan-confirm dialog with the reopened shift info
        setScanConfirmData({
          employeeName: res?.employee_name || overtimeConfirmData.employeeName,
          action: res?.action || 'Clock In (Overtime)',
          time: res?.time || new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }),
        });
        clearLogsCache();
        await fetchLogs({ force: true });
        setScanConfirmOpen(true);
      }
    } catch (e: any) {
      const apiErr = e?.response?.data?.message || e?.message || 'Failed to reopen shift for overtime.';
      toast({
        title: 'Error',
        description: apiErr,
        variant: 'destructive',
      });
    } finally {
      setOvertimeConfirming(false);
      setOvertimeConfirmOpen(false);
      setOvertimeConfirmData(null);
    }
  };

  const handleOvertimeCancel = () => {
    setOvertimeConfirmOpen(false);
    setOvertimeConfirmData(null);
    resetScanProcessingState();
    // Restart the scanner after cancellation
    setIsScanning(true);
  };

  const handleModalOutsideClick = () => {
    console.log('Outside click detected - triggering shake effect');
    setIsModalShaking(true);
    setTimeout(() => setIsModalShaking(false), 600);
  };

  const canManageLogs = (): boolean => {
    if (!user?.role_name) return false;
    const roleName = user.role_name.toLowerCase();
    return roleName === 'super admin' || roleName === 'system admin' || roleName === 'tenant manager' || roleName === 'owner';
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


  return (
    <div className="container mx-auto py-6 px-4 overflow-x-hidden">
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full max-w-full overflow-x-hidden">
        {/* Left Section: Collapsible QR Scanner Panel */}
        <div
          className={`shrink-0 min-w-0 transition-all duration-300 ease-in-out ${
            isScannerPanelCollapsed ? 'w-full lg:w-14' : 'w-full lg:w-[320px]'
          }`}
        >
          <Card className="h-fit overflow-hidden">
            <CardHeader className={`flex flex-row items-center ${isScannerPanelCollapsed ? 'justify-center p-2' : 'justify-between'}`}>
              {!isScannerPanelCollapsed && <CardTitle>QR Scanner</CardTitle>}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsScannerPanelCollapsed(prev => !prev)}
                aria-label={isScannerPanelCollapsed ? 'Expand scanner panel' : 'Collapse scanner panel'}
              >
                {isScannerPanelCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </CardHeader>

            {!isScannerPanelCollapsed && (
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
            )}
          </Card>
        </div>

        {/* Main Section: Time Clock Records */}
        <div className="flex-1 min-w-0 w-full">
       <Card className="w-full">
        <CardHeader>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-4 w-full min-w-0">
            {/* Export Button */}
            <Button 
              variant="default" 
              className="bg-green-600 hover:bg-green-700 shrink-0"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            {/* Search Input */}
            <Input
              placeholder="Search Name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:flex-1 sm:min-w-[100px]"
            />
            {/* Date Range Picker */}
            <DateRangePicker
              date={dateRange}
              onDateChange={setDateRange}
              placeholder="Select Date Range"
              className="w-full sm:flex-1 sm:min-w-[120px]"
            />
            {/* Shift Filter */}
            <Select value={selectedShift} onValueChange={setSelectedShift}>
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
            {/* Refresh Button */}
            <Button
              className="w-full sm:w-auto flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white sm:flex-none shrink-0"
              variant="default" 
              onClick={handleRefresh}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Clear Filters
            </Button>
            {/* Add Log Button */}
            {canManageLogs() && (
              <Button 
                variant="default" 
                className="bg-blue-600 hover:bg-blue-700 shrink-0"
                onClick={handleAddLog}
              >
                <CirclePlus className="h-4 w-4 mr-2" />
                Add Log
              </Button>
            )}

          </div>

          {canManageLogs() && (
            <div className="pt-3">
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className={`grid w-full mb-6 ${tabsGridClass}`}>
                  <TabsTrigger value="active" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Active
                  </TabsTrigger>
                  <TabsTrigger value="archive" className="flex items-center gap-2">
                    <Archive className="h-4 w-4" />
                    Archive
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {/* Table */}
           <div className="rounded-md border w-full overflow-x-auto">
             <Table className="min-w-[980px]">
               <TableHeader className="[&_th]:text-[11px] [&_th]:font-medium">
                 <TableRow>
                   <TableHead>Date</TableHead>
                   {activeTab === 'archive' && <TableHead>Days Left</TableHead>}
                   <TableHead>Employee</TableHead>
                   <TableHead>Branch</TableHead>
                   <TableHead>Shift</TableHead>
                   <TableHead>Clock In</TableHead>
                   <TableHead>Clock Out</TableHead>
                   <TableHead>Late</TableHead>
                   <TableHead>Overtime</TableHead>
                   <TableHead>Actual Work Hours</TableHead>
                   <TableHead>Total Work Hours</TableHead>
                   {canManageLogs() && <TableHead>Action</TableHead>}
                 </TableRow>
               </TableHeader>
               <TableBody className="[&_td]:text-[11px]">
                 {loading ? (
                   <TableRow>
                    <TableCell colSpan={canManageLogs() ? 11 : 10} className="text-center py-8">
                       <Loader size="sm" />
                     </TableCell>
                   </TableRow>
                 ) : logs.length > 0 ? (
                   logs.map((log) => (
                     <TableRow key={log.id}>
                       <TableCell>{log.date}</TableCell>
                       {activeTab === 'archive' && (
                         <TableCell>{toDaysLeft(log.deletedAt) ?? '-'}</TableCell>
                       )}
                       <TableCell className="font-medium">{log.employee}</TableCell>
                       <TableCell>
                         <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10 text-[10px] font-medium rounded-md px-2 py-0.5">
                           {log.branch}
                         </Badge>
                       </TableCell>
                       <TableCell>
                         <span className={SHIFT_COLOR_CLASSES[log.shift] || ''}>
                           {log.shift}
                         </span>
                       </TableCell>
                       <TableCell><TimeDisplay value={log.clockIn} /></TableCell>
                       <TableCell><TimeDisplay value={log.clockOut} /></TableCell>
                       <TableCell>{log.late}</TableCell>
                       <TableCell>{log.overtime}</TableCell>
                       <TableCell>{log.actualHours}</TableCell>
                       <TableCell>{log.totalWorkHours}</TableCell>
                       {canManageLogs() && (
                         <TableCell>
                           <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                               <Button variant="ghost" size="icon" className="h-8 w-8">
                                 <MoreVertical className="h-4 w-4" />
                               </Button>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent align="end">
                               {activeTab === 'archive' ? (
                                 <>
                                   <DropdownMenuItem onClick={() => handleRestoreLog(log)}>
                                     Restore
                                   </DropdownMenuItem>
                                   <DropdownMenuItem
                                     onClick={() => handleForceDeleteLog(log)}
                                     className="text-destructive"
                                   >
                                     Delete permanently
                                   </DropdownMenuItem>
                                 </>
                               ) : (
                                 <>
                               <DropdownMenuItem onClick={() => handleEditLog(log)}>
                                 <Edit className="mr-2 h-4 w-4" />
                                 Edit
                               </DropdownMenuItem>
                               <DropdownMenuItem 
                                 onClick={() => handleDeleteLog(log)}
                                 className="text-destructive"
                               >
                                 <Trash2 className="mr-2 h-4 w-4" />
                                 Delete
                               </DropdownMenuItem>
                                 </>
                               )}
                             </DropdownMenuContent>
                           </DropdownMenu>
                         </TableCell>
                       )}
                     </TableRow>
                   ))
                 ) : (
                   <TableRow>
                    <TableCell colSpan={canManageLogs() ? 11 : 10} className="p-0">
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
          onSuccess={async () => {
            clearLogsCache();
            await fetchLogs({ force: true });
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
    </div>
  );
}
