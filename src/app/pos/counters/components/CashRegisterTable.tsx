'use client';

import { useEffect, useState } from 'react';
import {
  DataTable,
  DataTableHeader,
  DataTableHead,
  DataTableBody,
  DataTableRow,
  DataTableCell,
  DataTableFooter,
  StatusDot,
} from '@/components/ui/data-table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { PaginationInfos } from '@/components/ui/pagination-info';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Edit, Trash2, Play, Square, BookOpen, Power } from 'lucide-react';
import { UserAvatarStack, UserData } from '@/components/ui/user-avatar-stack';
import type { CashRegister } from '../service/cashRegisterService';

interface PaginationProps {
  from: number;
  to: number;
  total: number;
  itemsPerPage: number;
  onItemsPerPageChange: (value: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface CashRegisterTableProps {
  cashRegisters: CashRegister[];
  onEdit?: (cashRegister: CashRegister) => void;
  onDelete?: (cashRegister: CashRegister) => void;
  onActivate?: (cashRegister: CashRegister) => void;
  onOpenSession: (cashRegister: CashRegister) => void;
  onCloseSession: (cashRegister: CashRegister) => void;
  onViewLedger: (cashRegister: CashRegister) => void;
  isManager: boolean;
  pagination?: PaginationProps;
}

function formatDuration(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function CashRegisterTable({
  cashRegisters,
  onEdit,
  onDelete,
  onActivate,
  onOpenSession,
  onCloseSession,
  onViewLedger,
  isManager,
  pagination,
}: CashRegisterTableProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const hasAnyOpen = cashRegisters.some((cr) => cr.open_session && cr.open_session.status === 'OPEN');
    if (!hasAnyOpen) {
      return;
    }
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [cashRegisters]);
  const getAssignedUser = (cashRegister: CashRegister) => {
    return cashRegister.assignedUser || (cashRegister as any).assigned_user;
  };

  const getAssignedUserData = (cashRegister: CashRegister): UserData[] => {
    const assignedUser = getAssignedUser(cashRegister);
    if (!assignedUser) return [];
    
    const userInfo = assignedUser.userInfo || assignedUser.user_info;
    const name = userInfo 
      ? `${userInfo.first_name} ${userInfo.last_name}`
      : assignedUser.email || 'Unknown';
    
    return [{
      id: assignedUser.id,
      name,
      email: assignedUser.email
    }];
  };

  const getSessionUser = (cashRegister: CashRegister) => {
    const session = cashRegister.open_session;
    return session?.user;
  };

  const getSessionUserData = (cashRegister: CashRegister): UserData[] => {
    const sessionUser = getSessionUser(cashRegister);
    if (!sessionUser) return [];
    
    const userInfo = sessionUser.userInfo || (sessionUser as any).user_info;
    const name = userInfo 
      ? `${userInfo.first_name} ${userInfo.last_name}`
      : sessionUser.email || 'Unknown';
    
    return [{
      id: sessionUser.id,
      name,
      email: sessionUser.email
    }];
  };

  return (
    <div className="overflow-x-auto">
      <DataTable className="min-w-[980px]">
        <DataTableHeader columns={8}>
        <DataTableHead align="left">Name</DataTableHead>
        <DataTableHead>Cashier</DataTableHead>
        <DataTableHead>Status</DataTableHead>
        <DataTableHead>Session</DataTableHead>
          <DataTableHead>UpTime</DataTableHead>
        <DataTableHead>Current User</DataTableHead>
          <DataTableHead>Ledger</DataTableHead>
        <DataTableHead>Actions</DataTableHead>
      </DataTableHeader>

      <DataTableBody>
        {cashRegisters.map((cashRegister) => {
          const hasOpenSession = cashRegister.open_session?.status === 'OPEN';
          const assignedUserData = getAssignedUserData(cashRegister);
          const sessionUserData = getSessionUserData(cashRegister);
          const uptimeMs =
            hasOpenSession && cashRegister.open_session?.opened_at
              ? now - new Date(cashRegister.open_session.opened_at).getTime()
              : 0;

          return (
            <DataTableRow key={cashRegister.id} columns={8}>
              <DataTableCell label="Name" align="left">
                <span className="font-medium">{cashRegister.name}</span>
              </DataTableCell>
              
              <DataTableCell label="Cashier">
                {assignedUserData.length > 0 ? (
                  <UserAvatarStack 
                    users={assignedUserData}
                    maxVisible={1}
                    size="sm"
                  />
                ) : (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </DataTableCell>
              
              <DataTableCell label="Status">
                <StatusDot 
                  status={cashRegister.is_active ? 'success' : 'error'} 
                  label={cashRegister.is_active ? 'Active' : 'Inactive'} 
                />
              </DataTableCell>
              
              <DataTableCell label="Session">
                {hasOpenSession ? (
                  <Badge variant="default" className="bg-green-600 text-white">
                    <Play className="h-3 w-3 mr-1" />
                    OPEN
                  </Badge>
                ) : (
                  <Badge variant="default" className="bg-red-600 text-white">
                    <Square className="h-3 w-3 mr-1" />
                    CLOSED
                  </Badge>
                )}
              </DataTableCell>

              <DataTableCell label="UpTime">
                {hasOpenSession ? (
                  <span>{formatDuration(uptimeMs)}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </DataTableCell>
              
              <DataTableCell label="Current User">
                {hasOpenSession && sessionUserData.length > 0 ? (
                  <UserAvatarStack 
                    users={sessionUserData}
                    maxVisible={1}
                    size="sm"
                  />
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </DataTableCell>
              
              <DataTableCell label="Ledger">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewLedger(cashRegister)}
                  className="h-8 px-3 text-xs"
                  >
                  <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                    Ledger
                  </Button>
              </DataTableCell>
              
              <DataTableCell label="Actions">
                <div className="flex items-center lg:justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <span className="inline-flex items-center justify-center h-8 w-8 cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted rounded">
                        <MoreVertical className="h-4 w-4" />
                        </span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                      
                      {/* to be continue wahahahahahahaha */}
                      {/* {hasOpenSession ? (
                        <DropdownMenuItem 
                          onClick={() => onCloseSession(cashRegister)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Square className="h-4 w-4 mr-2" />
                          Close Session
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => onOpenSession(cashRegister)}>
                          <Play className="h-4 w-4 mr-2 text-green-600" />
                          Open Session
                        </DropdownMenuItem>
                      )} */}
                      
                      {isManager && (
                        <>
                          <DropdownMenuSeparator />
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(cashRegister)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {!cashRegister.is_active && onActivate && (
                          <DropdownMenuItem
                            onClick={() => onActivate(cashRegister)}
                            className="text-green-600 focus:text-green-600"
                          >
                            <Power className="h-4 w-4 mr-2" />
                            Activate
                          </DropdownMenuItem>
                        )}
                        {cashRegister.is_active && onDelete && (
                          <DropdownMenuItem
                            onClick={() => onDelete(cashRegister)}
                            className="text-red-600 focus:text-red-600"
                          >
                            {(cashRegister.sessions_count ?? 0) > 0 ? (
                              <>
                                <Power className="h-4 w-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                              </>
                            )}
                          </DropdownMenuItem>
                          )}
                        </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              </DataTableCell>
            </DataTableRow>
          );
        })}
      </DataTableBody>

      {pagination && (
        <DataTableFooter>
          <PaginationInfos.Standard
            from={pagination.from}
            to={pagination.to}
            total={pagination.total}
            itemsPerPage={pagination.itemsPerPage}
            onItemsPerPageChange={pagination.onItemsPerPageChange}
          />
          
          {pagination.totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => pagination.onPageChange(Math.max(1, pagination.currentPage - 1))}
                    className={pagination.currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => pagination.onPageChange(page)}
                      isActive={pagination.currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => pagination.onPageChange(Math.min(pagination.totalPages, pagination.currentPage + 1))}
                    className={pagination.currentPage === pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </DataTableFooter>
      )}
    </DataTable>
    </div>
  );
}
