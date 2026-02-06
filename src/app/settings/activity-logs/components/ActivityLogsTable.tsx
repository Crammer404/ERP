'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { ActivityLog } from '../services/activityLogService';
import { ActivityLogsResponse } from '../services/activityLogService';

interface ActivityLogsTableProps {
  activityLogs: ActivityLog[];
  pagination: ActivityLogsResponse['data'];
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

export function ActivityLogsTable({
  activityLogs,
  pagination,
  currentPage,
  setCurrentPage,
}: ActivityLogsTableProps) {
  const getActivityBadgeVariant = (activity: string) => {
    switch (activity.toLowerCase()) {
      case 'added':
      case 'add':
        return 'default'; // green
      case 'updated':
      case 'update':
        return 'secondary'; // blue
      case 'deleted':
      case 'delete':
        return 'destructive'; // red
      default:
        return 'outline';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Module</TableHead>
            <TableHead>Activity</TableHead>
            <TableHead>Item Name</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activityLogs.map((log, index) => (
            <TableRow key={`${log.created_at}-${index}`} className="hover:bg-transparent">
              <TableCell>
                <Badge variant="outline">{log.module}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={getActivityBadgeVariant(log.activity)}>
                  {log.activity}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{log.item_name}</TableCell>
              <TableCell>{log.branch}</TableCell>
              <TableCell>{log.created_by}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDateTime(log.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-between items-center mt-6">
        <p className="text-sm text-muted-foreground">
          Showing {pagination.from || 0}–{pagination.to || 0} of {pagination.total} entries
        </p>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
              .filter(page =>
                page === 1 || page === pagination.last_page || (page >= currentPage - 1 && page <= currentPage + 1)
              )
              .map((page, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && page - prev > 1;
                return (
                  <div key={page} className="flex items-center">
                    {showEllipsis && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  </div>
                );
              })}

            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(Math.min(currentPage + 1, pagination.last_page))}
                className={currentPage === pagination.last_page ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </>
  );
}