'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FileText, RefreshCw, Search } from 'lucide-react';
import { ActivityLogsTable } from './components/ActivityLogsTable';
import { ActivityLogDetailsModal } from './components/ActivityLogDetailsModal';
import { useActivityLogs } from './hooks/useActivityLogs';
import { ActivityLog } from './services/activityLogService';

export default function ActivityLogsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { activityLogs, loading, error, pagination, refreshActivityLogs, loadActivityLogs } = useActivityLogs();

  const filteredActivityLogs = (activityLogs || []).filter(log =>
    log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.created_by.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRefresh = () => {
    setSearchTerm('');
    refreshActivityLogs(currentPage, pagination.per_page, '');
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadActivityLogs(page, pagination.per_page, searchTerm);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    loadActivityLogs(1, pagination.per_page, value);
  };

  const handleViewDetails = (log: ActivityLog) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  useEffect(() => {
    setIsMounted(true);

    const handleBranchChange = () => {
      console.log('Branch changed, refreshing activity logs');
      refreshActivityLogs(currentPage, pagination.per_page, searchTerm);
    };

    window.addEventListener('branchChanged', handleBranchChange);

    return () => {
      window.removeEventListener('branchChanged', handleBranchChange);
    };
  }, [currentPage, pagination.per_page, refreshActivityLogs, searchTerm]);

  console.log('Activity Logs page loaded at /settings/activity-logs');

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-headline">Activity Logs</h1>
          <p className="text-sm text-muted-foreground">
            View and monitor all activity logs in the system.
          </p>
        </div>
      </div>

      {!isMounted || loading ? (
        <div className="text-center py-20 col-span-full">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-muted-foreground font-medium">Loading Activity Logs...</p>
        </div>
      ) : error ? (
        <Card className="py-20 text-center">
          <CardContent>
            <p className="text-red-500">Error: {error}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="bg-transparent border-none shadow-none">
            <CardContent>
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
                      onViewDetails={handleViewDetails}
                    />
                  )}
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      )}

      <ActivityLogDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        log={selectedLog}
      />
    </div>
  );
}
