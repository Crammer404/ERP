import { ReactNode } from 'react';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import { Download, RefreshCw, Clock, MoreVertical, Eye, Send, UserCheck } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { Employee } from '@/services/management/managementService';
import { MyOvertimeRecord } from '@/services/hrms/dtr';
import { ShiftFilter } from '../../../../../components/ui/shift-filter';
import { SHIFT_COLOR_CLASSES } from '@/config/colors.config';
import { TimeDisplay } from '../../time-clock/components/time-display';

type EmployeesOvertimeTabProps = {
  employeeOvertimeRecords: MyOvertimeRecord[];
  filteredEmployeeOvertime: MyOvertimeRecord[];
  employeePaginatedRecords: MyOvertimeRecord[];
  employeeOvertimeLoading: boolean;
  employees: Employee[];
  employeesLoading: boolean;
  selectedEmployeeId: string;
  employeeSelectedShift: string;
  employeeDateRange: DateRange | undefined;
  employeeSelectedStatus: string;
  employeeCurrentPage: number;
  employeeTotalPages: number;
  employeeItemsPerPage: number;
  exporting: boolean;
  onExport: () => void;
  onEmployeeShiftChange: (value: string) => void;
  onEmployeeDateRangeChange: (value: DateRange | undefined) => void;
  onSelectedEmployeeChange: (value: string) => void;
  onEmployeeStatusChange: (value: string) => void;
  onEmployeeRefresh: () => void;
  onEmployeeItemsPerPageChange: (value: string) => void;
  onEmployeePageChange: (value: number) => void;
  onRequestOvertime: (record: MyOvertimeRecord) => void;
  onViewDetails: (record: MyOvertimeRecord) => void;
  getStatusBadge: (status: string) => ReactNode;
  formatOvertimeHoursMinutes: (minutes: number | null | undefined) => string;
  getEmployeeDisplayName: (employee: Employee) => string;
};

