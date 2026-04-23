import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { EmptyState } from '@/components/ui/empty-state';
import { Clock } from 'lucide-react';
import { SHIFT_COLOR_CLASSES } from '@/config/colors.config';
import { TimeDisplay } from './time-display';
import type { TimeClockLog } from '../types';
import { toDaysLeft } from '../utils/date-utils';
import { formatStatusLabel } from '../utils/log-mappers';
import type { TimeClockTab } from '../hooks/use-time-clock-logs';

interface TimeClockTableProps {
  loading: boolean;
  logs: TimeClockLog[];
  activeTab: TimeClockTab;
  canManageLogs: boolean;
  actionMode?: 'manage' | 'view' | 'none';
  hasDateFilter: boolean;
  onEditLog: (log: TimeClockLog) => void;
  onDeleteLog: (log: TimeClockLog) => void;
  onRestoreLog: (log: TimeClockLog) => void;
  onForceDeleteLog: (log: TimeClockLog) => void;
  onApproveEarlyOut: (log: TimeClockLog) => void;
  onRejectEarlyOut: (log: TimeClockLog) => void;
  onViewLog?: (log: TimeClockLog) => void;
}

export function TimeClockTable(props: TimeClockTableProps) {
  const isEarlyOutTab = props.activeTab === 'early_out';
  const canShowActionColumn = props.actionMode === 'none' ? false : props.canManageLogs;
  const loadingColSpan = isEarlyOutTab
    ? (canShowActionColumn ? 8 : 7)
    : (canShowActionColumn ? 13 : 12);
  const renderStatusTag = (status: string | null) => {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'approved') {
      return <Badge className="bg-green-500 hover:bg-green-600">Approved</Badge>;
    }
    if (normalized === 'rejected') {
      return <Badge className="bg-red-500 hover:bg-red-600">Rejected</Badge>;
    }
    if (normalized === 'pending') {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
    }

    return <Badge>{formatStatusLabel(status)}</Badge>;
  };
  const renderStandardStatus = (log: TimeClockLog) => {
    const normalizedStatus = (log.status || '').toLowerCase();
    const normalizedEarlyOutStatus = (log.earlyOutRequestStatus || '').toLowerCase();
    const isEarlyOut = normalizedStatus === 'early_out';

    if (isEarlyOut && normalizedEarlyOutStatus === 'approved') {
      return (
        <span className="font-medium">
          Early Out - <span className="text-green-600">Approved</span>
        </span>
      );
    }

    if (isEarlyOut && normalizedEarlyOutStatus === 'rejected') {
      return (
        <span className="font-medium">
          Early Out - <span className="text-red-600">Rejected</span>
        </span>
      );
    }

    if (isEarlyOut && normalizedEarlyOutStatus === 'pending') {
      return (
        <span className="font-medium">
          Early Out - <span className="text-yellow-600">Pending</span>
        </span>
      );
    }

    return formatStatusLabel(log.status);
  };

  return (
    <div className="rounded-md border w-full overflow-x-auto">
      <Table className="min-w-[980px]">
        <TableHeader className="[&_th]:text-[11px] [&_th]:font-medium">
          <TableRow>
            {isEarlyOutTab ? (
              <>
                <TableHead>Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Schedule Clock Out</TableHead>
                <TableHead>Actual Clock Out</TableHead>
                <TableHead>Remaining Minutes</TableHead>
                <TableHead>Reviewed By</TableHead>
                {canShowActionColumn && <TableHead>Action</TableHead>}
              </>
            ) : (
              <>
                <TableHead>Date</TableHead>
                {props.activeTab === 'archive' && <TableHead>Days Left</TableHead>}
                <TableHead>Employee</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Clock Out</TableHead>
                <TableHead>Late</TableHead>
                <TableHead>Overtime</TableHead>
                <TableHead>Actual Work Hours</TableHead>
                <TableHead>Total Work Hours</TableHead>
                {canShowActionColumn && <TableHead>Action</TableHead>}
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody className="[&_td]:text-[11px]">
          {props.loading ? (
            <TableRow>
              <TableCell colSpan={loadingColSpan} className="text-center py-8">
                <Loader size="sm" />
              </TableCell>
            </TableRow>
          ) : props.logs.length > 0 ? (
            props.logs.map((log) => (
              <TableRow
                key={log.id}
                className={props.activeTab === 'active' && log.earlyOutRequestStatus === 'pending' ? 'bg-[#ff2400]/20 hover:bg-[#ff2400]/30 dark:bg-[#ff2400]/30 dark:hover:bg-[#ff2400]/40' : undefined}
              >
                {isEarlyOutTab ? (
                  <>
                    <TableCell className="font-medium">{log.employee}</TableCell>
                    <TableCell>{log.date}</TableCell>
                    <TableCell>{renderStatusTag(log.status)}</TableCell>
                    <TableCell><TimeDisplay value={log.scheduledClockOut} /></TableCell>
                    <TableCell><TimeDisplay value={log.actualClockOut} /></TableCell>
                    <TableCell>{log.earlyOutRemainingMinutes}</TableCell>
                    <TableCell>{log.reviewedBy || '-'}</TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>{log.date}</TableCell>
                    {props.activeTab === 'archive' && <TableCell>{toDaysLeft(log.deletedAt) ?? '-'}</TableCell>}
                    <TableCell className="font-medium">{log.employee}</TableCell>
                    <TableCell>
                      <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10 text-[10px] font-medium rounded-md px-2 py-0.5">
                        {log.branch}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={SHIFT_COLOR_CLASSES[log.shift] || ''}>{log.shift}</span>
                    </TableCell>
                    <TableCell>{renderStandardStatus(log)}</TableCell>
                    <TableCell><TimeDisplay value={log.clockIn} /></TableCell>
                    <TableCell><TimeDisplay value={log.clockOut} /></TableCell>
                    <TableCell>{log.late}</TableCell>
                    <TableCell>{log.overtime}</TableCell>
                    <TableCell>{log.actualHours}</TableCell>
                    <TableCell>{log.totalWorkHours}</TableCell>
                  </>
                )}
                {canShowActionColumn && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {props.onViewLog && props.activeTab === 'active' && (
                          <DropdownMenuItem onClick={() => props.onViewLog?.(log)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                        )}
                        {props.actionMode === 'view' ? null : props.activeTab === 'archive' ? (
                          <>
                            <DropdownMenuItem onClick={() => props.onRestoreLog(log)}>Restore</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => props.onForceDeleteLog(log)} className="text-destructive">
                              Delete permanently
                            </DropdownMenuItem>
                          </>
                        ) : props.activeTab === 'early_out' ? (
                          <>
                            <DropdownMenuItem
                              onClick={() => props.onApproveEarlyOut(log)}
                              disabled={log.earlyOutRequestStatus !== 'pending'}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => props.onRejectEarlyOut(log)}
                              disabled={log.earlyOutRequestStatus !== 'pending'}
                              className="text-destructive"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            <DropdownMenuItem onClick={() => props.onEditLog(log)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => props.onDeleteLog(log)} className="text-destructive">
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
              <TableCell colSpan={loadingColSpan} className="p-0">
                {props.hasDateFilter ? (
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
  );
}

