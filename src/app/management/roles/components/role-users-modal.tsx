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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useToast } from '@/hooks/use-toast';
import { tenantService } from '@/app/management/tenants/services/tenantService';

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
  onTransferOwnershipCompleted?: () => Promise<void> | void;
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
  onTransferOwnershipCompleted,
}: RoleUsersModalProps) {
  const selectedRoleId = selectedRole?.id?.toString() ?? '';
  const selectDefaultValue = selectedRoleId;
  const selectedRoleSlug = selectedRole?.slug?.toLowerCase() ?? '';
  const isOwnerRole = selectedRoleSlug === 'owner';
  const { toast } = useToast();
  const [transferStep, setTransferStep] = React.useState<'select' | 'confirm' | 'executing'>('select');
  const [transferPreview, setTransferPreview] = React.useState<any | null>(null);
  const [transferPassword, setTransferPassword] = React.useState('');
  const [transferError, setTransferError] = React.useState<string | null>(null);
  const [transferLoading, setTransferLoading] = React.useState(false);
  const [transferProgress, setTransferProgress] = React.useState(0);
  const transferProgressTimerRef = React.useRef<number | null>(null);

  const closeTransferFlow = () => {
    setTransferStep('select');
    setTransferPreview(null);
    setTransferPassword('');
    setTransferError(null);
    setTransferLoading(false);
    setTransferProgress(0);
    if (transferProgressTimerRef.current) {
      window.clearInterval(transferProgressTimerRef.current);
      transferProgressTimerRef.current = null;
    }
  };

  React.useEffect(() => {
    if (!open) {
      closeTransferFlow();
    }
  }, [open]);

  const handleOwnerTransferPreview = async () => {
    if (!selectedUserIdToAdd) return;
    const targetUserId = parseInt(selectedUserIdToAdd, 10);
    if (Number.isNaN(targetUserId)) return;

    setTransferError(null);
    setTransferLoading(true);
    try {
      const response = await (tenantService as any).previewTransferOwner(targetUserId);
      const preview = response?.preview ?? response;
      setTransferPreview(preview);
      setTransferStep('confirm');
    } catch (err: any) {
      setTransferError(err?.response?.data?.message || err?.message || 'Failed to load transfer preview.');
    } finally {
      setTransferLoading(false);
    }
  };

  const handleOwnerTransferConfirm = async () => {
    if (!selectedUserIdToAdd) return;
    const targetUserId = parseInt(selectedUserIdToAdd, 10);
    if (Number.isNaN(targetUserId)) return;
    if (!transferPassword) {
      setTransferError('Please confirm your password.');
      return;
    }

    setTransferError(null);
    setTransferLoading(true);
    setTransferStep('executing');
    setTransferProgress(1);

    if (transferProgressTimerRef.current) {
      window.clearInterval(transferProgressTimerRef.current);
      transferProgressTimerRef.current = null;
    }

    transferProgressTimerRef.current = window.setInterval(() => {
      setTransferProgress((prev) => {
        if (prev >= 99) return prev;
        return Math.min(99, prev + 1);
      });
    }, 35);

    try {
      await (tenantService as any).confirmTransferOwner(targetUserId, transferPassword);
      if (transferProgressTimerRef.current) {
        window.clearInterval(transferProgressTimerRef.current);
        transferProgressTimerRef.current = null;
      }
      setTransferProgress(100);
      setTimeout(() => window.location.reload(), 500);
      toast({
        title: 'Success',
        description: 'Ownership transferred successfully.',
        variant: 'success',
      });

      await onTransferOwnershipCompleted?.();
      closeTransferFlow();
      onClose();
    } catch (err: any) {
      setTransferError(err?.response?.data?.message || err?.message || 'Failed to transfer ownership.');
      setTransferStep('confirm');
    } finally {
      setTransferLoading(false);
      if (transferProgressTimerRef.current) {
        window.clearInterval(transferProgressTimerRef.current);
        transferProgressTimerRef.current = null;
      }
    }
  };

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
                            defaultValue={selectDefaultValue}
                            onValueChange={(value) => {
                              if (isOwnerRole) return
                              onChangeUserRole(user.id, parseInt(value))
                            }}
                          >
                            <SelectTrigger className="w-full" disabled={isOwnerRole}>
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
              <h3 className="text-sm font-semibold">
                {isOwnerRole ? 'Transfer Ownership' : 'Add User to this Role'}
              </h3>
              {isOwnerRole && (
                <p className="text-xs text-muted-foreground">
                  This transfer will update ownership for all linked tenants. Previous owners will be demoted to Employee (when they no longer own any tenant).
                </p>
              )}

              {isOwnerRole && transferStep === 'executing' ? (
                <div className="space-y-4 rounded-md border p-4">
                  <div className="flex items-center justify-center">
                    <Loader size="md" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Transferring ownership</p>
                    <p className="text-xs text-muted-foreground">{transferProgress}%</p>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-150"
                      style={{ width: `${transferProgress}%` }}
                    />
                  </div>
                </div>
              ) : isOwnerRole && transferStep === 'confirm' && transferPreview ? (
                <div className="space-y-3">
                  <div className="rounded-md border p-3">
                    <p className="text-sm font-medium">Affected tenants/companies</p>
                    <div className="mt-2 space-y-2">
                      {transferPreview?.affected_tenants?.map((t: any) => (
                        <div key={t.id} className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{t.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Branches: {t.branches_count} • Current owner: {t.current_owner_name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Target: {transferPreview?.target_user?.current_role_slug || 'employee'} → owner.
                      Previous owners will be demoted to employee if they no longer own any tenant.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transfer_password">Confirm password</Label>
                    <Input
                      id="transfer_password"
                      type="password"
                      value={transferPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setTransferPassword(e.target.value);
                        setTransferError(null);
                      }}
                      disabled={transferLoading}
                    />
                    {transferError && <p className="text-red-500 text-xs">{transferError}</p>}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => closeTransferFlow()}
                      disabled={transferLoading}
                      className="sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <PermissionButton
                      module={isOwnerRole ? 'tenants' : 'roles'}
                      action="create"
                      type="button"
                      disabled={transferLoading || formLoading}
                      onClick={handleOwnerTransferConfirm}
                      className="sm:w-auto"
                    >
                      {transferLoading ? 'Transferring...' : 'Confirm Transfer'}
                    </PermissionButton>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select
                    value={selectedUserIdToAdd}
                    onValueChange={(value) => onChangeSelectedUserId(value)}
                  >
                    <SelectTrigger className="w-full sm:w-80">
                      <SelectValue
                        placeholder={isOwnerRole ? 'Select a new owner...' : 'Select a user to assign...'}
                      />
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
                    module={isOwnerRole ? 'tenants' : 'roles'}
                    action="create"
                    type="button"
                    disabled={formLoading || transferLoading || !selectedUserIdToAdd}
                    onClick={isOwnerRole ? handleOwnerTransferPreview : onAssignUser}
                    className="sm:w-auto"
                  >
                    {transferLoading
                      ? 'Loading...'
                      : formLoading
                        ? isOwnerRole
                          ? 'Transferring...'
                          : 'Assigning...'
                        : isOwnerRole
                          ? 'Transfer Ownership'
                          : 'Assign User'}
                  </PermissionButton>
                </div>
              )}

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

