import { ReactNode } from 'react';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
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
import { TabsContent } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, RefreshCw, Clock, MoreVertical, Eye, CheckCircle, XCircle } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { EmptyState } from '@/components/ui/empty-state';
import { OvertimeRequestRecord } from '@/services/hrms/dtr';

type ManagerApprovalTabProps = {
  approvalRecords: OvertimeRequestRecord[];
  paginatedRecords: OvertimeRequestRecord[];
  loading: boolean;
  exporting: boolean;
  searchTerm: string;
  dateRange: DateRange | undefined;
  selectedStatus: string;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onExport: () => void;
  onSearchChange: (value: string) => void;
  onDateRangeChange: (value: DateRange | undefined) => void;
  onStatusChange: (value: string) => void;
  onRefresh: () => void;
  onItemsPerPageChange: (value: string) => void;
  onPageChange: (value: number) => void;
  onViewDetails: (record: OvertimeRequestRecord) => void;
  onApprove: (record: OvertimeRequestRecord) => void;
  onReject: (record: OvertimeRequestRecord) => void;
  getStatusBadge: (status: string) => ReactNode;
  formatOvertimeFromHours: (hours: number | null | undefined) => string;
};

export function ManagerApprovalTab({
  approvalRecords,
  paginatedRecords,
  loading,
  exporting,
  searchTerm,
  dateRange,
  selectedStatus,
  currentPage,
  totalPages,
  itemsPerPage,
  onExport,
  onSearchChange,
  onDateRangeChange,
  onStatusChange,
  onRefresh,
  onItemsPerPageChange,
  onPageChange,
  onViewDetails,
  onApprove,
  onReject,
  getStatusBadge,
  formatOvertimeFromHours,
}: ManagerApprovalTabProps) {
  return (
    <TabsContent value="approval">
      <div className="mb-6">
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Total Requests:</span>
                <span className="font-semibold">{approvalRecords.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Approved:</span>
                <span className="font-semibold text-green-600">
                  {approvalRecords.filter(r => r.status === 'approved').length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Pending:</span>
                <span className="font-semibold text-yellow-600">
                  {approvalRecords.filter(r => r.status === 'pending').length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rejected:</span>
                <span className="font-semibold text-red-600">
                  {approvalRecords.filter(r => r.status === 'rejected').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="w-full">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-4">
              <Button
                variant="default"
                className="bg-green-600 hover:bg-green-700 shrink-0"
                onClick={onExport}
                disabled={exporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting ? 'Exporting...' : 'Export'}
              </Button>
              <Input
                placeholder="Search employee"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full sm:flex-1 sm:min-w-[120px]"
              />
              <DateRangePicker
                date={dateRange}
                onDateChange={onDateRangeChange}
                placeholder="Select Date Range"
                className="sm:w-auto min-w-[200px] flex-1 sm:flex-none"
              />
              <Select value={selectedStatus} onValueChange={onStatusChange}>
                <SelectTrigger className="sm:w-40 min-w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none shrink-0"
                variant="default"
                onClick={onRefresh}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Clear
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Requested Hours</TableHead>
                    <TableHead>Actual Hours</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pay Type</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <Loader size="sm" />
                      </TableCell>
                    </TableRow>
                  ) : paginatedRecords.length > 0 ? (
                    paginatedRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.date_formatted}</TableCell>
                        <TableCell className="font-medium">{record.employee}</TableCell>
                        <TableCell>{record.branch}</TableCell>
                        <TableCell>{formatOvertimeFromHours(record.requested_hours)}</TableCell>
                        <TableCell>{record.actual_hours > 0 ? formatOvertimeFromHours(record.actual_hours) : '-'}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{record.reason || '-'}</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell>
                          {record.status === 'approved' ? (
                            record.pay_type === 'regular' ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                Regular Hours
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                Overtime Pay
                              </Badge>
                            )
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onViewDetails(record)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {record.status === 'pending' && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => onApprove(record)}
                                      className="text-green-600 focus:text-green-600"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => onReject(record)}
                                      className="text-red-600 focus:text-red-600"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reject
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="p-0">
                        <EmptyState
                          icon={Clock}
                          title="No overtime records found"
                          description="There are no overtime records yet. Records will appear here once overtime requests are submitted."
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6">
              <PaginationInfos.Standard
                from={(currentPage - 1) * itemsPerPage + 1}
                to={Math.min(currentPage * itemsPerPage, approvalRecords.length)}
                total={approvalRecords.length}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={onItemsPerPageChange}
              />

              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
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
                            onClick={() => onPageChange(pageNum)}
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
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
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
    </TabsContent>
  );
}
