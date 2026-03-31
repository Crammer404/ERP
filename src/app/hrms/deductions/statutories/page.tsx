'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Loader } from '@/components/ui/loader';
import { PaginationInfos } from '@/components/ui/pagination-info';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { EmptyStates } from '@/components/ui/empty-state';
import { MoreVertical, RefreshCw, Search, Plus, Trash2, Pencil } from 'lucide-react';
import { statutoriesService, type StatutoryEntry, type StatutoryType } from './services/statutories-service';
import { useToast } from '@/hooks/use-toast';
import { tenantContextService } from '@/services/tenant/tenantContextService';
import { StatutoryFormModal, type StatutoryEmployeeOption } from './components/statutory-form-modal';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import { managementService } from '@/services/management/managementService';
import { useCurrency } from '@/contexts/CurrencyContext';
import { StatutoryEditModal } from './components/statutory-edit-modal';

interface PaginationResponse {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
  has_more_pages: boolean;
}

const tabDefs: Array<{ key: StatutoryType; label: string }> = [
  { key: 'sss', label: 'SSS' },
  { key: 'philhealth', label: 'PhilHealth' },
  { key: 'pagibig', label: 'Pag-IBIG' },
];

const getEmployeeName = (entry: StatutoryEntry): string => {
  const ui = (entry as any)?.user_info;
  const u = (entry as any)?.user;
  const first = ui?.first_name ?? u?.user_info?.first_name ?? '';
  const last = ui?.last_name ?? u?.user_info?.last_name ?? '';
  const full = `${first} ${last}`.trim();
  if (full) return full;
  return ui?.user?.email ?? u?.email ?? (entry as any)?.employee?.email ?? 'Unknown';
};

