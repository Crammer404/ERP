import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { Loader2 } from "lucide-react";
import type { PayrollPosition } from '../services/position-service';
import { managementService, Employee } from '@/services/management/managementService';
import { branchService } from '@/app/management/branches/services/branchService';
import { userService } from '@/services';

interface AddEmployeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: PayrollPosition;
  userInfos: Array<{ id: number; user_id: number; first_name?: string; last_name?: string; user?: { id: number; email: string } }>;
  onSubmit: (userInfoIds: number[]) => Promise<void> | void;
  loading: boolean;
  errors: Record<string, string>;
  onClearError: (field: string) => void;
}

const getEmployeeDisplayName = (employee: Employee): string => {
  if (employee.user_info) {
    const { first_name, last_name, middle_name } = employee.user_info;
    const fullName = [first_name, middle_name, last_name].filter(Boolean).join(' ');
    return fullName || employee.name || employee.email;
  }
  return employee.name || employee.email;
};

export function AddEmployeesModal({
  isOpen,
  onClose,
  position,
  userInfos,
  onSubmit,
  loading,
  errors,
  onClearError,
}: AddEmployeesModalProps) {
  const [selectedUserInfoIds, setSelectedUserInfoIds] = useState<number[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [fetchedUserInfos, setFetchedUserInfos] = useState<Array<{ id: number; user_id: number; first_name?: string; last_name?: string; user?: { id: number; email: string } }>>([]);

  useEffect(() => {
    if (isOpen && position?.branch_id) {
      setSelectedUserInfoIds([]);
      setLocalErrors({});
      fetchEmployees();
    }
  }, [isOpen, position?.branch_id, userInfos]);

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      let employeeList: Employee[] = [];
      
      if (position?.branch_id) {
        const [branchResponse, usersResponse] = await Promise.all([
          branchService.getEmployees(position.branch_id),
          userService.getAll(1, 10000, ''),
        ]);
        
        console.log('Branch employees response:', branchResponse);
        console.log('Users response:', usersResponse);
        
        const allUserInfos = (usersResponse.users || []).flatMap((u: any) => {
          if (u.user_info && (u.user_info as any).id) {
            return [{
              id: (u.user_info as any).id,
              user_id: u.id,
              first_name: u.user_info.first_name,
              last_name: u.user_info.last_name,
              user: { id: u.id, email: u.email }
            }];
          }
          return [];
        }) as Array<{ id: number; user_id: number; first_name?: string; last_name?: string; user?: { id: number; email: string } }>;
        
        setFetchedUserInfos(allUserInfos);
        
        console.log('All userInfos count:', allUserInfos.length);
        console.log('Prop userInfos count:', userInfos.length);
        
        if (branchResponse?.users && Array.isArray(branchResponse.users)) {
          console.log('Branch users count:', branchResponse.users.length);
          
          employeeList = branchResponse.users.map((branchUser: any) => {
            let userInfo = userInfos.find(ui => ui.user_id === branchUser.user_id);
            if (!userInfo) {
              userInfo = allUserInfos.find(ui => ui.user_id === branchUser.user_id);
            }
            
            if (!userInfo) {
              console.warn('No userInfo found for user_id:', branchUser.user_id, 'email:', branchUser.email);
            }
            
            let first_name: string | undefined;
            let last_name: string | undefined;
            if (branchUser.name) {
              const nameParts = branchUser.name.trim().split(' ');
              first_name = nameParts[0];
              last_name = nameParts.slice(1).join(' ') || undefined;
            }
            
            return {
              id: branchUser.user_id,
              email: branchUser.email || '',
              name: branchUser.name || null,
              user_info: userInfo ? {
                id: userInfo.id,
                user_id: branchUser.user_id,
                first_name: userInfo.first_name || first_name,
                last_name: userInfo.last_name || last_name,
              } : undefined,
              role: branchUser.role ? { 
                id: 0,
                name: branchUser.role 
              } : undefined,
            };
          });
          
          console.log('Mapped employeeList count:', employeeList.length);
          console.log('Employees with user_info:', employeeList.filter(e => e.user_info).length);
        }
      }
      
      setEmployees(employeeList);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const existingIds = position.user_infos?.map(ui => ui.id) || [];
    const newIds = selectedUserInfoIds || [];
    const mergedIds = [...new Set([...existingIds, ...newIds])];
    
    onSubmit(mergedIds);
  };

  const handleEmployeeChange = (selectedValues: string[]) => {
    const userInfoIds = selectedValues.map(v => parseInt(v));
    setSelectedUserInfoIds(userInfoIds);
    onClearError('user_info_ids');
    setLocalErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.user_info_ids;
      return newErrors;
    });
  };

  const allErrors = { ...localErrors, ...errors };

  const combinedUserInfos = [...userInfos, ...fetchedUserInfos].reduce((acc, ui) => {
    if (!acc.find(existing => existing.user_id === ui.user_id)) {
      acc.push(ui);
    }
    return acc;
  }, [] as typeof userInfos);

  const availableEmployees = employees.filter((employee) => {
    const userInfo = combinedUserInfos.find(ui => ui.user_id === employee.id);
    const userInfoId = userInfo && 'id' in userInfo ? userInfo.id : null;
    const existingIds = position.user_infos?.map(ui => ui.id) || [];
    
    if (!userInfoId) {
      console.warn('Skipping employee without userInfo:', employee.id, employee.email);
      return false;
    }
    
    return !existingIds.includes(userInfoId);
  });
  
  console.log('Add Employees Modal Debug:', {
    totalEmployees: employees.length,
    availableEmployees: availableEmployees.length,
    propUserInfosCount: userInfos.length,
    fetchedUserInfosCount: fetchedUserInfos.length,
    combinedUserInfosCount: combinedUserInfos.length,
    positionBranchId: position?.branch_id,
    existingUserInfoIds: position.user_infos?.map(ui => ui.id) || []
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Employees</DialogTitle>
          <DialogDescription>
            Add employees to this position.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Employees - MultiSelect */}
            <div className="space-y-2">
              <Label htmlFor="employee-select">
                Select Employees <span className="text-muted-foreground text-xs">(Optional)</span>
              </Label>
              {loadingEmployees ? (
                <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                  Loading employees...
                </div>
              ) : availableEmployees.length === 0 ? (
                <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                  No employees found in this branch
                </div>
              ) : (
                <MultiSelect
                  options={availableEmployees
                    .map((employee) => {
                      const userInfo = combinedUserInfos.find(ui => ui.user_id === employee.id);
                      const userInfoId = userInfo && 'id' in userInfo ? userInfo.id : null;
                      
                      if (!userInfoId) {
                        console.error('Employee in availableEmployees without userInfoId:', employee);
                        return null;
                      }
                      
                      return {
                        value: userInfoId.toString(),
                        label: getEmployeeDisplayName(employee),
                      };
                    })
                    .filter((opt): opt is { value: string; label: string } => opt !== null)}
                  value={selectedUserInfoIds.map(id => id.toString())}
                  onChange={handleEmployeeChange}
                  searchPlaceholder="Search employees..."
                  disabled={loading}
                  maxHeight="200px"
                  emptyLabel="Click to add new employees"
                />
              )}
              {allErrors.user_info_ids && (
                <p className="text-sm text-destructive">{allErrors.user_info_ids}</p>
              )}
            </div>

            {allErrors.general && (
              <p className="text-sm text-destructive">{allErrors.general}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Employees
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
