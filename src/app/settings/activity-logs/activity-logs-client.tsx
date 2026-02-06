'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw } from 'lucide-react';
import { ActivityLogsTable } from './components/ActivityLogsTable';
import { useActivityLogs } from './hooks/useActivityLogs';

export function ActivityLogsClient() {
  const [isMounted, setIsMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Custom hooks
  const { activityLogs, loading, error, pagination, refreshActivityLogs, loadActivityLogs } = useActivityLogs();

  // Filter activity logs based on search term (client-side for now, can be moved to server)
  const filteredActivityLogs = (activityLogs || []).filter(log =>
    log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.created_by.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Refresh handler
  const handleRefresh = () => {
    setSearchTerm('');
    refreshActivityLogs(currentPage, pagination.per_page, searchTerm);
    setRefreshKey(prev => prev + 1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadActivityLogs(page, pagination.per_page, searchTerm);
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    loadActivityLogs(1, pagination.per_page, value);
  };

  useEffect(() => {
    setIsMounted(true);

    // Listen for branch change event to refresh activity logs
    const handleBranchChange = () => {
      console.log('Branch changed, refreshing activity logs');
      refreshActivityLogs(currentPage, pagination.per_page, searchTerm);
    };

    window.addEventListener('branchChanged', handleBranchChange);

    return () => {
      window.removeEventListener('branchChanged', handleBranchChange);
    };
  }, [currentPage, pagination.per_page, searchTerm]);

  if (!isMounted || loading) {
    return (
      <div className="text-center py-20 col-span-full">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-muted-foreground font-medium">Loading Activity Logs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="py-20 text-center">
        <CardContent>
          <p className="text-red-500">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-transparent border-none shadow-none">
        <CardContent>
          {/* Search + Actions */}
          <div className="flex items-center gap-4 mt-6 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search activity logs..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={loading}
              className="h-10 w-10"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Activity Logs</CardTitle>
                  <CardDescription>View all activity logs in the system.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredActivityLogs.length === 0 ? (
                <p className="text-muted-foreground">No activity logs found.</p>
              ) : (
                <ActivityLogsTable
                  activityLogs={filteredActivityLogs}
                  pagination={pagination}
                  currentPage={currentPage}
                  setCurrentPage={handlePageChange}
                />
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}