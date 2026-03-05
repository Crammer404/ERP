'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type CheckedState } from '@radix-ui/react-checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { managementService, Employee } from '@/services/management/managementService';
import { dtrService } from '@/services/dtr/dtrService';
import { useToast } from '@/hooks/use-toast';

interface AssignEmployeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleName: string;
  scheduleId: number;
  currentEmployeeIds: number[];
  onSuccess: () => void;
}

export function AssignEmployeesModal({
  isOpen,
  onClose,
  scheduleName,
  scheduleId,
  currentEmployeeIds,
  onSuccess,
}: AssignEmployeesModalProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
      // Set currently assigned employees
      setSelectedEmployees(currentEmployeeIds.map(id => id.toString()));
      setSearchTerm('');
    } else {
      setSelectedEmployees([]);
      setSearchTerm('');
    }
  }, [isOpen, currentEmployeeIds]);

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const employeeList = await managementService.fetchBranchEmployees();
      setEmployees(employeeList);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
      toast({
        title: 'Error',
        description: 'Failed to fetch employees',
        variant: 'destructive',
      });
    } finally {
      setLoadingEmployees(false);
    }
  };

  const getEmployeeDisplayName = (employee: Employee): string => {
    return `${getEmployeeName(employee)} - ${getEmployeePositionOrRole(employee)}`;
  };

  const getEmployeeName = (employee: Employee): string => {
    if (employee.user_info) {
      const { first_name, last_name, middle_name } = employee.user_info;
      const fullName = [first_name, middle_name, last_name].filter(Boolean).join(' ');
      return fullName || employee.name || employee.email;
    }
    return employee.name || employee.email;
  };

  const getEmployeePositionOrRole = (employee: Employee): string => {
    const employeeData = employee as any;

    const position =
      employeeData?.user_info?.payroll_position?.name ||
      employeeData?.user_info?.position?.name ||
      employeeData?.payroll_position?.name ||
      employeeData?.position?.name ||
      employeeData?.position ||
      null;

    if (position) {
      return position;
    }

    return employee.role?.name || 'Employee';
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await dtrService.updateScheduleEmployees(scheduleId, selectedEmployees);
      
      toast({
        title: 'Success',
        description: 'Employee assignments updated successfully',
      });
      
      onClose();
      onSuccess();
    } catch (error: any) {
      console.error('Error updating assignments:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update assignments',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleEmployee = (employeeId: string, checked: boolean) => {
    setSelectedEmployees((prev) => {
      if (checked) {
        return prev.includes(employeeId) ? prev : [...prev, employeeId];
      }
      return prev.filter((id) => id !== employeeId);
    });
  };

  const selectedEmployeeNames = employees
    .filter((employee) => selectedEmployees.includes(employee.id.toString()))
    .map((employee) => ({
      id: employee.id.toString(),
      name: getEmployeeName(employee),
      position: getEmployeePositionOrRole(employee),
    }));

  const filteredEmployees = employees.filter((employee) => {
    if (!searchTerm.trim()) return true;
    const label = getEmployeeDisplayName(employee).toLowerCase();
    return label.includes(searchTerm.toLowerCase());
  });

  const allFilteredSelected =
    filteredEmployees.length > 0 &&
    filteredEmployees.every((employee) => selectedEmployees.includes(employee.id.toString()));

  const someFilteredSelected =
    filteredEmployees.some((employee) => selectedEmployees.includes(employee.id.toString())) &&
    !allFilteredSelected;

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredEmployees.map((employee) => employee.id.toString());
    if (allFilteredSelected) {
      setSelectedEmployees((prev) => prev.filter((id) => !filteredIds.includes(id)));
      return;
    }
    setSelectedEmployees((prev) => Array.from(new Set([...prev, ...filteredIds])));
  };

  const allFilteredCheckedState: CheckedState = allFilteredSelected
    ? true
    : someFilteredSelected
    ? 'indeterminate'
    : false;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="w-[98vw] max-w-6xl overflow-hidden p-0"
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <DialogHeader className="space-y-2 border-b px-6 pb-4 pt-6">
          <DialogTitle className="text-xl font-semibold">Assign Employees</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Assign employees to "{scheduleName}" schedule
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Selected Employees</Label>
                <span className="text-xs text-muted-foreground">
                  {selectedEmployeeNames.length} selected
                </span>
              </div>
              <ScrollArea className="h-72 rounded-md border p-3">
                {selectedEmployeeNames.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No employees selected yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedEmployeeNames.map((employee) => (
                      <div
                        key={employee.id}
                        className="flex items-center justify-between gap-2 rounded-md border bg-muted/20 px-2 py-1.5"
                      >
                        <p className="min-w-0 truncate text-sm">
                          <span className="font-medium">{employee.name}</span>
                          <span className="text-muted-foreground"> - {employee.position}</span>
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => toggleEmployee(employee.id, false)}
                          disabled={saving}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Select Employees</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all-employees"
                    checked={allFilteredCheckedState}
                    onCheckedChange={() => handleSelectAllFiltered()}
                    disabled={saving || filteredEmployees.length === 0}
                  />
                  <Label htmlFor="select-all-employees" className="text-sm">Select All</Label>
                </div>
              </div>
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search employee..."
                className="h-9"
                disabled={saving || loadingEmployees}
              />
              <ScrollArea className="h-72 rounded-md border p-3">
                {loadingEmployees ? (
                  <div className="text-center py-8 text-muted-foreground">Loading employees...</div>
                ) : employees.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No employees found in this branch</div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No employees found.</div>
                ) : (
                  <div className="space-y-2">
                    {filteredEmployees.map((employee) => {
                      const employeeId = employee.id.toString();
                      const checked = selectedEmployees.includes(employeeId);
                      return (
                        <div
                          key={employee.id}
                          className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <Checkbox
                              id={`employee-${employee.id}`}
                              checked={checked}
                              onCheckedChange={(isChecked) => toggleEmployee(employeeId, isChecked === true)}
                              disabled={saving}
                            />
                            <Label
                              htmlFor={`employee-${employee.id}`}
                              className="min-w-0 cursor-pointer text-sm font-medium"
                            >
                              <span className="truncate">{getEmployeeName(employee)}</span>
                            </Label>
                          </div>
                          <span className="truncate text-xs text-muted-foreground">
                            - {getEmployeePositionOrRole(employee)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose} 
            disabled={saving}
          >
            Cancel
          </Button>
          <Button 
            type="button"
            onClick={handleSave}
            disabled={saving || loadingEmployees}
            className="min-w-[120px]"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

