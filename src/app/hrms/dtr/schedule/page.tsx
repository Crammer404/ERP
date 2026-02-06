'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { PaginationInfos } from '@/components/ui/pagination-info';
import { Plus, MoreVertical, Edit, Trash2, Users, Search, CalendarClock, CirclePlus } from 'lucide-react';
import { AddScheduleModal, ScheduleFormData } from './components/add-schedule-modal';
import { AssignEmployeesModal } from './components/assign-employees-modal';
import { dtrService, AssignedEmployee } from '@/services/dtr/dtrService';
import { useToast } from '@/hooks/use-toast';
import { UserAvatarStack } from '@/components/ui/user-avatar-stack';
import { Loader } from '@/components/ui/loader';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

// Schedule data type
interface Schedule {
  id: number;
  name: string;
  branch: string;
  morningShift: string;
  afternoonShift: string;
  nightShift: string;
  gracePeriod: number;
  overtimeThreshold: number;
  assignedEmployees: AssignedEmployee[];
}

interface ModalState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: ScheduleFormData;
  scheduleId?: number;
}

interface Errors {
  [key: string]: string;
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    mode: 'create',
  });
  const [loading, setLoading] = useState(true); // Loading state for fetching schedules
  const [submitting, setSubmitting] = useState(false); // Loading state for form submission
  const [errors, setErrors] = useState<Errors>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<Schedule | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [assignEmployeesOpen, setAssignEmployeesOpen] = useState(false);
  const [scheduleToAssign, setScheduleToAssign] = useState<Schedule | null>(null);
  const { toast } = useToast();

  // Fetch schedules from API
  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await dtrService.getSchedules();
      setSchedules(response.schedules);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch schedules',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchSchedules();
  }, []);

  // Listen for branch change events
  useEffect(() => {
    const handleBranchChange = () => {
      console.log('Branch changed, refreshing schedules data...');
      setCurrentPage(1); // Reset to first page
      fetchSchedules();
    };

    window.addEventListener('branchChanged', handleBranchChange);
    
    return () => {
      window.removeEventListener('branchChanged', handleBranchChange);
    };
  }, []);

  const handleAddSchedule = () => {
    setModalState({
      isOpen: true,
      mode: 'create',
    });
    setErrors({});
  };

  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      mode: 'create',
    });
    setErrors({});
  };

  const handleSubmitSchedule = async (data: ScheduleFormData) => {
    setSubmitting(true);
    setErrors({});

    try {
      // Map form data to API request format
      const requestData = {
        schedule_name: data.scheduleName,
        branch_id: data.branchId,
        morning_shift_start: data.morningStart,
        morning_shift_end: data.morningEnd,
        afternoon_shift_start: data.afternoonStart,
        afternoon_shift_end: data.afternoonEnd,
        night_shift_start: data.nightStart,
        night_shift_end: data.nightEnd,
        grace_period: data.gracePeriod,
        overtime: data.overtimeThreshold,
        user_ids: data.selectedEmployees,
      };

      // Check if we're editing or creating
      if (modalState.mode === 'edit' && modalState.scheduleId) {
        await dtrService.updateSchedule(modalState.scheduleId, requestData);
        toast({
          title: 'Success',
          description: 'Schedule updated successfully',
        });
      } else {
        await dtrService.createSchedule(requestData);
        toast({
          title: 'Success',
          description: 'Schedule created successfully',
        });
      }
      
      // Close modal and refresh schedules list
      handleCloseModal();
      fetchSchedules();
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      // Handle validation errors
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({
          general: error.response?.data?.message || 'Failed to save schedule'
        });
      }
      
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save schedule',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearError = (field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleEdit = async (schedule: Schedule) => {
    try {
      // Fetch full schedule details
      const scheduleDetails = await dtrService.getSchedule(schedule.id);
      
      console.log('Schedule details fetched:', scheduleDetails);
      console.log('Assigned employee IDs:', scheduleDetails.assigned_employee_ids);
      console.log('Employee count:', scheduleDetails.assigned_employee_ids?.length);
      
      const scheduleData: ScheduleFormData = {
        scheduleName: scheduleDetails.schedule_name || '',
        branchId: scheduleDetails.branch_id?.toString() || '',
        morningStart: scheduleDetails.morning_shift_start || '',
        morningEnd: scheduleDetails.morning_shift_end || '',
        afternoonStart: scheduleDetails.afternoon_shift_start || '',
        afternoonEnd: scheduleDetails.afternoon_shift_end || '',
        nightStart: scheduleDetails.night_shift_start || '',
        nightEnd: scheduleDetails.night_shift_end || '',
        gracePeriod: scheduleDetails.grace_period?.toString() || '',
        overtimeThreshold: scheduleDetails.overtime?.toString() || '',
        selectedEmployees: scheduleDetails.assigned_employee_ids?.map((id: number) => id.toString()) || [],
      };
      
      console.log('Form data prepared:', scheduleData);
      console.log('Selected employees array:', scheduleData.selectedEmployees);

      setModalState({
        isOpen: true,
        mode: 'edit',
        initialData: scheduleData,
        scheduleId: schedule.id,
      });
      setErrors({});
    } catch (error: any) {
      console.error('Error fetching schedule details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load schedule details',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = (schedule: Schedule) => {
    setScheduleToDelete(schedule);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!scheduleToDelete) return;

    setDeleting(true);
    try {
      await dtrService.deleteSchedule(scheduleToDelete.id);
      
      toast({
        title: 'Success',
        description: 'Schedule deleted successfully',
      });
      
      setDeleteConfirmOpen(false);
      setScheduleToDelete(null);
      fetchSchedules();
    } catch (error: any) {
      console.error('Error deleting schedule:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete schedule',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleAssignEmployees = (schedule: Schedule) => {
    setScheduleToAssign(schedule);
    setAssignEmployeesOpen(true);
  };

  const handleAssignEmployeesSuccess = () => {
    fetchSchedules();
  };

  // Filter schedules based on search term
  const filteredSchedules = schedules.filter(schedule => 
    schedule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schedule.branch.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);
  const paginatedSchedules = filteredSchedules.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <CalendarClock className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-headline">Dynamic Schedules</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage dynamic schedules for your employees.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Dynamic Schedules Section */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by schedule name or branch..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page when searching
                  }}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleAddSchedule} className="shrink-0">
                <CirclePlus className="h-4 w-4 mr-2" />
                Add Schedule
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Schedule Name</TableHead>
                    <TableHead className="text-center">Branch</TableHead>
                    <TableHead className="text-center">Schedule</TableHead>
                    <TableHead className="text-center">Grace Period</TableHead>
                    <TableHead className="text-center">Overtime Thr</TableHead>
                    <TableHead>Employees Assigned</TableHead>
                    <TableHead className="w-[100px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <Loader size="sm" />
                      </TableCell>
                    </TableRow>
                  ) : paginatedSchedules.length > 0 ? (
                    paginatedSchedules.map((schedule) => (
                      <TableRow key={schedule.id}>
                        <TableCell className="font-medium text-center">{schedule.name}</TableCell>
                        <TableCell className="text-center">{schedule.branch}</TableCell>
                        <TableCell className="text-center">
                          <div className="space-y-1 text-sm">
                            {schedule.morningShift && (
                              <div>
                                <span className="text-yellow-400 dark:text-yellow-300 font-medium">Morning Shift</span> - {schedule.morningShift}
                              </div>
                            )}
                            {schedule.afternoonShift && (
                              <div>
                                <span className="text-orange-400 dark:text-orange-300 font-medium">Afternoon Shift</span> - {schedule.afternoonShift}
                              </div>
                            )}
                            {schedule.nightShift && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400 font-medium">Night Shift</span> - {schedule.nightShift}
                              </div>
                            )}
                            {!schedule.morningShift && !schedule.afternoonShift && !schedule.nightShift && (
                              <div className="text-muted-foreground">-</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{schedule.gracePeriod} min</TableCell>
                        <TableCell className="text-center">{schedule.overtimeThreshold} min</TableCell>
                        <TableCell>
                          <UserAvatarStack 
                            users={schedule.assignedEmployees} 
                            maxVisible={4}
                            size="sm"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(schedule)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAssignEmployees(schedule)}>
                                <Users className="mr-2 h-4 w-4" />
                                Assign Employees
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(schedule)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="p-0">
                        <EmptyState
                          icon={CalendarClock}
                          title="No schedules found"
                          description="There are no schedules created yet. Click 'Add Schedule' to create your first schedule."
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {!loading && filteredSchedules.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6">
                <PaginationInfos.Standard
                  from={(currentPage - 1) * itemsPerPage + 1}
                  to={Math.min(currentPage * itemsPerPage, filteredSchedules.length)}
                  total={filteredSchedules.length}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />

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
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Schedule Modal */}
      <AddScheduleModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        mode={modalState.mode}
        initialData={modalState.initialData}
        onSubmit={handleSubmitSchedule}
        loading={submitting}
        errors={errors}
        onClearError={handleClearError}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Schedule"
        description={`Are you sure you want to delete "${scheduleToDelete?.name}"? This action cannot be undone and will remove all employee assignments.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
        loading={deleting}
      />

      {/* Assign Employees Modal */}
      {scheduleToAssign && (
        <AssignEmployeesModal
          isOpen={assignEmployeesOpen}
          onClose={() => setAssignEmployeesOpen(false)}
          scheduleName={scheduleToAssign.name}
          scheduleId={scheduleToAssign.id}
          currentEmployeeIds={scheduleToAssign.assignedEmployees.map(emp => emp.id)}
          onSuccess={handleAssignEmployeesSuccess}
        />
      )}
    </div>
  );
}