'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, Loader2, ChevronDown, LogOut } from 'lucide-react';
import { branchService, Branch } from '../services/branchService';
import { managementService } from '@/services/management/managementService';
import { useToast } from '@/hooks/use-toast';
import { Loader } from '@/components/ui/loader';

interface Employee {
  user_id: number;
  email: string;
  name: string | null;
  role?: string | null;
}

interface BranchEmployeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: number;
  branchName: string;
  tenantId: number;
  onEmployeeTransferred?: (sourceBranchId: number, destinationBranchId: number) => void;
}

export function BranchEmployeesModal({
  isOpen,
  onClose,
  branchId,
  branchName,
  tenantId,
  onEmployeeTransferred,
}: BranchEmployeesModalProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [totalBranchesCount, setTotalBranchesCount] = useState<number>(0); // Total branches for the tenant
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [transferring, setTransferring] = useState<Map<number, boolean>>(new Map());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingTransfer, setPendingTransfer] = useState<{
    userId: number;
    userName: string;
    newBranchId: number;
    newBranchName: string;
  } | null>(null);
  const { toast } = useToast();

  // Fetch employees for the current branch
  const fetchEmployees = async () => {
    setEmployeesLoading(true);
    try {
      const response = await branchService.getEmployees(branchId);
      if (response && response.users && Array.isArray(response.users)) {
        setEmployees(response.users);
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      setEmployees([]);
      toast({
        title: "Error",
        description: "Failed to load employees for this branch.",
        variant: "destructive"
      });
    } finally {
      setEmployeesLoading(false);
    }
  };

  // Fetch branches for the tenant (excluding current branch)
  const fetchBranches = async () => {
    setBranchesLoading(true);
    try {
      console.log('🔍 Fetching branches for tenant:', tenantId, 'excluding branch:', branchId);
      
      // Get all branches for the tenant
      const allBranches = await managementService.fetchTenantBranches(tenantId);
      
      console.log('📦 All branches fetched:', allBranches);
      console.log('📊 Total branches count:', allBranches.length);
      console.log('🆔 Current branch ID (type):', branchId, typeof branchId);
      
      // Store total count of branches for this tenant
      setTotalBranchesCount(allBranches.length);
      
      // Filter out the current branch and map to Branch type
      // Use strict comparison with type conversion to handle string/number mismatches
      const otherBranches: Branch[] = allBranches
        .filter(branch => {
          const branchIdNum = Number(branch.id);
          const currentBranchIdNum = Number(branchId);
          const isMatch = branchIdNum === currentBranchIdNum;
          console.log(`🔎 Comparing branch ${branch.id} (${typeof branch.id}) with current ${branchId} (${typeof branchId}): ${isMatch ? 'MATCH - EXCLUDING' : 'DIFFERENT - INCLUDING'}`);
          return !isMatch;
        })
        .map((branch) => ({
          id: branch.id,
          tenant_id: branch.tenant_id || tenantId,
          name: branch.name,
          email: branch.email || '',
          contact_no: branch.contact_no || '',
          address: null, // Management service doesn't return full address
          created_at: '',
          updated_at: '',
        }));
      
      console.log('✅ Other branches after filtering:', otherBranches);
      console.log('📊 Other branches count:', otherBranches.length);
      
      setBranches(otherBranches);
    } catch (error) {
      console.error('❌ Failed to fetch branches:', error);
      setBranches([]);
      setTotalBranchesCount(0);
    } finally {
      setBranchesLoading(false);
    }
  };

  // Handle branch selection - show confirmation dialog
  const handleBranchSelect = (userId: number, userName: string, newBranchId: number, newBranchName: string) => {
    setPendingTransfer({
      userId,
      userName,
      newBranchId,
      newBranchName,
    });
    setShowConfirmDialog(true);
  };

  // Handle confirmed employee transfer to a new branch
  const handleTransfer = async () => {
    if (!pendingTransfer) return;

    const { userId, newBranchId, newBranchName } = pendingTransfer;
    
    // Close confirmation dialog
    setShowConfirmDialog(false);
    
    // Set transferring state
    setTransferring(prev => new Map(prev).set(userId, true));

    try {
      // Transfer user: remove from current branch, add to new branch
      await branchService.transferUserToBranch(branchId, newBranchId, userId);

      // Remove employee from local state (they're now in the new branch)
      setEmployees(prev => prev.filter(emp => emp.user_id !== userId));

      // Show success message
      toast({
        title: "Employee Transferred",
        description: `Employee has been transferred to ${newBranchName}.`,
        variant: "success"
      });

      // Call callback if provided, passing both source and destination branch IDs
      if (onEmployeeTransferred) {
        onEmployeeTransferred(branchId, newBranchId);
      }
    } catch (error: any) {
      console.error('Failed to transfer employee:', error);
      
      // Determine error message
      let errorMessage = "Failed to transfer employee.";
      if (error?.response?.status === 409) {
        errorMessage = "Employee is already assigned to this branch.";
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast({
        title: "Transfer Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      // Clear transferring state and pending transfer
      setTransferring(prev => {
        const newMap = new Map(prev);
        newMap.delete(userId);
        return newMap;
      });
      setPendingTransfer(null);
    }
  };

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen && branchId && tenantId) {
      console.log('🚀 Modal opened - Fetching data for branch:', branchId, 'tenant:', tenantId);
      fetchEmployees();
      fetchBranches();
    } else if (isOpen) {
      console.warn('⚠️ Modal opened but missing required data:', { branchId, tenantId });
    }
  }, [isOpen, branchId, tenantId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Branch Employees</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Employees assigned to "{branchName}" branch.
          </DialogDescription>
          {!employeesLoading && (
            <div className="text-sm text-muted-foreground mt-1">
              Total: {employees.length} employee{employees.length !== 1 ? 's' : ''}
            </div>
          )}
        </DialogHeader>
        
        <div className="max-h-[60vh] overflow-y-auto">
          {employeesLoading ? (
            <div className="flex justify-center py-8">
              <Loader />
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No employees assigned to this branch.</p>
            </div>
          ) : (
            <div className="space-y-4 my-2 mx-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => {
                    const isTransferring = transferring.get(employee.user_id) || false;
                    const hasOtherBranches = branches.length > 0;
                    const isOnlyOneBranch = totalBranchesCount === 1;

                    return (
                      <TableRow key={employee.user_id}>
                        <TableCell className="font-medium">
                          {employee.name || 'N/A'}
                        </TableCell>
                        <TableCell>{employee.email || '—'}</TableCell>
                        <TableCell>{employee.role || '—'}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                disabled={isTransferring || branchesLoading}
                              >
                                {isTransferring ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  </>
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              {isOnlyOneBranch ? (
                                <DropdownMenuItem disabled>
                                  No other branch found
                                </DropdownMenuItem>
                              ) : hasOtherBranches ? (
                                branches.map((branch) => (
                                  <DropdownMenuItem
                                    key={branch.id}
                                    onClick={() => handleBranchSelect(employee.user_id, employee.name || 'Employee', branch.id, branch.name)}
                                    disabled={isTransferring}
                                    className="flex items-center gap-2"
                                  >
                                    <LogOut className="h-4 w-4 text-muted-foreground" />
                                    <span>{branch.name}</span>
                                  </DropdownMenuItem>
                                ))
                              ) : (
                                <DropdownMenuItem disabled>
                                  No available
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={employeesLoading}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
      
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Branch Transfer</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingTransfer && (
                <>
                  Are you sure you want to transfer <strong>{pendingTransfer.userName}</strong> from <strong>{branchName}</strong> to <strong>{pendingTransfer.newBranchName}</strong>?
                  <br />
                  <br />
                  The employee will be moved to the new branch and will no longer be assigned to the current branch.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingTransfer(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleTransfer}>
              Confirm Transfer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

