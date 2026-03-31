'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader } from '@/components/ui/loader';
import { EmptyStates } from '@/components/ui/empty-state';
import { PaginationInfos } from '@/components/ui/pagination-info';
import { useToast } from '@/hooks/use-toast';
import { colaService, type ColaEntry } from './services/cola-service';
import { userService, type UserEntity } from '@/app/management/users/services/userService';
import { MoreVertical, Plus, RefreshCw, Search, Trash2, Edit } from 'lucide-react';
import { AddColaModal, type ColaEmployeeOption } from './components/add-cola-modal';
import { EditColaModal } from './components/edit-cola-modal';
import { DeleteColaModal } from './components/delete-cola-modal';

export default function ColaPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<ColaEntry[]>([]);
  const [savingUserIds, setSavingUserIds] = useState<Record<number, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalAmount, setModalAmount] = useState<string>('');
  const [availableEmployees, setAvailableEmployees] = useState<ColaEmployeeOption[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [activeEntry, setActiveEntry] = useState<ColaEntry | null>(null);

  const employeeName = (row: ColaEntry): string => {
    const first = row.first_name ?? '';
    const last = row.last_name ?? '';
    const full = [first, last].filter(Boolean).join(' ').trim();
    return full || row.email;
  };

  const formatAmount = (amount: number): string => {
    const safe = Number.isFinite(amount) ? amount : 0;
    return safe.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const PER_PAGE = 200;
      const MAX_PAGES = 50;
      let page = 1;
      const fetchedUsers: UserEntity[] = [];

      while (page <= MAX_PAGES) {
        const { users, pagination } = await userService.getAll(page, PER_PAGE);
        fetchedUsers.push(...(users || []));

        const hasMore = Boolean(pagination?.has_more_pages);
        const lastPage = pagination?.last_page ?? 1;
        if (hasMore) {
          page += 1;
          continue;
        }
        if (Number.isFinite(lastPage) && page < lastPage) {
          page += 1;
          continue;
        }
        if ((users || []).length === PER_PAGE) {
          page += 1;
          continue;
        }
        break;
      }

      const mapped = (fetchedUsers || []).map((u) => {
        const first = u.user_info?.first_name ?? '';
        const last = u.user_info?.last_name ?? '';
        const displayName = [first, last].filter(Boolean).join(' ').trim() || u.name || u.email;
        return { id: u.id, name: displayName, email: u.email };
      });

      setAvailableEmployees(mapped);
    } catch (err: any) {
      setAvailableEmployees([]);
      toast({
        title: 'Error',
        description: err?.response?.data?.message || err?.message || 'Failed to load employees',
        variant: 'destructive',
      });
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const data = await colaService.getAll();
      setEntries(data);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || err?.message || 'Failed to load COLA',
        variant: 'destructive',
      });
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  useEffect(() => {
    const handleContextChange = () => {
      setSearchTerm('');
      setCurrentPage(1);
      setAddModalOpen(false);
      setEditModalOpen(false);
      setDeleteModalOpen(false);
      setActiveEntry(null);
      setModalAmount('');
      fetchEntries();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'branch_context' || e.key === 'tenant_context') {
        handleContextChange();
      }
    };

    window.addEventListener('branchChanged', handleContextChange);
    window.addEventListener('tenantChanged', handleContextChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('branchChanged', handleContextChange);
      window.removeEventListener('tenantChanged', handleContextChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const isSaving = (userId: number): boolean => Boolean(savingUserIds[userId]);

  const openAddModal = async () => {
    setAddModalOpen(true);
    if (availableEmployees.length === 0) {
      await fetchEmployees();
    }
  };

  const openEditModal = (row: ColaEntry) => {
    setActiveEntry(row);
    setModalAmount(String(Number.isFinite(row.amount) ? row.amount : 0));
    setEditModalOpen(true);
  };

  const handleSaveBulkAdd = async (items: Array<{ user_id: number; amount: number }>) => {
    if (items.length === 0) return;
    setModalSaving(true);
    try {
      const results = await Promise.allSettled(items.map((i) => colaService.upsert(i)));
      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failCount = results.length - successCount;

      toast({
        title: 'Saved',
        description: failCount > 0 ? `${successCount} saved, ${failCount} failed.` : `${successCount} saved.`,
      });
      await fetchEntries();
      setAddModalOpen(false);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || err?.message || 'Failed to save COLA',
        variant: 'destructive',
      });
    } finally {
      setModalSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!activeEntry?.cola_id) return;
    const parsed = modalAmount.trim() === '' ? 0 : Number(modalAmount);
    const amount = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;

    setModalSaving(true);
    setSavingUserIds((prev) => ({ ...prev, [activeEntry.user_id]: true }));
    try {
      await colaService.update(activeEntry.cola_id, amount);
      toast({ title: 'Saved', description: `COLA updated for ${employeeName(activeEntry)}` });
      await fetchEntries();
      setEditModalOpen(false);
      setActiveEntry(null);
      setModalAmount('');
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || err?.message || 'Failed to update COLA',
        variant: 'destructive',
      });
    } finally {
      setSavingUserIds((prev) => ({ ...prev, [activeEntry.user_id]: false }));
      setModalSaving(false);
    }
  };

  const handleDelete = async (row: ColaEntry) => {
    setActiveEntry(row);
    setDeleteModalOpen(true);
  };

  const filteredEntries = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return entries;

    return entries.filter((row) => {
      const fullName = employeeName(row).toLowerCase();
      const email = row.email.toLowerCase();
      const userIdStr = String(row.user_id);
      return fullName.includes(q) || email.includes(q) || userIdStr.includes(q);
    });
  }, [entries, searchTerm]);

  const totalItems = filteredEntries.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const from = totalItems ? (currentPage - 1) * itemsPerPage + 1 : null;
  const to = totalItems ? Math.min(currentPage * itemsPerPage, totalItems) : null;

  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  return (
    <div className="container mx-auto py-6 px-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
              <Button
                onClick={fetchEntries}
                size="sm"
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              <Button onClick={openAddModal} size="sm" className="flex items-center gap-2 flex-1 sm:flex-none">
                <Plus className="h-4 w-4" />
                Add COLA
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader size="md" />
            </div>
          ) : filteredEntries.length === 0 ? (
            <EmptyStates.Generic
              title={entries.length === 0 ? 'No employees found' : 'No results'}
              description={
                entries.length === 0
                  ? 'There are no employees available for this branch.'
                  : 'No employees match your search.'
              }
            />
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="whitespace-nowrap">Employee</TableHead>
                      <TableHead className="whitespace-nowrap">Email</TableHead>
                      <TableHead className="text-right whitespace-nowrap">COLA Amount</TableHead>
                      <TableHead className="w-[70px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedEntries.map((row) => (
                      <TableRow key={row.user_id} className="hover:bg-transparent">
                        <TableCell>
                          <div className="font-medium">{employeeName(row)}</div>
                          <div className="text-xs text-muted-foreground">{row.user_id}</div>
                        </TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell className="text-right">
                        <span className="tabular-nums">{formatAmount(row.amount)}</span>
                        </TableCell>
                        <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => openEditModal(row)}
                              disabled={isSaving(row.user_id)}
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(row)}
                                disabled={isSaving(row.user_id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between items-center mt-6">
                <PaginationInfos.Standard
                  from={from}
                  to={to}
                  total={totalItems}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={(value) => setItemsPerPage(parseInt(value, 10))}
                />

                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1))
                      .map((page, idx, arr) => {
                        const prev = arr[idx - 1];
                        const showEllipsis = prev && page - prev > 1;
                        return (
                          <div key={page} className="flex items-center">
                            {showEllipsis && (
                              <PaginationItem>
                                <PaginationEllipsis />
                              </PaginationItem>
                            )}
                            <PaginationItem>
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          </div>
                        );
                      })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AddColaModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        loadingEmployees={loadingEmployees}
        employees={availableEmployees}
        onSave={handleSaveBulkAdd}
      />

      <EditColaModal
        open={editModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditModalOpen(false);
            setActiveEntry(null);
            setModalAmount('');
            return;
          }
          setEditModalOpen(true);
        }}
        saving={modalSaving}
        employeeLabel={activeEntry ? employeeName(activeEntry) : ''}
        amount={modalAmount}
        onAmountChange={setModalAmount}
        onSave={handleSaveEdit}
      />

      <DeleteColaModal
        open={deleteModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteModalOpen(false);
            setActiveEntry(null);
            return;
          }
          setDeleteModalOpen(true);
        }}
        saving={modalSaving}
        employeeLabel={activeEntry ? employeeName(activeEntry) : ''}
        onConfirm={async () => {
          if (!activeEntry?.cola_id) return;
          setModalSaving(true);
          try {
            await colaService.delete(activeEntry.cola_id);
            toast({ title: 'Deleted', description: `COLA removed for ${employeeName(activeEntry)}` });
            await fetchEntries();
            setDeleteModalOpen(false);
            setActiveEntry(null);
          } catch (err: any) {
            toast({
              title: 'Error',
              description: err?.response?.data?.message || err?.message || 'Failed to delete COLA',
              variant: 'destructive',
            });
          } finally {
            setModalSaving(false);
          }
        }}
      />
    </div>
  );
}

