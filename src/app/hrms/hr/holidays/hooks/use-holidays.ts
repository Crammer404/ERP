import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  holidaysService,
  type HolidayPreviewItem,
  type PayrollHolidayItem,
} from '../services/holidays-service';
import type { EditHolidayFormState } from '../components/holiday-info-dialog';

type HolidayType = 'regular' | 'special_non_working';

type PendingDelete =
  | { kind: 'db'; id: number; name: string }
  | { kind: 'preview'; holiday_date: string; holiday_name: string };

type PendingTypeChange =
  | { kind: 'db'; id: number; name: string; nextType: HolidayType }
  | {
      kind: 'preview';
      holiday_date: string;
      holiday_name: string;
      nextType: HolidayType;
    };

export function useHolidays() {
  const { toast } = useToast();

  const [holidayYear, setHolidayYear] = useState<number>(new Date().getFullYear());
  const [holidays, setHolidays] = useState<PayrollHolidayItem[]>([]);
  const [holidayLoading, setHolidayLoading] = useState(false);
  const [holidaySyncing, setHolidaySyncing] = useState(false);
  const [hasSyncedPreview, setHasSyncedPreview] = useState(false);
  const [previewHolidays, setPreviewHolidays] = useState<HolidayPreviewItem[]>([]);

  const [syncInfoOpen, setSyncInfoOpen] = useState(false);
  const [syncInfo, setSyncInfo] = useState<{ title: string; description: string } | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [typeChangeDialogOpen, setTypeChangeDialogOpen] = useState(false);
  const [pendingTypeChange, setPendingTypeChange] = useState<PendingTypeChange | null>(null);
  const [typeChangeLoading, setTypeChangeLoading] = useState(false);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState<'create' | 'edit'>('edit');
  const [editTarget, setEditTarget] = useState<PayrollHolidayItem | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState<EditHolidayFormState>({
    holiday_date: '',
    holiday_name: '',
    holiday_type: 'regular',
    is_active: true,
  });

  const holidayYearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, index) => currentYear - index);
  }, []);

  const normalizeDateToInput = (value: string) => {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    if (value.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const hasBranchContext = (): boolean => {
    try {
      const raw = localStorage.getItem('branch_context');
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return Boolean(parsed?.id);
    } catch {
      return false;
    }
  };

  const isBranchContextTransientError = (error: any): boolean => {
    const status = Number(error?.status || error?.response?.status || 0);
    const message = String(error?.message || error?.response?.data?.message || '').toLowerCase();
    return status === 400 && message.includes('branch context required');
  };

  const fetchHolidayData = async (year: number) => {
    if (!hasBranchContext()) {
      // Tenant/branch selector can briefly clear branch context during transitions.
      // Skip fetch to avoid flashing transient 400 errors.
      return;
    }

    try {
      setHolidayLoading(true);
      const response = await holidaysService.list(year);
      setHolidays(response.holidays || []);
    } catch (error: any) {
      if (isBranchContextTransientError(error) && !hasBranchContext()) {
        return;
      }
      toast({
        title: 'Error',
        description: error?.message || 'Failed to load holidays',
        variant: 'destructive',
      });
    } finally {
      setHolidayLoading(false);
    }
  };

  const refresh = async () => {
    await fetchHolidayData(holidayYear);
  };

  useEffect(() => {
    setHasSyncedPreview(false);
    setPreviewHolidays([]);
    void fetchHolidayData(holidayYear);
  }, [holidayYear]);

  useEffect(() => {
    const refreshForContextChange = () => {
      // Context changed (branch/tenant): discard any staged preview and refetch active-branch rows.
      setHasSyncedPreview(false);
      setPreviewHolidays([]);
      setHolidays([]);
      void fetchHolidayData(holidayYear);
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'branch_context' || event.key === 'tenant_context') {
        refreshForContextChange();
      }
    };

    window.addEventListener('branchChanged', refreshForContextChange);
    window.addEventListener('tenantChanged', refreshForContextChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('branchChanged', refreshForContextChange);
      window.removeEventListener('tenantChanged', refreshForContextChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [holidayYear]);

  const syncOrUpdateDb = async () => {
    try {
      setHolidaySyncing(true);
      if (!hasSyncedPreview) {
        const response = await holidaysService.sync(holidayYear);
        setPreviewHolidays(response.holidays || []);
        setHasSyncedPreview(true);
        setSyncInfo({
          title: 'Holidays Synced',
          description: `${response.total} holidays fetched. Click "Update DB Holiday" to apply changes to the database.`,
        });
        setSyncInfoOpen(true);
        toast({
          title: 'Synced',
          description: `${response.total} holidays fetched. Click "Update DB Holiday" to apply.`,
        });
        return;
      }

      const response = await holidaysService.updateDb(
        holidayYear,
        previewHolidays.map((holiday) => ({
          holiday_date: holiday.holiday_date,
          holiday_name: holiday.holiday_name,
          holiday_type: holiday.holiday_type,
        }))
      );
      setHasSyncedPreview(false);
      setPreviewHolidays([]);
      await fetchHolidayData(holidayYear);
      toast({
        title: 'Success',
        description: `DB updated. Deleted ${response.deleted}, seeded ${response.seeded}.`,
      });
    } catch (error: any) {
      toast({
        title: hasSyncedPreview ? 'Update DB Failed' : 'Sync Failed',
        description: error?.message || 'Failed to process holiday request.',
        variant: 'destructive',
      });
    } finally {
      setHolidaySyncing(false);
    }
  };

  const requestDelete = (target: PendingDelete) => {
    setPendingDelete(target);
    setDeleteDialogOpen(true);
  };

  const cancelDelete = () => {
    if (deleteLoading) return;
    setDeleteDialogOpen(false);
    setPendingDelete(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      setDeleteLoading(true);
      if (pendingDelete.kind === 'db') {
        await holidaysService.delete(pendingDelete.id);
        setHolidays((prev) => prev.filter((h) => h.id !== pendingDelete.id));
        toast({ title: 'Deleted', description: 'Holiday removed.' });
      } else {
        setPreviewHolidays((prev) =>
          prev.filter(
            (h) =>
              !(
                h.holiday_date === pendingDelete.holiday_date &&
                h.holiday_name === pendingDelete.holiday_name
              )
          )
        );
      }
      setDeleteDialogOpen(false);
      setPendingDelete(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete holiday.',
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const requestTypeChange = (target: PendingTypeChange) => {
    setPendingTypeChange(target);
    setTypeChangeDialogOpen(true);
  };

  const cancelTypeChange = () => {
    if (typeChangeLoading) return;
    setTypeChangeDialogOpen(false);
    setPendingTypeChange(null);
  };

  const confirmTypeChange = async () => {
    if (!pendingTypeChange) return;
    try {
      setTypeChangeLoading(true);
      if (pendingTypeChange.kind === 'db') {
        await holidaysService.update(pendingTypeChange.id, { holiday_type: pendingTypeChange.nextType });
        setHolidays((prev) =>
          prev.map((h) =>
            h.id === pendingTypeChange.id ? { ...h, holiday_type: pendingTypeChange.nextType } : h
          )
        );
      } else {
        setPreviewHolidays((prev) =>
          prev.map((h) =>
            h.holiday_date === pendingTypeChange.holiday_date &&
            h.holiday_name === pendingTypeChange.holiday_name
              ? { ...h, holiday_type: pendingTypeChange.nextType }
              : h
          )
        );
      }
      setTypeChangeDialogOpen(false);
      setPendingTypeChange(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update holiday type.',
        variant: 'destructive',
      });
    } finally {
      setTypeChangeLoading(false);
    }
  };

  const openCreate = () => {
    setEditMode('create');
    setEditTarget(null);
    setEditForm({
      holiday_date: '',
      holiday_name: '',
      holiday_type: 'regular',
      is_active: true,
    });
    setEditDialogOpen(true);
  };

  const openEdit = (holiday: PayrollHolidayItem) => {
    setEditMode('edit');
    setEditTarget(holiday);
    setEditForm({
      holiday_date: normalizeDateToInput(holiday.holiday_date),
      holiday_name: holiday.holiday_name,
      holiday_type: (holiday.holiday_type || 'regular') as HolidayType,
      is_active: !!holiday.is_active,
    });
    setEditDialogOpen(true);
  };

  const closeEdit = () => {
    if (editSaving) return;
    setEditDialogOpen(false);
    setEditTarget(null);
  };

  const saveEdit = async () => {
    if (!editForm.holiday_date || !editForm.holiday_name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Date and holiday name are required.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setEditSaving(true);
      if (editMode === 'create') {
        const created = await holidaysService.create({
          holiday_date: editForm.holiday_date,
          holiday_name: editForm.holiday_name.trim(),
          holiday_type: editForm.holiday_type,
          is_active: editForm.is_active,
        });
        setHolidays((prev) => [created, ...prev]);
        toast({ title: 'Success', description: 'Holiday added successfully.' });
      } else {
        if (!editTarget) return;
        const updated = await holidaysService.update(editTarget.id, {
          holiday_date: editForm.holiday_date,
          holiday_name: editForm.holiday_name.trim(),
          holiday_type: editForm.holiday_type,
          is_active: editForm.is_active,
        });
        setHolidays((prev) => prev.map((h) => (h.id === editTarget.id ? updated : h)));
        toast({ title: 'Success', description: 'Holiday updated.' });
      }
      setEditDialogOpen(false);
      setEditTarget(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || (editMode === 'create' ? 'Failed to add holiday.' : 'Failed to update holiday.'),
        variant: 'destructive',
      });
    } finally {
      setEditSaving(false);
    }
  };

  const displayedHolidays: Array<PayrollHolidayItem | HolidayPreviewItem> = hasSyncedPreview
    ? previewHolidays
    : holidays;

  const deleteDialog = {
    open: deleteDialogOpen,
    setOpen: setDeleteDialogOpen,
    pending: pendingDelete,
    loading: deleteLoading,
    requestDelete,
    cancelDelete,
    confirmDelete,
  };

  const typeChangeDialog = {
    open: typeChangeDialogOpen,
    setOpen: setTypeChangeDialogOpen,
    pending: pendingTypeChange,
    loading: typeChangeLoading,
    requestTypeChange,
    cancelTypeChange,
    confirmTypeChange,
  };

  const editDialog = {
    open: editDialogOpen,
    mode: editMode,
    saving: editSaving,
    form: editForm,
    setForm: setEditForm,
    openCreate,
    openEdit,
    closeEdit,
    saveEdit,
    setOpen: setEditDialogOpen,
  };

  return {
    holidayYear,
    setHolidayYear,
    holidayYearOptions,
    holidayLoading,
    holidaySyncing,
    hasSyncedPreview,
    displayedHolidays,
    refresh,
    syncOrUpdateDb,
    syncInfoDialog: {
      open: syncInfoOpen,
      setOpen: setSyncInfoOpen,
      data: syncInfo,
    },
    deleteDialog,
    typeChangeDialog,
    editDialog,
  };
}

