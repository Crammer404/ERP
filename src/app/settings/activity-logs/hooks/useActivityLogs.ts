'use client';

import { useState, useEffect } from 'react';
import { fetchActivityLogs, ActivityLog, ActivityLogsResponse } from '../services/activityLogService';
import { toast } from "@/hooks/use-toast";

// Global cache for activity logs data
let activityLogsCache: Map<string, { logs: ActivityLog[], pagination: ActivityLogsResponse['data'] }> = new Map();
let activityLogsCacheTimestamp: number | null = null;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes in milliseconds

export function useActivityLogs() {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<ActivityLogsResponse['data']>({
    current_page: 1,
    data: [],
    first_page_url: '',
    from: null,
    last_page: 1,
    last_page_url: '',
    links: [],
    next_page_url: null,
    path: '',
    per_page: 15,
    prev_page_url: null,
    to: null,
    total: 0,
  });

  const showToast = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string
  ) => {
    toast({
      title,
      description: message,
      variant:
        type === "error" ? "destructive" : type === "success" ? "success" : "default",
    });
  };

  const loadActivityLogs = async (page: number = 1, perPage: number = 15, search: string = '') => {
    try {
      setLoading(true);
      setError(null);

      // Check if we have valid cached data
      const cacheKey = `${page}-${perPage}-${search}`;
      const now = Date.now();
      if (activityLogsCache.has(cacheKey) && activityLogsCacheTimestamp && (now - activityLogsCacheTimestamp) < CACHE_DURATION) {
        console.log('Using cached activity logs data');
        const cachedData = activityLogsCache.get(cacheKey)!;
        setActivityLogs(cachedData.logs);
        setPagination(cachedData.pagination);
        setLoading(false);
        return;
      }

      const response = await fetchActivityLogs(page, perPage, search);
      console.log('Fetch activity logs response:', response);

      // Cache the data
      const data = response.data;
      const logs = Array.isArray(data.data) ? data.data : [];
      activityLogsCache.set(cacheKey, {
        logs,
        pagination: data
      });
      activityLogsCacheTimestamp = now;

      setActivityLogs(logs);
      setPagination(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch activity logs');
      setActivityLogs([]);
      setPagination({
        current_page: 1,
        data: [],
        first_page_url: '',
        from: null,
        last_page: 1,
        last_page_url: '',
        links: [],
        next_page_url: null,
        path: '',
        per_page: perPage,
        prev_page_url: null,
        to: null,
        total: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshActivityLogs = async (page: number = 1, perPage: number = 15, search: string = ''): Promise<void> => {
    // Invalidate cache and reload
    activityLogsCache.clear();
    activityLogsCacheTimestamp = null;
    await loadActivityLogs(page, perPage, search);
  };

  useEffect(() => {
    loadActivityLogs();
  }, []);

  return {
    activityLogs,
    loading,
    error,
    pagination,
    refreshActivityLogs,
    loadActivityLogs
  };
}

// Function to invalidate activity logs cache (call this after creating new logs if needed)
export function invalidateActivityLogsCache() {
  activityLogsCache.clear();
  activityLogsCacheTimestamp = null;
  console.log('Activity logs cache invalidated');
}