export default function StatutoriesPage() {
  const { toast } = useToast();
  const { defaultCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState<StatutoryType>('sss');
  const [entries, setEntries] = useState<StatutoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [employees, setEmployees] = useState<StatutoryEmployeeOption[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StatutoryEntry | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StatutoryEntry | null>(null);

  const [pagination, setPagination] = useState<PaginationResponse>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: null,
    to: null,
    has_more_pages: false,
  });

  const entryCacheKey = (type: StatutoryType, page: number, perPage: number, search: string) =>
    `${type}|${page}|${perPage}|${search.trim().toLowerCase()}`;
  const [entryCache, setEntryCache] = useState<Map<string, { entries: StatutoryEntry[]; pagination: PaginationResponse }>>(
    new Map()
  );

  const currencySymbol = defaultCurrency?.symbol || '₱';
  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  );

  const formatAmount = useCallback(
    (entry: StatutoryEntry) => {
      const raw = typeof entry.amount === 'string' ? Number(entry.amount) : entry.amount;
      const num = Number.isFinite(raw) ? Number(raw) : 0;
      if (entry.is_rate) {
        return `${numberFormatter.format(num * 100)}%`;
      }
      return `${currencySymbol} ${numberFormatter.format(num)}`;
    },
    [currencySymbol, numberFormatter]
  );

  const fetchEntries = useCallback(
    async (type: StatutoryType, page = currentPage, perPage = itemsPerPage, search = searchTerm, force = false) => {
      const currentBranch = tenantContextService.getStoredBranchContext();
      if (!currentBranch) {
        setEntries([]);
        setPagination({ current_page: 1, last_page: 1, per_page: perPage, total: 0, from: null, to: null, has_more_pages: false });
        setLoading(false);
        return;
      }

      const cacheKey = entryCacheKey(type, page, perPage, search);
      if (!force && entryCache.has(cacheKey)) {
        const cached = entryCache.get(cacheKey)!;
        setEntries(cached.entries);
        setPagination(cached.pagination);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const all = await statutoriesService.getAll(type);
        const filtered = search.trim()
          ? all.filter((e) => {
              const q = search.trim().toLowerCase();
              return (
                getEmployeeName(e).toLowerCase().includes(q) ||
                String((e as any)?.user?.email ?? (e as any)?.user_info?.user?.email ?? '').toLowerCase().includes(q) ||
                String(e.amount ?? '').includes(q)
              );
            })
          : all;

        const total = filtered.length;
        const from = (page - 1) * perPage + 1;
        const to = Math.min(page * perPage, total);
        const paginated = filtered.slice((page - 1) * perPage, page * perPage);
        const lastPage = Math.max(1, Math.ceil(total / perPage));

        const paginationData: PaginationResponse = {
          current_page: page,
          last_page: lastPage,
          per_page: perPage,
          total,
          from: total > 0 ? from : null,
          to: total > 0 ? to : null,
          has_more_pages: page < lastPage,
        };

        setEntries(paginated);
        setPagination(paginationData);
        setEntryCache((prev) => new Map(prev).set(cacheKey, { entries: paginated, pagination: paginationData }));
      } catch (err) {
        setEntries([]);
        setPagination({ current_page: 1, last_page: 1, per_page: perPage, total: 0, from: null, to: null, has_more_pages: false });
      } finally {
        setLoading(false);
      }
    },
    [currentPage, entryCache, itemsPerPage, searchTerm]
  );

  useEffect(() => {
    fetchEntries(activeTab, 1, itemsPerPage, searchTerm, true);
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchEmployees = useCallback(async () => {
    setLoadingEmployees(true);
    try {
      const rows = await managementService.fetchBranchEmployees();
      const mapped: StatutoryEmployeeOption[] = (Array.isArray(rows) ? rows : []).map((r: any) => {
        const userId = Number(r.id ?? r.user_id);
        const ui = r.user_info ?? {};
        const first = String(ui.first_name ?? '');
        const last = String(ui.last_name ?? '');
        const fallbackName = String(r.name ?? '');
        const name = `${first} ${last}`.trim() || fallbackName || String(r.email ?? `User ${userId}`);
        return { user_id: userId, name, email: String(r.email ?? '') };
      });
      setEmployees(mapped.filter((e) => Number.isFinite(e.user_id) && e.user_id > 0));
    } catch {
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    const handler = () => {
      setEntryCache(new Map());
      fetchEntries(activeTab, 1, itemsPerPage, searchTerm, true);
      setCurrentPage(1);
      fetchEmployees();
    };
    window.addEventListener('branchChanged', handler as any);
    window.addEventListener('tenantChanged', handler as any);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('branchChanged', handler as any);
      window.removeEventListener('tenantChanged', handler as any);
      window.removeEventListener('storage', handler);
    };
  }, [activeTab, fetchEntries, itemsPerPage, searchTerm]);

  const handleRefresh = async () => {
    setEntryCache(new Map());
    await fetchEntries(activeTab, 1, itemsPerPage, searchTerm, true);
    setCurrentPage(1);
  };

  const handleClearFilters = async () => {
    setEntryCache(new Map());
    setSearchTerm('');
    setCurrentPage(1);
    await fetchEntries(activeTab, 1, itemsPerPage, '', true);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    fetchEntries(activeTab, 1, itemsPerPage, value, true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchEntries(activeTab, page, itemsPerPage, searchTerm, false);
  };

  const handleItemsPerPageChange = (value: string) => {
    const next = Number(value);
    if (!Number.isFinite(next) || next <= 0) return;
    setItemsPerPage(next);
    setCurrentPage(1);
    fetchEntries(activeTab, 1, next, searchTerm, true);
  };

  const handleDelete = async (id: number) => {
    try {
      await statutoriesService.delete(activeTab, id);
      toast({ title: 'Deleted', description: 'Entry removed.', variant: 'success' as any });
      await handleRefresh();
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message ?? 'Failed to delete.', variant: 'destructive' });
    }
  };

  const handleSaveBulk = async (items: Array<{ user_id: number; amount: number; is_rate: 0 | 1 }>) => {
    await statutoriesService.bulkUpsert(activeTab, items);
    toast({ title: 'Saved', description: 'Entries saved successfully.', variant: 'success' as any });
    await handleRefresh();
  };

  const pageNumbers = useMemo(() => {
    const totalPages = pagination.last_page;
    const current = pagination.current_page;
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (current > 3) pages.push('ellipsis');
    const start = Math.max(2, current - 1);
    const end = Math.min(totalPages - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  }, [pagination.current_page, pagination.last_page]);

  const tabsGridClass = tabDefs.length === 3 ? 'grid-cols-3' : tabDefs.length === 2 ? 'grid-cols-2' : 'grid-cols-1';

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as StatutoryType)} className="w-full">
        <TabsList className={`grid w-full mb-6 ${tabsGridClass}`}>
          {tabDefs.map((t) => (
            <TabsTrigger key={t.key} value={t.key} className="flex items-center justify-center gap-2">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-4">
              <Input
                placeholder="Search employee"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full sm:flex-1 sm:min-w-[160px]"
              />

              <Button
                variant="default"
                className="bg-green-600 hover:bg-green-700 shrink-0"
                onClick={() => setModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add {tabDefs.find((t) => t.key === activeTab)?.label}
              </Button>

              <Button
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none shrink-0"
                variant="default"
                onClick={handleClearFilters}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Clear Filters
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">

            {tabDefs.map((t) => (
              <TabsContent key={t.key} value={t.key} className="mt-6">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader size="md" />
                  </div>
                ) : entries.length === 0 ? (
                  <EmptyStates.Generic
                    title="No entries found"
                    description="Add statutory deductions for employees to see them here."
                    icon={Search}
                  />
                ) : (
                  <>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead className="w-[160px]">Mode</TableHead>
                            <TableHead className="w-[180px] text-right">Amount</TableHead>
                            <TableHead className="w-[60px] text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {entries.map((e) => (
                            <TableRow key={e.id}>
                              <TableCell className="font-medium">{getEmployeeName(e)}</TableCell>
                              <TableCell>{e.is_rate ? 'Rate' : 'Fixed'}</TableCell>
                              <TableCell className="text-right tabular-nums">{formatAmount(e)}</TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setEditTarget(e);
                                        setEditOpen(true);
                                      }}
                                    >
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setDeleteTarget(e);
                                        setDeleteOpen(true);
                                      }}
                                      className="text-destructive"
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

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4">
                      <PaginationInfos.Standard
                        total={pagination.total}
                        from={pagination.from}
                        to={pagination.to}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={handleItemsPerPageChange}
                      />
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              href="#"
                              onClick={(ev) => {
                                ev.preventDefault();
                                if (pagination.current_page > 1) handlePageChange(pagination.current_page - 1);
                              }}
                            />
                          </PaginationItem>
                          {pageNumbers.map((p, idx) =>
                            p === 'ellipsis' ? (
                              <PaginationItem key={`e-${idx}`}>
                                <span className="px-2 text-muted-foreground">…</span>
                              </PaginationItem>
                            ) : (
                              <PaginationItem key={p}>
                                <PaginationLink
                                  href="#"
                                  isActive={p === pagination.current_page}
                                  onClick={(ev) => {
                                    ev.preventDefault();
                                    handlePageChange(p);
                                  }}
                                >
                                  {p}
                                </PaginationLink>
                              </PaginationItem>
                            )
                          )}
                          <PaginationItem>
                            <PaginationNext
                              href="#"
                              onClick={(ev) => {
                                ev.preventDefault();
                                if (pagination.current_page < pagination.last_page) handlePageChange(pagination.current_page + 1);
                              }}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  </>
                )}
              </TabsContent>
            ))}
          </CardContent>
        </Card>
      </Tabs>

      <StatutoryFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        type={activeTab}
        title={`Add ${tabDefs.find((t) => t.key === activeTab)?.label}`}
        loadingEmployees={loadingEmployees}
        employees={employees}
        onSave={handleSaveBulk}
      />

      <StatutoryEditModal
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditTarget(null);
        }}
        type={activeTab}
        entry={editTarget}
        employeeName={editTarget ? getEmployeeName(editTarget) : ''}
        onSave={async (payload) => {
          await handleSaveBulk([payload]);
        }}
      />

      <DeleteConfirmModal
        isOpen={deleteOpen}
        loading={deleting}
        onClose={() => {
          if (deleting) return;
          setDeleteOpen(false);
          setDeleteTarget(null);
        }}
        title="Delete entry?"
        description="This will soft-delete the entry (amount will be set to 0)."
        onConfirm={async () => {
          if (!deleteTarget) return;
          setDeleting(true);
          try {
            await handleDelete(deleteTarget.id);
            setDeleteOpen(false);
            setDeleteTarget(null);
          } finally {
            setDeleting(false);
          }
        }}
      />
    </div>
  );
}

