'use client';

import { useState, useEffect, useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/components/providers/auth-provider';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  UserCheck,
  Users
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  getMyOvertime, 
  getEmployeeOvertime,
  getOvertimeRequests, 
  requestOvertime, 
  requestEmployeeOvertime,
  approveOvertime, 
  rejectOvertime,
  MyOvertimeRecord,
  OvertimeRequestRecord
} from '@/services/hrms/dtr';
import { managementService, Employee } from '@/services/management/managementService';
import { ManagerApprovalTab } from './components/manager-approval-tab';
import { EmployeesOvertimeTab } from './components/employees-overtime-tab';
import { MyOvertimeTab } from './components/my-overtime-tab';

type OvertimeTab = 'approval' | 'employeesOvertime' | 'myOvertime';

export default function OvertimePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<OvertimeTab>('approval');
  
  // Manager Approval Tab States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShift, setSelectedShift] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // My Overtime Tab States
  const [mySearchTerm, setMySearchTerm] = useState('');
  const [mySelectedShift, setMySelectedShift] = useState('all');
  const [myDateRange, setMyDateRange] = useState<DateRange | undefined>();
  const [mySelectedStatus, setMySelectedStatus] = useState('all');
  const [myCurrentPage, setMyCurrentPage] = useState(1);
  const [myItemsPerPage, setMyItemsPerPage] = useState(10);
  const [employeeSelectedShift, setEmployeeSelectedShift] = useState('all');
  const [employeeDateRange, setEmployeeDateRange] = useState<DateRange | undefined>();
  const [employeeSelectedStatus, setEmployeeSelectedStatus] = useState('all');
  const [employeeCurrentPage, setEmployeeCurrentPage] = useState(1);
  const [employeeItemsPerPage, setEmployeeItemsPerPage] = useState(10);
  
  // Shared States
  const [approvalRecords, setApprovalRecords] = useState<OvertimeRequestRecord[]>([]);
  const [myOvertimeRecords, setMyOvertimeRecords] = useState<MyOvertimeRecord[]>([]);
  const [employeeOvertimeRecords, setEmployeeOvertimeRecords] = useState<MyOvertimeRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [myLoading, setMyLoading] = useState(false);
  const [employeeOvertimeLoading, setEmployeeOvertimeLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<OvertimeRequestRecord | null>(null);
  const [selectedMyRecord, setSelectedMyRecord] = useState<MyOvertimeRecord | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [myViewModalOpen, setMyViewModalOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestTarget, setRequestTarget] = useState<'my' | 'employee'>('my');
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [payType, setPayType] = useState<'overtime' | 'regular'>('overtime');

  // New overtime request form
  const [newRequest, setNewRequest] = useState({
    employee_id: 0,
    dtr_log_id: 0,
    reason: '',
  });

  const overtimePermissions = useMemo(() => {
    if (!user?.permissions) {
      return null;
    }

    for (const groupData of Object.values(user.permissions)) {
      const overtimeModule = groupData.modules.find((module) => module.module_path === '/hrms/dtr/overtime');
      if (overtimeModule?.permissions) {
        return overtimeModule.permissions;
      }
    }

    return null;
  }, [user?.permissions]);

  const canViewManagerApproval = Boolean(overtimePermissions?.update);
  const canViewEmployeesOvertime = canViewManagerApproval;
  const canViewMyOvertime = Boolean(overtimePermissions?.create);
  const availableTabs = useMemo<OvertimeTab[]>(() => {
    const tabs: OvertimeTab[] = [];
    if (canViewManagerApproval) {
      tabs.push('approval');
    }
    if (canViewEmployeesOvertime) {
      tabs.push('employeesOvertime');
    }
    if (canViewMyOvertime) {
      tabs.push('myOvertime');
    }
    return tabs;
  }, [canViewEmployeesOvertime, canViewManagerApproval, canViewMyOvertime]);
  const hasOvertimeTabAccess = availableTabs.length > 0;

  useEffect(() => {
    if (!hasOvertimeTabAccess) {
      return;
    }

    if (!availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0]);
    }
  }, [activeTab, availableTabs, hasOvertimeTabAccess]);

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

  const fetchEmployeeOptions = async () => {
    setEmployeesLoading(true);
    try {
      const data = await managementService.fetchBranchEmployees();
      setEmployees(data);
      setSelectedEmployeeId((current) => {
        if (data.some((employee) => employee.id.toString() === current)) {
          return current;
        }
        setEmployeeOvertimeRecords([]);
        return '';
      });
    } catch (e: any) {
      const errorMsg = e?.response?.data?.message || e?.message || 'Failed to load employees';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
      setEmployees([]);
      setSelectedEmployeeId('');
      setEmployeeOvertimeRecords([]);
    } finally {
      setEmployeesLoading(false);
    }
  };

  const fetchEmployeeOvertimeRecords = async (employeeId: number) => {
    setEmployeeOvertimeLoading(true);
    try {
      const data = await getEmployeeOvertime(employeeId);
      setEmployeeOvertimeRecords(data);
    } catch (e: any) {
      const errorMsg = e?.response?.data?.message || e?.message || 'Failed to load employee overtime records';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
      setEmployeeOvertimeRecords([]);
    } finally {
      setEmployeeOvertimeLoading(false);
    }
  };

  useEffect(() => {
    if (!canViewEmployeesOvertime) {
      return;
    }

    fetchEmployeeOptions();
  }, [canViewEmployeesOvertime]);

  // Initial load
  useEffect(() => {
    if (activeTab === 'approval' && canViewManagerApproval) {
      fetchApprovalRecords();
      return;
    }

    if (activeTab === 'myOvertime' && canViewMyOvertime) {
      fetchMyOvertimeRecords();
    }
  }, [activeTab, canViewManagerApproval, canViewMyOvertime]);

  // Refetch when filters change for approval tab
  useEffect(() => {
    if (activeTab === 'approval' && canViewManagerApproval) {
      fetchApprovalRecords();
    }
  }, [activeTab, canViewManagerApproval, selectedStatus, searchTerm, dateRange]);

  useEffect(() => {
    if (activeTab !== 'employeesOvertime' || !canViewEmployeesOvertime) {
      return;
    }

    if (!selectedEmployeeId) {
      setEmployeeOvertimeRecords([]);
      return;
    }

    fetchEmployeeOvertimeRecords(Number(selectedEmployeeId));
  }, [activeTab, canViewEmployeesOvertime, selectedEmployeeId]);

  // Listen for branch context changes (for Manager Approval tab)
  useEffect(() => {
    if (activeTab !== 'approval' || !canViewManagerApproval) return;

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
  }, [activeTab, canViewManagerApproval]);

  useEffect(() => {
    if (!canViewEmployeesOvertime) return;

    const refreshEmployeesOvertime = () => {
      setSelectedEmployeeId('');
      setEmployeeOvertimeRecords([]);
      setEmployeesLoading(true);
      fetchEmployeeOptions();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'branch_context') {
        refreshEmployeesOvertime();
      }
    };

    const handleBranchChange = () => {
      refreshEmployeesOvertime();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('branchChanged', handleBranchChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('branchChanged', handleBranchChange);
    };
  }, [canViewEmployeesOvertime]);

  const filterOvertimeRecords = (
    records: MyOvertimeRecord[],
    opts: {
      term?: string;
      status?: string;
      shift?: string;
      range?: DateRange | undefined;
    }
  ) => {
    const { term = '', status = 'all', shift = 'all', range } = opts;
    return records.filter((record) => {
      const normalizedTerm = term.toLowerCase();
      const matchesSearch =
        !term ||
        record.date.includes(term) ||
        (record.request_reason?.toLowerCase().includes(normalizedTerm) ?? false);
      const matchesStatus = status === 'all' || record.request_status === status;
      const matchesShift = shift === 'all' || record.shift === shift;

      let matchesDateRange = true;
      if (range?.from || range?.to) {
        try {
          const recordDate = new Date(record.date);
          if (range.from && recordDate < range.from) {
            matchesDateRange = false;
          }
          if (range.to && recordDate > range.to) {
            matchesDateRange = false;
          }
        } catch {
          matchesDateRange = false;
        }
      }

      return matchesSearch && matchesStatus && matchesShift && matchesDateRange;
    });
  };

  const filteredMyOvertime = filterOvertimeRecords(
    myOvertimeRecords,
    { term: mySearchTerm, shift: mySelectedShift, status: mySelectedStatus, range: myDateRange }
  );
  const filteredEmployeeOvertime = filterOvertimeRecords(
    employeeOvertimeRecords,
    { status: employeeSelectedStatus, shift: employeeSelectedShift, range: employeeDateRange }
  );

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
  const employeeTotalPages = Math.ceil(filteredEmployeeOvertime.length / employeeItemsPerPage);
  const employeePaginatedRecords = filteredEmployeeOvertime.slice(
    (employeeCurrentPage - 1) * employeeItemsPerPage,
    employeeCurrentPage * employeeItemsPerPage
  );

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  const handleMyItemsPerPageChange = (value: string) => {
    setMyItemsPerPage(parseInt(value));
    setMyCurrentPage(1);
  };

  const handleEmployeeItemsPerPageChange = (value: string) => {
    setEmployeeItemsPerPage(parseInt(value));
    setEmployeeCurrentPage(1);
  };

  const handleRefresh = () => {
    setSearchTerm('');
    setSelectedShift('all');
    setDateRange(undefined);
    setSelectedStatus('all');
    setCurrentPage(1);
    fetchApprovalRecords();
  };

  const handleMyRefresh = () => {
    setMySearchTerm('');
    setMySelectedShift('all');
    setMyDateRange(undefined);
    setMySelectedStatus('all');
    setMyCurrentPage(1);
    fetchMyOvertimeRecords();
  };

  const handleEmployeeRefresh = () => {
    setEmployeeSelectedShift('all');
    setEmployeeDateRange(undefined);
    setEmployeeSelectedStatus('all');
    setEmployeeCurrentPage(1);
    if (selectedEmployeeId) {
      fetchEmployeeOvertimeRecords(Number(selectedEmployeeId));
    } else {
      setEmployeeOvertimeRecords([]);
    }
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
      if (requestTarget === 'employee') {
        if (!newRequest.employee_id) {
          toast({
            title: 'Validation Error',
            description: 'Please select an employee',
            variant: 'destructive',
          });
          return;
        }

        await requestEmployeeOvertime({
          employee_id: newRequest.employee_id,
          dtr_log_id: newRequest.dtr_log_id,
          reason: newRequest.reason || undefined,
        });
      } else {
        await requestOvertime({
          dtr_log_id: newRequest.dtr_log_id,
          reason: newRequest.reason || undefined,
        });
      }
      
      toast({
        title: 'Request Submitted',
        description: 'Your overtime request has been submitted for approval',
        variant: 'default',
      });
      
      setRequestModalOpen(false);
      setNewRequest({ employee_id: 0, dtr_log_id: 0, reason: '' });
      if (requestTarget === 'employee' && selectedEmployeeId) {
        fetchEmployeeOvertimeRecords(Number(selectedEmployeeId));
      } else {
        fetchMyOvertimeRecords();
      }
      setRequestTarget('my');
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to submit overtime request';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    }
  };

  const handleRequestFromRecord = (
    record: MyOvertimeRecord,
    target: 'my' | 'employee',
    employeeId?: number
  ) => {
    if (record.request_status !== 'not_requested') {
      toast({
        title: 'Already Requested',
        description: 'This overtime has already been requested',
        variant: 'default',
      });
      return;
    }
    if (target === 'employee' && !employeeId) {
      toast({
        title: 'Validation Error',
        description: 'Please select an employee',
        variant: 'destructive',
      });
      return;
    }
    setRequestTarget(target);
    setSelectedMyRecord(record);
    setNewRequest({
      employee_id: target === 'employee' ? Number(employeeId) : 0,
      dtr_log_id: record.id,
      reason: '',
    });
    setRequestModalOpen(true);
  };

  const getEmployeeDisplayName = (employee: Employee) => {
    if (employee.user_info) {
      const fullName = `${employee.user_info.first_name || ''} ${employee.user_info.last_name || ''}`.trim();
      if (fullName) {
        return fullName;
      }
    }

    return employee.name || employee.email;
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

  if (!hasOvertimeTabAccess) {
    return (
      <div className="container mx-auto py-6 px-4">
        <EmptyState
          icon={Clock}
          title="No overtime access"
          description="Your role does not currently have access to Overtime tabs."
        />
      </div>
    );
  }

  const tabsGridClass =
    availableTabs.length === 3 ? 'grid-cols-3' : availableTabs.length === 2 ? 'grid-cols-2' : 'grid-cols-1';

  return (
    <div className="container mx-auto py-6 px-4">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as OvertimeTab)} className="w-full">
        <TabsList className={`grid w-full mb-6 ${tabsGridClass}`}>
          {canViewManagerApproval && (
            <TabsTrigger value="approval" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Manager Approval
            </TabsTrigger>
          )}
          {canViewEmployeesOvertime && (
            <TabsTrigger value="employeesOvertime" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Employees Overtime
            </TabsTrigger>
          )}
          {canViewMyOvertime && (
            <TabsTrigger value="myOvertime" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              My Overtime
            </TabsTrigger>
          )}
        </TabsList>

        {canViewManagerApproval && (
          <ManagerApprovalTab
            approvalRecords={approvalRecords}
            paginatedRecords={paginatedRecords}
            loading={loading}
            exporting={exporting}
            searchTerm={searchTerm}
            selectedShift={selectedShift}
            dateRange={dateRange}
            selectedStatus={selectedStatus}
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onExport={handleExport}
            onSearchChange={setSearchTerm}
            onShiftChange={setSelectedShift}
            onDateRangeChange={setDateRange}
            onStatusChange={setSelectedStatus}
            onRefresh={handleRefresh}
            onItemsPerPageChange={handleItemsPerPageChange}
            onPageChange={setCurrentPage}
            onViewDetails={handleViewDetails}
            onApprove={handleApprove}
            onReject={handleReject}
            getStatusBadge={getStatusBadge}
            formatOvertimeFromHours={formatOvertimeFromHours}
          />
        )}

        {canViewEmployeesOvertime && (
          <EmployeesOvertimeTab
            employeeOvertimeRecords={employeeOvertimeRecords}
            filteredEmployeeOvertime={filteredEmployeeOvertime}
            employeePaginatedRecords={employeePaginatedRecords}
            employeeOvertimeLoading={employeeOvertimeLoading}
            employees={employees}
            employeesLoading={employeesLoading}
            selectedEmployeeId={selectedEmployeeId}
            employeeSelectedShift={employeeSelectedShift}
            employeeDateRange={employeeDateRange}
            employeeSelectedStatus={employeeSelectedStatus}
            employeeCurrentPage={employeeCurrentPage}
            employeeTotalPages={employeeTotalPages}
            employeeItemsPerPage={employeeItemsPerPage}
            exporting={exporting}
            onExport={handleExport}
            onEmployeeShiftChange={setEmployeeSelectedShift}
            onEmployeeDateRangeChange={setEmployeeDateRange}
            onSelectedEmployeeChange={(value) => {
              setSelectedEmployeeId(value);
              setEmployeeCurrentPage(1);
            }}
            onEmployeeStatusChange={setEmployeeSelectedStatus}
            onEmployeeRefresh={handleEmployeeRefresh}
            onEmployeeItemsPerPageChange={handleEmployeeItemsPerPageChange}
            onEmployeePageChange={setEmployeeCurrentPage}
            onRequestOvertime={(record) => handleRequestFromRecord(record, 'employee', Number(selectedEmployeeId))}
            onViewDetails={handleViewMyDetails}
            getStatusBadge={getStatusBadge}
            formatOvertimeHoursMinutes={formatOvertimeHoursMinutes}
            getEmployeeDisplayName={getEmployeeDisplayName}
          />
        )}

        {canViewMyOvertime && (
          <MyOvertimeTab
            myOvertimeRecords={myOvertimeRecords}
            filteredMyOvertime={filteredMyOvertime}
            myPaginatedRecords={myPaginatedRecords}
            myLoading={myLoading}
            exporting={exporting}
            mySearchTerm={mySearchTerm}
            mySelectedShift={mySelectedShift}
            myDateRange={myDateRange}
            mySelectedStatus={mySelectedStatus}
            myCurrentPage={myCurrentPage}
            myTotalPages={myTotalPages}
            myItemsPerPage={myItemsPerPage}
            onExport={handleExport}
            onSearchChange={setMySearchTerm}
            onShiftChange={setMySelectedShift}
            onDateRangeChange={setMyDateRange}
            onStatusChange={setMySelectedStatus}
            onRefresh={handleMyRefresh}
            onItemsPerPageChange={handleMyItemsPerPageChange}
            onPageChange={setMyCurrentPage}
            onRequestOvertime={(record) => handleRequestFromRecord(record, 'my')}
            onViewDetails={handleViewMyDetails}
            getStatusBadge={getStatusBadge}
            formatOvertimeHoursMinutes={formatOvertimeHoursMinutes}
          />
        )}
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
            <DialogTitle>Overtime Details</DialogTitle>
            <DialogDescription>
              View detailed information about this overtime record
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