const formatTime = (timeStr: string | null) => {
  if (!timeStr) {
    return '-';
  }

  try {
    const date = new Date(timeStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
  } catch {
    return timeStr;
  }
};

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

export function EmployeesOvertimeTab({
  employeeOvertimeRecords,
  filteredEmployeeOvertime,
  employeePaginatedRecords,
  employeeOvertimeLoading,
  employees,
  employeesLoading,
  selectedEmployeeId,
  employeeSelectedShift,
  employeeDateRange,
  employeeSelectedStatus,
  employeeCurrentPage,
  employeeTotalPages,
  employeeItemsPerPage,
  exporting,
  onExport,
  onEmployeeShiftChange,
  onEmployeeDateRangeChange,
  onSelectedEmployeeChange,
  onEmployeeStatusChange,
  onEmployeeRefresh,
  onEmployeeItemsPerPageChange,
  onEmployeePageChange,
  onRequestOvertime,
  onViewDetails,
  getStatusBadge,
  formatOvertimeHoursMinutes,
  getEmployeeDisplayName,
}: EmployeesOvertimeTabProps) {
  return (
    <TabsContent value="employeesOvertime">
      <div className="mb-6">
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Total Overtime Logs:</span>
                <span className="font-semibold">{employeeOvertimeRecords.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Approved:</span>
                <span className="font-semibold text-green-600">
                  {employeeOvertimeRecords.filter(r => r.request_status === 'approved').length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Pending:</span>
                <span className="font-semibold text-yellow-600">
                  {employeeOvertimeRecords.filter(r => r.request_status === 'pending').length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Not Requested:</span>
                <span className="font-semibold text-gray-600">
                  {employeeOvertimeRecords.filter(r => r.request_status === 'not_requested').length}
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
              <Select value={selectedEmployeeId} onValueChange={onSelectedEmployeeChange}>
                <SelectTrigger className="w-full sm:flex-1 sm:min-w-[120px]">
                  <SelectValue placeholder={employeesLoading ? 'Loading employees...' : 'Select employee'} />
                </SelectTrigger>
                <SelectContent>
                  {employees.length > 0 ? (
                    employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {getEmployeeDisplayName(employee)}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-employees" disabled>
                      No employees found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <ShiftFilter value={employeeSelectedShift} onChange={onEmployeeShiftChange} />
              <DateRangePicker
                date={employeeDateRange}
                onDateChange={onEmployeeDateRangeChange}
                placeholder="Select Date Range"
                className="w-full sm:flex-1 sm:min-w-[120px]"
              />
              <Select value={employeeSelectedStatus} onValueChange={onEmployeeStatusChange}>
                <SelectTrigger className="w-full sm:flex-1 sm:min-w-[120px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="not_requested">Not Requested</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none shrink-0"
                variant="default"
                onClick={onEmployeeRefresh}
              >
                <RefreshCw className={`h-4 w-4 ${employeeOvertimeLoading ? 'animate-spin' : ''}`} />
                Clear Filters
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="rounded-md border w-full overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader className="[&_th]:text-[11px] [&_th]:font-medium">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Overtime Hours</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pay Type</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="[&_td]:text-[11px]">
                  {!selectedEmployeeId ? (
                    <TableRow>
                      <TableCell colSpan={8} className="p-0">
                        <EmptyState
                          icon={UserCheck}
                          title="Select an employee"
                          description="Choose an employee to view requestable overtime logs."
                        />
                      </TableCell>
                    </TableRow>
                  ) : employeeOvertimeLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <Loader size="sm" />
                      </TableCell>
                    </TableRow>
                  ) : employeePaginatedRecords.length > 0 ? (
                    employeePaginatedRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{formatDate(record.date)}</TableCell>
                        <TableCell>
                          <span className={SHIFT_COLOR_CLASSES[record.shift] || ''}>
                            {record.shift}
                          </span>
                        </TableCell>
                        <TableCell><TimeDisplay value={formatTime(record.clock_in)} /></TableCell>
                        <TableCell><TimeDisplay value={formatTime(record.clock_out)} /></TableCell>
                        <TableCell>{formatOvertimeHoursMinutes(record.overtime_minutes)}</TableCell>
                        <TableCell>{getStatusBadge(record.request_status)}</TableCell>
                        <TableCell>
                          {record.request_status === 'approved' && record.pay_type ? (
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
                            {record.request_status === 'not_requested' ||
                            (record.request_status === 'rejected' && (record.appeal_attempts ?? 0) < 3) ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onRequestOvertime(record)}
                                className="h-8 w-8 text-primary hover:text-primary/80"
                                title={record.request_status === 'rejected' ? 'Appeal overtime request' : 'Request overtime'}
                              >
                                <Send className="h-5 w-5" />
                              </Button>
                            ) : (
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
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="p-0">
                        <EmptyState
                          icon={Clock}
                          title="No overtime records found"
                          description="The selected employee has no requestable overtime logs yet."
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6">
              <PaginationInfos.Standard
                from={filteredEmployeeOvertime.length > 0 ? (employeeCurrentPage - 1) * employeeItemsPerPage + 1 : 0}
                to={Math.min(employeeCurrentPage * employeeItemsPerPage, filteredEmployeeOvertime.length)}
                total={filteredEmployeeOvertime.length}
                itemsPerPage={employeeItemsPerPage}
                onItemsPerPageChange={onEmployeeItemsPerPageChange}
              />

              {employeeTotalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => onEmployeePageChange(Math.max(1, employeeCurrentPage - 1))}
                        className={employeeCurrentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>

                    {Array.from({ length: Math.min(employeeTotalPages, 3) }, (_, i) => {
                      let pageNum;
                      if (employeeTotalPages <= 3) {
                        pageNum = i + 1;
                      } else if (employeeCurrentPage === 1) {
                        pageNum = i + 1;
                      } else if (employeeCurrentPage === employeeTotalPages) {
                        pageNum = employeeTotalPages - 2 + i;
                      } else {
                        pageNum = employeeCurrentPage - 1 + i;
                      }
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => onEmployeePageChange(pageNum)}
                            isActive={employeeCurrentPage === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => onEmployeePageChange(Math.min(employeeTotalPages, employeeCurrentPage + 1))}
                        className={employeeCurrentPage === employeeTotalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
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
