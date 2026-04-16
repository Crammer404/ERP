import { useEffect, useRef, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { getTimeClockLogs } from '@/services/hrms/dtr';
import type { CachedPageData, TimeClockLog } from '../types';
import { mapTimeClockLog } from '../utils/log-mappers';
import { toApiDate } from '../utils/date-utils';

export type TimeClockTab = 'active' | 'early_out' | 'archive';

interface UseTimeClockLogsOptions {
  onError: (message: string) => void;
}

export function useTimeClockLogs({ onError }: UseTimeClockLogsOptions) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedShift, setSelectedShift] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState<TimeClockTab>('active');
  const [logs, setLogs] = useState<TimeClockLog[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageFrom, setPageFrom] = useState(0);
  const [pageTo, setPageTo] = useState(0);
  const [loading, setLoading] = useState(false);
  const [earliestLogDate, setEarliestLogDate] = useState<Date | undefined>();
  const [earlyOutPendingCount, setEarlyOutPendingCount] = useState(0);
  const prevFilterKeyRef = useRef<string>('');
  const pageCacheRef = useRef<Map<string, CachedPageData>>(new Map());

  const clearLogsCache = () => {
    pageCacheRef.current.clear();
  };

  const applyPageData = (snapshot: CachedPageData) => {
    setLogs(snapshot.logs);
    setTotalItems(snapshot.totalItems);
    setTotalPages(snapshot.totalPages);
    setPageFrom(snapshot.pageFrom);
    setPageTo(snapshot.pageTo);
    setEarliestLogDate(snapshot.earliestLogDate);
  };

  const fetchLogs = async (overrides?: { page?: number; perPage?: number; force?: boolean; tab?: TimeClockTab }) => {
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
        early_out: tab === 'early_out',
      });

      const isPaginatedShape = response && !Array.isArray(response) && Array.isArray(response.data);
      const rawLogs = isPaginatedShape ? response.data : Array.isArray(response) ? response : [];
      const slicedLogs = isPaginatedShape ? rawLogs : rawLogs.slice((page - 1) * perPage, page * perPage);
      const mappedLogs = slicedLogs.map(mapTimeClockLog);

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
        if (tab === 'early_out') {
          setEarlyOutPendingCount(Number(response.filters?.pending_count || 0));
        }

        snapshot = { logs: mappedLogs, totalItems: total, totalPages: pages, pageFrom: from, pageTo: to, earliestLogDate: earliest };
      } else {
        const total = rawLogs.length;
        const from = total > 0 ? (page - 1) * perPage + 1 : 0;
        const to = Math.min(page * perPage, total);
        const pages = Math.max(1, Math.ceil(total / perPage));
        const earliest = rawLogs
          .map((item: any) => new Date(item.date).getTime())
          .filter((value: number) => Number.isFinite(value))
          .sort((a: number, b: number) => a - b)[0];

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
      onError(apiErr);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    const nextTab = (value === 'archive' ? 'archive' : value === 'early_out' ? 'early_out' : 'active') as TimeClockTab;
    if (nextTab === activeTab) return;

    clearLogsCache();
    setActiveTab(nextTab);
    if (currentPage === 1) {
      fetchLogs({ page: 1, force: true, tab: nextTab });
      return;
    }
    setCurrentPage(1);
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filterKey, activeTab]);

  return {
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
  };
}

