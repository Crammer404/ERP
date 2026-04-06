'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import type { HolidayPreviewItem, PayrollHolidayItem } from './services/holidays-service';
import { useHolidays } from './hooks/use-holidays';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { HolidayInfoDialog } from './components/holiday-info-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, RefreshCw } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { InfoDialog } from './components/info-dialog';

export default function HolidaysPage() {
  const {
    holidayYear,
    setHolidayYear,
    holidayYearOptions,
    holidayLoading,
    holidaySyncing,
    hasSyncedPreview,
    displayedHolidays,
    refresh,
    syncOrUpdateDb,
    syncInfoDialog,
    deleteDialog,
    typeChangeDialog,
    editDialog,
  } = useHolidays();

  const loading = holidayLoading;
  const handleRefresh = () => {
    void refresh();
  };

  const formatDateToUs = (dateValue: string): string => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      const [year, month, day] = dateValue.split('-').map((part) => Number(part));
      const date = new Date(Date.UTC(year, month - 1, day));
      return format(date, 'MMM d, yyyy');
    }

    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) {
      return dateValue;
    }

    return format(parsed, 'MMM d, yyyy');
  };

  const deleteDialogTitle = useMemo(() => {
    if (!deleteDialog.pending) return 'Confirm deletion';
    return deleteDialog.pending.kind === 'db' ? 'Delete holiday' : 'Remove holiday from preview';
  }, [deleteDialog.pending]);

  const deleteDialogDescription = useMemo(() => {
    if (!deleteDialog.pending) return 'Are you sure you want to continue?';
    if (deleteDialog.pending.kind === 'db') {
      return `Are you sure you want to delete "${deleteDialog.pending.name}"? This action cannot be undone.`;
    }
    return `Are you sure you want to remove "${deleteDialog.pending.holiday_name}" from the preview list?`;
  }, [deleteDialog.pending]);

  const typeChangeDialogTitle = 'Confirm type change';
  const typeChangeDialogDescription = useMemo(() => {
    if (!typeChangeDialog.pending) return 'Are you sure you want to continue?';
    const name =
      typeChangeDialog.pending.kind === 'db'
        ? typeChangeDialog.pending.name
        : typeChangeDialog.pending.holiday_name;
    const typeLabel = typeChangeDialog.pending.nextType === 'regular' ? 'Regular' : 'Special Non-Working';
    return `Change holiday type for "${name}" to "${typeLabel}"?`;
  }, [typeChangeDialog.pending]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="italic md:text-lg font-semibold">Philippines Holidays</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={String(holidayYear)} onValueChange={(value) => setHolidayYear(Number(value))}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {holidayYearOptions.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none shrink-0"
                  variant="default" 
                  onClick={handleRefresh}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
              </Button>
              <Button
                onClick={syncOrUpdateDb}
                disabled={holidaySyncing}
                variant={hasSyncedPreview ? 'destructive' : 'default'}
              >
                {holidaySyncing
                  ? hasSyncedPreview
                    ? 'Updating DB...'
                    : 'Syncing...'
                  : hasSyncedPreview
                    ? 'Update DB Holiday'
                    : 'Sync API Holiday'}
              </Button>
              <Button onClick={editDialog.openCreate} disabled={holidaySyncing || holidayLoading}>
                Add Manual Holiday
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Source</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {holidayLoading ? (
                  <tr className="border-t">
                    <td className="p-6" colSpan={6}>
                      <div className="flex items-center justify-center">
                        <Loader size="sm" />
                      </div>
                    </td>
                  </tr>
                ) : displayedHolidays.length === 0 ? (
                  <tr className="border-t">
                    <td className="p-6 text-center text-muted-foreground" colSpan={6}>
                      No holidays configured for this year.
                    </td>
                  </tr>
                ) : (
                  displayedHolidays.map((holiday) => (
                    <tr key={'id' in holiday ? holiday.id : `${holiday.holiday_date}-${holiday.holiday_name}`} className="border-t">
                      <td className="p-2">{formatDateToUs(holiday.holiday_date)}</td>
                      <td className="p-2">{holiday.holiday_name}</td>
                      <td className="p-2">
                        <Select
                          value={holiday.holiday_type || 'regular'}
                          onValueChange={(value: 'regular' | 'special_non_working') =>
                            'id' in holiday
                              ? typeChangeDialog.requestTypeChange({
                                  kind: 'db',
                                  id: holiday.id,
                                  name: holiday.holiday_name,
                                  nextType: value,
                                })
                              : typeChangeDialog.requestTypeChange({
                                  kind: 'preview',
                                  holiday_date: holiday.holiday_date,
                                  holiday_name: holiday.holiday_name,
                                  nextType: value,
                                })
                          }
                        >
                          <SelectTrigger className="h-8 w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="regular">Regular</SelectItem>
                            <SelectItem value="special_non_working">Special Non-Working</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">{holiday.source}</td>
                      <td className="p-2">{holiday.is_active ? 'Active' : 'Inactive'}</td>
                      <td className="p-2">
                        {'id' in holiday ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => editDialog.openEdit(holiday)}>
                                Update
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  deleteDialog.requestDelete({
                                    kind: 'db',
                                    id: holiday.id,
                                    name: holiday.holiday_name,
                                  })
                                }
                                className="text-destructive focus:text-destructive"
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  deleteDialog.requestDelete({
                                    kind: 'preview',
                                    holiday_date: holiday.holiday_date,
                                    holiday_name: holiday.holiday_name,
                                  })
                                }
                              >
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open) deleteDialog.cancelDelete();
        }}
        title={deleteDialogTitle}
        description={deleteDialogDescription}
        confirmText={deleteDialog.pending?.kind === 'db' ? 'Delete' : 'Remove'}
        cancelText="Cancel"
        onConfirm={deleteDialog.confirmDelete}
        variant="destructive"
        loading={deleteDialog.loading}
      />

      <ConfirmDialog
        open={typeChangeDialog.open}
        onOpenChange={(open) => {
          if (!open) typeChangeDialog.cancelTypeChange();
        }}
        title={typeChangeDialogTitle}
        description={typeChangeDialogDescription}
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={typeChangeDialog.confirmTypeChange}
        variant="default"
        loading={typeChangeDialog.loading}
      />

      <HolidayInfoDialog
        open={editDialog.open}
        onOpenChange={(open) => {
          if (!open) editDialog.closeEdit();
          editDialog.setOpen(open);
        }}
        saving={editDialog.saving}
        mode={editDialog.mode}
        value={editDialog.form}
        onChange={editDialog.setForm}
        onSave={editDialog.saveEdit}
      />

      <InfoDialog
        open={syncInfoDialog.open}
        onOpenChange={syncInfoDialog.setOpen}
        title={syncInfoDialog.data?.title || 'Info'}
        description={syncInfoDialog.data?.description || ''}
      />
    </div>
  );
}

