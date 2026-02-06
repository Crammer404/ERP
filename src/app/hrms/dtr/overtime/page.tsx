'use client';

import { useState, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { BadgeCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useAuth } from '@/components/providers/auth-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Download, 
  User, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Plus,
  UserCheck,
  Users,
  MoreVertical
} from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  getMyOvertime, 
  getOvertimeRequests, 
  requestOvertime, 
  approveOvertime, 
  rejectOvertime,
  MyOvertimeRecord,
  OvertimeRequestRecord
} from '@/services/hrms/dtr';

export default function OvertimePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('approval');
  
  // Manager Approval Tab States
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // My Overtime Tab States
  const [mySearchTerm, setMySearchTerm] = useState('');
  const [myDateRange, setMyDateRange] = useState<DateRange | undefined>();
  const [mySelectedStatus, setMySelectedStatus] = useState('all');
  const [myCurrentPage, setMyCurrentPage] = useState(1);
  const [myItemsPerPage, setMyItemsPerPage] = useState(10);
  
  // Shared States
  const [approvalRecords, setApprovalRecords] = useState<OvertimeRequestRecord[]>([]);
  const [myOvertimeRecords, setMyOvertimeRecords] = useState<MyOvertimeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [myLoading, setMyLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<OvertimeRequestRecord | null>(null);
  const [selectedMyRecord, setSelectedMyRecord] = useState<MyOvertimeRecord | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [myViewModalOpen, setMyViewModalOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [payType, setPayType] = useState<'overtime' | 'regular'>('overtime');

  // New overtime request form
  const [newRequest, setNewRequest] = useState({
    dtr_log_id: 0,
    reason: '',
  });

  const fetchApprovalRecords = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (searchTerm) params.search = searchTerm;
      if (dateRange?.from) {
        params.start_date = dateRange.from.toISOString().split('T')[0];
      }
      if (dateRange?.to) {
        params.end_date = dateRange.to.toISOString().split('T')[0];
      }
      
      const data = await getOvertimeRequests(params);
      setApprovalRecords(data);
    } catch (e: any) {
      const errorMsg = e?.response?.data?.message || e?.message || 'Failed to load overtime records';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMyOvertimeRecords = async () => {
    setMyLoading(true);
    try {
      const data = await getMyOvertime();
      setMyOvertimeRecords(data);
    } catch (e: any) {
      const errorMsg = e?.response?.data?.message || e?.message || 'Failed to load my overtime records';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setMyLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (activeTab === 'approval') {
      fetchApprovalRecords();
    } else {
      fetchMyOvertimeRecords();
    }
  }, [activeTab]);

  // Refetch when filters change for approval tab
  useEffect(() => {
    if (activeTab === 'approval') {
      fetchApprovalRecords();
    }
  }, [selectedStatus, searchTerm, dateRange]);

  // Listen for branch context changes (for Manager Approval tab)
  useEffect(() => {
    if (activeTab !== 'approval') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'branch_context') {
        // Branch changed, refetch approval records
        fetchApprovalRecords();
      }
    };

    // Listen to storage events from other tabs/windows
    window.addEventListener('storage', handleStorageChange);

    // Also listen to custom event for same-window changes
    const handleBranchChange = () => {
      fetchApprovalRecords();
    };
    window.addEventListener('branchChanged', handleBranchChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('branchChanged', handleBranchChange);
    };
  }, [activeTab]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter records for My Overtime Tab (client-side filtering for search/date/status)
  const filteredMyOvertime = myOvertimeRecords.filter(record => {
    const matchesSearch = !mySearchTerm || record.date.includes(mySearchTerm) || 
      (record.request_reason?.toLowerCase().includes(mySearchTerm.toLowerCase()));
    const matchesStatus = mySelectedStatus === 'all' || record.request_status === mySelectedStatus;
    
    // Date range filter
    let matchesDateRange = true;
    if (myDateRange?.from || myDateRange?.to) {
      try {
        const recordDate = new Date(record.date);
        if (myDateRange.from && recordDate < myDateRange.from) {
          matchesDateRange = false;
        }
        if (myDateRange.to && recordDate > myDateRange.to) {
          matchesDateRange = false;
        }
      } catch (e) {
        matchesDateRange = false;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDateRange;
  });

  // Pagination for Manager Approval Tab
  const totalPages = Math.ceil(approvalRecords.length / itemsPerPage);
  const paginatedRecords = approvalRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Pagination for My Overtime Tab
  const myTotalPages = Math.ceil(filteredMyOvertime.length / myItemsPerPage);
  const myPaginatedRecords = filteredMyOvertime.slice(
    (myCurrentPage - 1) * myItemsPerPage,
    myCurrentPage * myItemsPerPage
  );

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  const handleMyItemsPerPageChange = (value: string) => {
    setMyItemsPerPage(parseInt(value));
    setMyCurrentPage(1);
  };

  const handleRefresh = () => {
    setSearchTerm('');
    setDateRange(undefined);
    setSelectedStatus('all');
    setCurrentPage(1);
    fetchApprovalRecords();
  };

  const handleMyRefresh = () => {
    setMySearchTerm('');
    setMyDateRange(undefined);
    setMySelectedStatus('all');
    setMyCurrentPage(1);
    fetchMyOvertimeRecords();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      // Simulate export
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: 'Export Successful',
        description: 'Overtime records exported successfully',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export overtime records',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleViewDetails = (record: OvertimeRequestRecord) => {
    setSelectedRecord(record);
    setViewModalOpen(true);
  };

  const handleViewMyDetails = (record: MyOvertimeRecord) => {
    setSelectedMyRecord(record);
    setMyViewModalOpen(true);
  };

  const handleApprove = (record: OvertimeRequestRecord) => {
    setSelectedRecord(record);
    setActionNotes('');
    setPayType('overtime'); // Default to overtime pay
    setApproveModalOpen(true);
  };

  const handleReject = (record: OvertimeRequestRecord) => {
    setSelectedRecord(record);
    setActionNotes('');
    setRejectModalOpen(true);
  };

  const confirmApprove = async () => {
    if (!selectedRecord) return;
    
    try {
      await approveOvertime(selectedRecord.id, payType, actionNotes || undefined);
      
      toast({
        title: 'Overtime Approved',
        description: `Overtime request for ${selectedRecord.employee} has been approved as ${payType === 'overtime' ? 'overtime pay' : 'regular hours'}`,
        variant: 'default',
      });
      
      setApproveModalOpen(false);
      setSelectedRecord(null);
      setActionNotes('');
      setPayType('overtime');
      fetchApprovalRecords();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to approve overtime request';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    }
  };

  const confirmReject = async () => {
    if (!selectedRecord) return;
    
    if (!actionNotes.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a rejection reason',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await rejectOvertime(selectedRecord.id, actionNotes);
      
      toast({
        title: 'Overtime Rejected',
        description: `Overtime request for ${selectedRecord.employee} has been rejected`,
        variant: 'default',
      });
      
      setRejectModalOpen(false);
      setSelectedRecord(null);
      setActionNotes('');
      fetchApprovalRecords();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to reject overtime request';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    }
  };

  const handleRequestOvertime = async () => {
    if (!newRequest.dtr_log_id) {
      toast({
        title: 'Validation Error',
        description: 'Please select a timelog to request overtime',
        variant: 'destructive',
      });
      return;
    }

    try {
      await requestOvertime({
        dtr_log_id: newRequest.dtr_log_id,
        reason: newRequest.reason || undefined,
      });
      
      toast({
        title: 'Request Submitted',
        description: 'Your overtime request has been submitted for approval',
        variant: 'default',
      });
      
      setRequestModalOpen(false);
      setNewRequest({ dtr_log_id: 0, reason: '' });
      fetchMyOvertimeRecords();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to submit overtime request';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    }
  };

  const handleRequestFromRecord = (record: MyOvertimeRecord) => {
    if (record.request_status !== 'not_requested') {
      toast({
        title: 'Already Requested',
        description: 'This overtime has already been requested',
        variant: 'default',
      });
      return;
    }
    setSelectedMyRecord(record);
    setNewRequest({ dtr_log_id: record.id, reason: '' });
    setRequestModalOpen(true);
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

  const getUserDisplayName = () => {
    if (!user) return 'Loading...';
    return user.name || user.email || 'User';
  };

  const getUserRole = () => {
    if (!user) return '';
    return user.role_name || '(Employee)';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500 hover:bg-green-600">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 hover:bg-red-600">Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
      case 'not_requested':
        return <Badge className="bg-gray-500 hover:bg-gray-600">Not Requested</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatOvertimeHoursMinutes = (minutes: number | null | undefined) => {
    if (!minutes || minutes <= 0) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const formatOvertimeFromHours = (hours: number | null | undefined) => {
    if (!hours || hours <= 0) return '0h 0m';
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    if (wholeHours === 0) return `${minutes}m`;
    if (minutes === 0) return `${wholeHours}h`;
    return `${wholeHours}h ${minutes}m`;
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <BadgeCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-headline">Employee Overtime Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage overtime requests and approvals.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="approval" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Manager Approval
          </TabsTrigger>
          <TabsTrigger value="myOvertime" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            My Overtime
          </TabsTrigger>
        </TabsList>

        {/* Manager Approval Tab */}
        <TabsContent value="approval">
          {/* Summary Row */}
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

          {/* Content Section */}
          <div className="w-full">
              <Card>
            <CardHeader>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-4">
                <Button 
                  variant="default" 
                  className="bg-green-600 hover:bg-green-700 shrink-0"
                  onClick={handleExport}
                  disabled={exporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {exporting ? 'Exporting...' : 'Export'}
                </Button>
                <Input
                  placeholder="Search employee"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="sm:w-64 min-w-[200px] flex-1 sm:flex-none"
                />
                <DateRangePicker
                  date={dateRange}
                  onDateChange={setDateRange}
                  placeholder="Select Date Range"
                  className="sm:w-auto min-w-[200px] flex-1 sm:flex-none"
                />
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="sm:w-40 min-w-[140px]">
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
                  onClick={handleRefresh}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Clear
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {/* Table */}
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
                                  <DropdownMenuItem onClick={() => handleViewDetails(record)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  {record.status === 'pending' && (
                                    <>
                                      <DropdownMenuItem 
                                        onClick={() => handleApprove(record)}
                                        className="text-green-600 focus:text-green-600"
                                      >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Approve
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => handleReject(record)}
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

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6">
                <PaginationInfos.Standard
                  from={(currentPage - 1) * itemsPerPage + 1}
                  to={Math.min(currentPage * itemsPerPage, approvalRecords.length)}
                  total={approvalRecords.length}
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
        </TabsContent>

        {/* My Overtime Tab */}
        <TabsContent value="myOvertime">
          {/* Summary Row */}
          <div className="mb-6">
            <Card>
              <CardContent className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Total Overtime Logs:</span>
                    <span className="font-semibold">{myOvertimeRecords.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Approved:</span>
                    <span className="font-semibold text-green-600">
                      {myOvertimeRecords.filter(r => r.request_status === 'approved').length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Pending:</span>
                    <span className="font-semibold text-yellow-600">
                      {myOvertimeRecords.filter(r => r.request_status === 'pending').length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Not Requested:</span>
                    <span className="font-semibold text-gray-600">
                      {myOvertimeRecords.filter(r => r.request_status === 'not_requested').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Section */}
          <div className="w-full">
              <Card>
            <CardHeader>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-4">
                <Button 
                  variant="default" 
                  className="bg-green-600 hover:bg-green-700 shrink-0"
                  onClick={handleExport}
                  disabled={exporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {exporting ? 'Exporting...' : 'Export'}
                </Button>
                <Input
                  placeholder="Search reason"
                  value={mySearchTerm}
                  onChange={(e) => setMySearchTerm(e.target.value)}
                  className="sm:w-64 min-w-[200px] flex-1 sm:flex-none"
                />
                <DateRangePicker
                  date={myDateRange}
                  onDateChange={setMyDateRange}
                  placeholder="Select Date Range"
                  className="sm:w-auto min-w-[200px] flex-1 sm:flex-none"
                />
                <Select value={mySelectedStatus} onValueChange={setMySelectedStatus}>
                  <SelectTrigger className="sm:w-40 min-w-[140px]">
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
                  onClick={handleMyRefresh}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Clear
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {/* Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
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
                  <TableBody>
                    {myLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <Loader size="sm" />
                        </TableCell>
                      </TableRow>
                    ) : myPaginatedRecords.length > 0 ? (
                      myPaginatedRecords.map((record) => {
                        const formatTime = (timeStr: string | null) => {
                          if (!timeStr) return '-';
                          try {
                            const date = new Date(timeStr);
                            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
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
                        return (
                        <TableRow key={record.id}>
                            <TableCell>{formatDate(record.date)}</TableCell>
                            <TableCell>{record.shift}</TableCell>
                            <TableCell>{formatTime(record.clock_in)}</TableCell>
                            <TableCell>{formatTime(record.clock_out)}</TableCell>
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
                              {record.request_status === 'not_requested' ? (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleRequestFromRecord(record)}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Request
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
                                    <DropdownMenuItem onClick={() => handleViewMyDetails(record)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="p-0">
                          <EmptyState
                            icon={Clock}
                            title="No overtime records found"
                            description="You don't have any timelogs with overtime hours yet. Overtime hours will appear here once you clock out after your shift ends."
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6">
                <PaginationInfos.Standard
                  from={(myCurrentPage - 1) * myItemsPerPage + 1}
                  to={Math.min(myCurrentPage * myItemsPerPage, filteredMyOvertime.length)}
                  total={filteredMyOvertime.length}
                  itemsPerPage={myItemsPerPage}
                  onItemsPerPageChange={handleMyItemsPerPageChange}
                />

                {myTotalPages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setMyCurrentPage(Math.max(1, myCurrentPage - 1))}
                          className={myCurrentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>

                      {Array.from({ length: Math.min(myTotalPages, 3) }, (_, i) => {
                        let pageNum;
                        if (myTotalPages <= 3) {
                          pageNum = i + 1;
                        } else if (myCurrentPage === 1) {
                          pageNum = i + 1;
                        } else if (myCurrentPage === myTotalPages) {
                          pageNum = myTotalPages - 2 + i;
                        } else {
                          pageNum = myCurrentPage - 1 + i;
                        }
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setMyCurrentPage(pageNum)}
                              isActive={myCurrentPage === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setMyCurrentPage(Math.min(myTotalPages, myCurrentPage + 1))}
                          className={myCurrentPage === myTotalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
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
      </Tabs>

      {/* View Details Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Overtime Request Details</DialogTitle>
            <DialogDescription>
              View detailed information about this overtime request
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Employee</label>
                  <p className="text-sm font-semibold">{selectedRecord.employee}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Branch</label>
                  <p className="text-sm">{selectedRecord.branch}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date</label>
                  <p className="text-sm">{selectedRecord.date_formatted}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedRecord.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Requested Hours</label>
                  <p className="text-sm">{formatOvertimeFromHours(selectedRecord.requested_hours)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Actual Hours</label>
                  <p className="text-sm">{selectedRecord.actual_hours > 0 ? formatOvertimeFromHours(selectedRecord.actual_hours) : '-'}</p>
                </div>
                {selectedRecord.status === 'approved' && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Pay Type</label>
                    <div className="mt-1">
                      {selectedRecord.pay_type === 'regular' ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Regular Hours
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          Overtime Pay
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Reason</label>
                <p className="text-sm mt-1">{selectedRecord.reason || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Requested At</label>
                <p className="text-sm">{selectedRecord.requested_at || '-'}</p>
              </div>
              {selectedRecord.reviewed_by && (
                <>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Reviewed By</label>
                    <p className="text-sm">{selectedRecord.reviewed_by}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Reviewed At</label>
                    <p className="text-sm">{selectedRecord.reviewed_at || '-'}</p>
                  </div>
                </>
              )}
              {selectedRecord.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                  <p className="text-sm mt-1">{selectedRecord.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setViewModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View My Overtime Details Modal */}
      <Dialog open={myViewModalOpen} onOpenChange={setMyViewModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>My Overtime Details</DialogTitle>
            <DialogDescription>
              View detailed information about your overtime record
            </DialogDescription>
          </DialogHeader>
          
          {selectedMyRecord && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date</label>
                  <p className="text-sm font-semibold">
                    {new Date(selectedMyRecord.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Shift</label>
                  <p className="text-sm">{selectedMyRecord.shift}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Clock In</label>
                  <p className="text-sm">
                    {selectedMyRecord.clock_in 
                      ? new Date(selectedMyRecord.clock_in).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit' 
                        })
                      : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Clock Out</label>
                  <p className="text-sm">
                    {selectedMyRecord.clock_out 
                      ? new Date(selectedMyRecord.clock_out).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit' 
                        })
                      : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Overtime Hours</label>
                  <p className="text-sm">{formatOvertimeHoursMinutes(selectedMyRecord.overtime_minutes)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedMyRecord.request_status)}</div>
                </div>
                {selectedMyRecord.request_status === 'approved' && selectedMyRecord.pay_type && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Pay Type</label>
                    <div className="mt-1">
                      {selectedMyRecord.pay_type === 'regular' ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Regular Hours
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          Overtime Pay
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {selectedMyRecord.request_reason && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reason</label>
                  <p className="text-sm mt-1">{selectedMyRecord.request_reason}</p>
                </div>
              )}
              {selectedMyRecord.requested_at && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Requested At</label>
                  <p className="text-sm">
                    {new Date(selectedMyRecord.requested_at).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setMyViewModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Overtime Modal */}
      <Dialog open={requestModalOpen} onOpenChange={setRequestModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Overtime</DialogTitle>
            <DialogDescription>
              Submit a new overtime request for approval
            </DialogDescription>
          </DialogHeader>
          
          {selectedMyRecord && (
          <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-md space-y-2">
                <p className="text-sm"><strong>Date:</strong> {new Date(selectedMyRecord.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                <p className="text-sm"><strong>Shift:</strong> {selectedMyRecord.shift}</p>
                <p className="text-sm"><strong>Overtime Hours:</strong> {formatOvertimeHoursMinutes(selectedMyRecord.overtime_minutes)}</p>
            </div>
            <div>
                <label className="text-sm font-medium">Reason (Optional)</label>
              <Textarea
                value={newRequest.reason}
                onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                  placeholder="Explain the reason for overtime (optional)"
                className="mt-1"
                rows={4}
              />
            </div>
          </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequestOvertime} className="bg-blue-600 hover:bg-blue-700">
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Modal */}
      <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Overtime Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this overtime request?
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm"><strong>Employee:</strong> {selectedRecord.employee}</p>
                <p className="text-sm"><strong>Date:</strong> {selectedRecord.date_formatted}</p>
                <p className="text-sm"><strong>Hours:</strong> {formatOvertimeFromHours(selectedRecord.requested_hours)}</p>
                <p className="text-sm"><strong>Reason:</strong> {selectedRecord.reason || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Pay Type *</label>
                <RadioGroup value={payType} onValueChange={(value) => setPayType(value as 'overtime' | 'regular')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="overtime" id="overtime" />
                    <Label htmlFor="overtime" className="font-normal cursor-pointer">
                      Overtime Pay (Premium Rate)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="regular" id="regular" />
                    <Label htmlFor="regular" className="font-normal cursor-pointer">
                      Regular Hours (Regular Rate)
                    </Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-muted-foreground mt-2">
                  Select whether these hours should be paid at overtime premium rate or regular hourly rate.
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Notes (Optional)</label>
                <Textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Add any notes..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmApprove} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Overtime Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this overtime request?
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm"><strong>Employee:</strong> {selectedRecord.employee}</p>
                <p className="text-sm"><strong>Date:</strong> {selectedRecord.date_formatted}</p>
                <p className="text-sm"><strong>Hours:</strong> {formatOvertimeFromHours(selectedRecord.requested_hours)}</p>
                <p className="text-sm"><strong>Reason:</strong> {selectedRecord.reason || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Rejection Reason *</label>
                <Textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Explain why this request is being rejected..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmReject} 
              className="bg-red-600 hover:bg-red-700"
              disabled={!actionNotes.trim()}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

