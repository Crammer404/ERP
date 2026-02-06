'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { MultiSelect } from '@/components/ui/multi-select';
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
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
      // Set currently assigned employees
      setSelectedEmployees(currentEmployeeIds.map(id => id.toString()));
    } else {
      setSelectedEmployees([]);
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
    let name = '';
    
    if (employee.user_info) {
      const { first_name, last_name, middle_name } = employee.user_info;
      const fullName = [first_name, middle_name, last_name].filter(Boolean).join(' ');
      name = fullName || employee.name || employee.email;
    } else {
      name = employee.name || employee.email;
    }
    
    const role = employee.role?.name || 'Employee';
    return `${name} - ${role}`;
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Assign Employees</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Assign employees to "{scheduleName}" schedule
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loadingEmployees ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading employees...
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No employees found in this branch
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Select Employees</Label>
              <MultiSelect
                options={employees.map((employee) => ({
                  value: employee.id.toString(),
                  label: getEmployeeDisplayName(employee),
                }))}
                value={selectedEmployees}
                onChange={setSelectedEmployees}
                searchPlaceholder="Search employees..."
                disabled={saving}
                maxHeight="280px"
                emptyLabel="Click to add employees"
              />
            </div>
          )}
        </div>

        <DialogFooter>
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

