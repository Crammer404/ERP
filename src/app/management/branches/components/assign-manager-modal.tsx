'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus } from 'lucide-react';
import { branchService, Branch } from '../services/branch-service';
import { type Role, type UserEntity, userService } from '@/app/management/users/services/userService';
import { UserFormModal } from '@/app/management/users/components/user-form-modal';
import { useToast } from '@/hooks/use-toast';

interface AssignManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch: Branch;
  onAssigned: (branch: Branch) => void;
}

export function AssignManagerModal({
  isOpen,
  onClose,
  branch,
  onAssigned,
}: AssignManagerModalProps) {
  const [users, setUsers] = useState<UserEntity[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<number | null>(branch.manager?.id ?? null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [createUserErrors, setCreateUserErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelectedManagerId(branch.manager?.id ?? null);
    setErrors({});

    void loadUsers();
    void loadRoles();
  }, [isOpen, branch, toast]);

  const loadUsers = async () => {
    try {
      const response = await branchService.getEmployees(branch.id);
      const branchUsers = Array.isArray(response.users) ? response.users : [];

      const currentManagerId = branch.manager?.id;
      const hasCurrentManager = currentManagerId != null && branchUsers.some((user) => user.user_id === currentManagerId);

      const branchUserOptions: UserEntity[] = branchUsers.map((user) => ({
        id: user.user_id,
        name: user.name || user.email || '',
        email: user.email ?? '',
        role: typeof user.role === 'string' ? user.role : (user.role?.name ?? ''),
        user_info: user.user?.user_info ?? undefined,
      }));

      setUsers(
        hasCurrentManager || currentManagerId == null
          ? branchUserOptions
          : [
              ...branchUserOptions,
              {
                id: currentManagerId,
                name: branch.manager?.name || branch.manager?.email || 'Manager',
                email: branch.manager?.email ?? '',
                role: branch.manager?.role ?? 'Manager',
              },
            ]
      );
    } catch (error) {
      console.error('Failed to load branch users for manager assignment:', error);
      toast({
        title: 'Failed to load branch users',
        description: 'Unable to fetch branch users at this time.',
        variant: 'destructive',
      });
    }
  };

  const loadRoles = async () => {
    setRolesLoading(true);
    try {
      const fetchedRoles = await userService.getRoles();
      setRoles(Array.isArray(fetchedRoles) ? fetchedRoles : []);
    } catch (error) {
      console.error('Failed to load user roles:', error);
      toast({
        title: 'Failed to load user roles',
        description: 'Unable to fetch roles for new user creation.',
        variant: 'destructive',
      });
    } finally {
      setRolesLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});

    if (selectedManagerId === null) {
      // Allow unassigning the manager, no validation error needed.
    }

    setLoading(true);
    try {
      const updatedBranch = await branchService.update(branch.id, {
        user_id: selectedManagerId,
      });

      toast({
        title: 'Branch Manager Updated',
        description: selectedManagerId
          ? 'Manager assigned successfully.'
          : 'Manager unassigned successfully.',
        variant: 'success',
      });

      onAssigned(updatedBranch);
    } catch (error: any) {
      console.error('Failed to assign manager:', error);
      const message = error?.response?.data?.message || 'Failed to assign branch manager.';
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData: any) => {
    setCreateUserLoading(true);
    setCreateUserErrors({});

    try {
      const payrollPositionId = Number(userData.user_info?.payroll_positions_id);
      const payload = {
        email: userData.email.trim(),
        password: userData.password,
        password_confirmation: userData.confirmPassword,
        role_id: userData.role,
        branch_ids: [branch.id],
        user_info: {
          first_name: userData.user_info.first_name.trim(),
          last_name: userData.user_info.last_name.trim(),
          ...(userData.user_info.middle_name?.trim()
            ? { middle_name: userData.user_info.middle_name.trim() }
            : {}),
          ...(Number.isFinite(payrollPositionId) && payrollPositionId > 0
            ? { payroll_positions_id: payrollPositionId }
            : {}),
          ...(userData.user_info.address && Object.keys(userData.user_info.address).length > 0
            ? { address: userData.user_info.address }
            : {}),
        },
      };

      const createdUser = await userService.create(payload);
      toast({
        title: 'User Created',
        description: 'Branch manager user created successfully.',
        variant: 'success',
      });
      setIsCreateUserOpen(false);
      await loadUsers();
      if (createdUser?.id) {
        setSelectedManagerId(createdUser.id);
      }
    } catch (error: any) {
      console.error('Failed to create user:', error);
      const apiErrors: Record<string, string> = {};
      const validationErrors = error?.response?.data?.errors;

      if (validationErrors && typeof validationErrors === 'object') {
        for (const key in validationErrors) {
          const messages = validationErrors[key];
          if (Array.isArray(messages) && messages[0]) {
            apiErrors[key] = messages[0];
          } else if (typeof messages === 'string') {
            apiErrors[key] = messages;
          }
        }
      }

      if (Object.keys(apiErrors).length === 0) {
        apiErrors.general = error?.response?.data?.message || 'Failed to create user.';
      }

      setCreateUserErrors(apiErrors);
    } finally {
      setCreateUserLoading(false);
    }
  };

  const branchManagerRole = roles.find((role) => role.name.toLowerCase() === 'branch manager');

  const forceRole = useMemo(
    () =>
      branchManagerRole
        ? { id: branchManagerRole.id.toString(), name: branchManagerRole.name }
        : undefined,
    [branchManagerRole]
  );

  const createUserInitialData = useMemo(
    () => ({
      role: branchManagerRole?.id.toString() ?? '',
      branch_ids: [branch.id.toString()],
    }),
    [branch.id, branchManagerRole?.id]
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Assign Branch Manager</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Select a manager for the branch &quot;{branch.name}&quot;, or choose Unassigned to remove the current manager.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4 my-2 mx-2">
            <div className="space-y-2">
              <Label htmlFor="current-manager">Current Manager</Label>
              <div className="rounded-md border border-input bg-secondary px-3 py-2 text-sm text-muted-foreground">
                {branch.manager ? (
                  <div>
                    <div>{branch.manager.name || 'Manager'}</div>
                    <div className="text-xs text-muted-foreground">{branch.manager.email || '—'}</div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">None assigned</div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manager-select">Select Manager</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Select
                    value={selectedManagerId != null ? String(selectedManagerId) : 'unassigned'}
                    onValueChange={(value) => setSelectedManagerId(value === 'unassigned' ? null : Number(value))}
                  >
                    <SelectTrigger id="manager-select" className="w-full">
                      <SelectValue placeholder="Choose a manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users.map((user) => {
                        const initials = user.name
                          ? user.name
                              .trim()
                              .split(" ")
                              .filter(Boolean)
                              .map((part) => part[0].toUpperCase())
                              .slice(0, 2)
                              .join("")
                          : "U";

                        const roleLabel =
                          typeof user.role === 'string'
                            ? user.role
                            : typeof user.role === 'number'
                              ? `Role #${user.role}`
                              : user.role?.name ?? '';

                        return (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground whitespace-nowrap">
                                {roleLabel ? `${roleLabel} -` : ''}
                              </span>
                              <Avatar className="h-8 w-8 shrink-0">
                                {user.user_info?.profile_pic ? (
                                  <AvatarImage src={user.user_info.profile_pic} alt={user.name ?? 'User avatar'} />
                                ) : (
                                  <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                                    {initials}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <span className="truncate text-sm">{user.name || user.email}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                {users.length === 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-10 min-w-[40px] rounded-md p-0"
                    onClick={() => setIsCreateUserOpen(true)}
                    disabled={rolesLoading || !branchManagerRole}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {errors.general && <p className="text-red-500 text-xs">{errors.general}</p>}
            </div>
          </form>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading} onClick={handleSubmit} className="min-w-[100px]">
            {loading ? 'Saving...' : 'Save Manager'}
          </Button>
        </DialogFooter>
      </DialogContent>

      <UserFormModal
        isOpen={isCreateUserOpen}
        onClose={() => setIsCreateUserOpen(false)}
        mode="create"
        roles={roles}
        activeBranchId={branch.id}
        activeBranchName={branch.name}
        initialData={createUserInitialData}
        forceRole={forceRole}
        onSubmit={handleCreateUser}
        loading={createUserLoading}
        errors={createUserErrors}
      />
    </Dialog>
  );
}
