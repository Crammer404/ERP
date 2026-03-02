import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader } from '@/components/ui/loader';
import type { Role } from '../services/role-service';
import type { UserData } from '@/components/ui/user-avatar-stack';
import { PermissionButton } from '@/components/guards';

interface RoleUsersModalProps {
  open: boolean;
  selectedRole: Role | null;
  loading: boolean;
  roleUsers: UserData[];
  allUsers: UserData[];
  roles: Role[];
  selectedUserIdToAdd: string;
  formLoading: boolean;
  onClose: () => void;
  onChangeUserRole: (userId: number, roleId: number) => void;
  onChangeSelectedUserId: (value: string) => void;
  onAssignUser: () => void;
}

export function RoleUsersModal({
  open,
  selectedRole,
  loading,
  roleUsers,
  allUsers,
  roles,
  selectedUserIdToAdd,
  formLoading,
  onClose,
  onChangeUserRole,
  onChangeSelectedUserId,
  onAssignUser,
}: RoleUsersModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage Users for {selectedRole?.name}</DialogTitle>
          <DialogDescription>
            View and update users assigned to this role, or move them to a different role.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader size="md" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Current Users</h3>
              {roleUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users currently assigned to this role.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="w-48">Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roleUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Select
                            defaultValue={selectedRole?.id.toString() || ''}
                            onValueChange={(value) => onChangeUserRole(user.id, parseInt(value))}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.map((role) => (
                                <SelectItem key={role.id} value={role.id.toString()}>
                                  {role.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Add User to this Role</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select
                  value={selectedUserIdToAdd}
                  onValueChange={(value) => onChangeSelectedUserId(value)}
                >
                  <SelectTrigger className="w-full sm:w-80">
                    <SelectValue placeholder="Select a user to assign..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allUsers
                      .filter((user) => !roleUsers.some((ru) => ru.id === user.id))
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <PermissionButton
                  module="roles"
                  action="update"
                  type="button"
                  disabled={formLoading || !selectedUserIdToAdd}
                  onClick={onAssignUser}
                  className="sm:w-auto"
                >
                  {formLoading ? 'Assigning...' : 'Assign User'}
                </PermissionButton>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

