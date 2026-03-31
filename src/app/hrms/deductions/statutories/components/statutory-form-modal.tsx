import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Loader } from '@/components/ui/loader';
import { Search } from 'lucide-react';
import type { StatutoryType, BulkUpsertItem } from '../services/statutories-service';

export interface StatutoryEmployeeOption {
  user_id: number;
  name: string;
  email: string;
}

export interface StatutoryFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: StatutoryType;
  title: string;
  loadingEmployees: boolean;
  employees: StatutoryEmployeeOption[];
  initialSelectedUserIds?: number[];
  initialValues?: Record<number, { amount: number; is_rate: boolean }>;
  onSave: (items: BulkUpsertItem[]) => Promise<void> | void;
}

export function StatutoryFormModal({
  open,
  onOpenChange,
  type,
  title,
  loadingEmployees,
  employees,
  initialSelectedUserIds,
  initialValues,
  onSave,
}: StatutoryFormModalProps) {
  const [saving, setSaving] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [amountByUserId, setAmountByUserId] = useState<Record<number, string>>({});
  const [isRateByUserId, setIsRateByUserId] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!open) return;
    const selected = initialSelectedUserIds?.length ? initialSelectedUserIds : [];
    setSelectedUserIds(selected);

    const amountMap: Record<number, string> = {};
    const rateMap: Record<number, boolean> = {};
    if (selected.length) {
      selected.forEach((id) => {
        const initial = initialValues?.[id];
        amountMap[id] = initial ? String(initial.amount ?? '') : '';
        rateMap[id] = initial ? !!initial.is_rate : true;
      });
    }
    setAmountByUserId(amountMap);
    setIsRateByUserId(rateMap);
  }, [open, initialSelectedUserIds, initialValues]);

  useEffect(() => {
    if (!open) {
      setSaving(false);
      setEmployeeSearch('');
      setSelectedUserIds([]);
      setAmountByUserId({});
      setIsRateByUserId({});
    }
  }, [open]);

  const filteredEmployees = useMemo(() => {
    const q = employeeSearch.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => {
      return String(e.user_id).includes(q) || e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q);
    });
  }, [employees, employeeSearch]);

  const visibleUserIds = useMemo(() => filteredEmployees.map((e) => e.user_id), [filteredEmployees]);
  const visibleSelectedCount = useMemo(
    () => visibleUserIds.filter((id) => selectedUserIds.includes(id)).length,
    [visibleUserIds, selectedUserIds]
  );

  const selectAllState: boolean | 'indeterminate' =
    visibleUserIds.length === 0
      ? false
      : visibleSelectedCount === 0
        ? false
        : visibleSelectedCount === visibleUserIds.length
          ? true
          : 'indeterminate';

  const toggleSelectAll = (checked: boolean) => {
    if (visibleUserIds.length === 0) return;
    if (checked) {
      setSelectedUserIds((prev) => {
        const next = new Set(prev);
        visibleUserIds.forEach((id) => next.add(id));
        return Array.from(next);
      });
      setAmountByUserId((prev) => {
        const next = { ...prev };
        visibleUserIds.forEach((id) => {
          if (!(id in next)) next[id] = '';
        });
        return next;
      });
      setIsRateByUserId((prev) => {
        const next = { ...prev };
        visibleUserIds.forEach((id) => {
          if (!(id in next)) next[id] = true;
        });
        return next;
      });
    } else {
      setSelectedUserIds((prev) => prev.filter((id) => !visibleUserIds.includes(id)));
    }
  };

  const clearSelection = () => {
    setSelectedUserIds([]);
    setAmountByUserId({});
    setIsRateByUserId({});
  };

  const toggleUser = (userId: number, checked: boolean) => {
    setSelectedUserIds((prev) => {
      if (checked) {
        if (prev.includes(userId)) return prev;
        return [...prev, userId];
      }
      return prev.filter((id) => id !== userId);
    });

    if (checked) {
      setAmountByUserId((prev) => ({ ...prev, [userId]: prev[userId] ?? '' }));
      setIsRateByUserId((prev) => ({ ...prev, [userId]: prev[userId] ?? true }));
    }
  };

  const selectedEmployees = useMemo(
    () => employees.filter((e) => selectedUserIds.includes(e.user_id)),
    [employees, selectedUserIds]
  );

  const canSave = selectedUserIds.length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const items: BulkUpsertItem[] = selectedUserIds.map((userId) => {
        const raw = (amountByUserId[userId] ?? '').toString().trim();
        const amount = raw === '' ? 0 : Number(raw);
        return {
          user_id: userId,
          amount: Number.isFinite(amount) ? amount : 0,
          is_rate: isRateByUserId[userId] ? 1 : 0,
        };
      });
      await onSave(items);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const modeLabel = type === 'sss' ? 'SSS' : type === 'philhealth' ? 'PhilHealth' : 'Pag-IBIG';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Select employees and set {modeLabel} amount (Rate or Fixed) per employee.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col rounded-md border h-[360px]">
            <div className="p-4 border-b space-y-1">
              <Label>Select Employees</Label>
              <p className="text-xs text-muted-foreground">
                {filteredEmployees.length} shown of {employees.length} • {selectedUserIds.length} selected
              </p>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3 pb-3 border-b mb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employees..."
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    className="pl-10"
                    disabled={saving || loadingEmployees}
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all-employees"
                      checked={selectAllState}
                      onCheckedChange={(checked) => toggleSelectAll(checked === true)}
                      disabled={saving || loadingEmployees}
                    />
                    <Label htmlFor="select-all-employees" className="text-sm">
                      Select All
                    </Label>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 px-3"
                    onClick={clearSelection}
                    disabled={saving || loadingEmployees || selectedUserIds.length === 0}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {loadingEmployees ? (
                <div className="flex justify-center py-4">
                  <Loader size="sm" />
                </div>
              ) : filteredEmployees.length === 0 ? (
                <p className="text-sm text-muted-foreground">No employees match your search.</p>
              ) : (
                <div className="space-y-3">
                  {filteredEmployees.map((e) => {
                    const checked = selectedUserIds.includes(e.user_id);
                    return (
                      <div key={e.user_id} className="flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={`employee-${e.user_id}`}
                            checked={checked}
                            onCheckedChange={(isChecked) => toggleUser(e.user_id, isChecked === true)}
                            disabled={saving}
                          />
                          <div className="space-y-0.5">
                            <Label htmlFor={`employee-${e.user_id}`}>
                              {e.user_id} - {e.name}
                            </Label>
                            <p className="text-xs text-muted-foreground">{e.email}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          <div className="flex flex-col rounded-md border h-[360px]">
            <div className="p-4 border-b space-y-1">
              <Label>Amounts</Label>
              <p className="text-xs text-muted-foreground">{selectedEmployees.length} inputs</p>
            </div>

            <ScrollArea className="flex-1 p-4">
              {selectedEmployees.length === 0 ? (
                <p className="text-sm text-muted-foreground">Select at least 1 employee.</p>
              ) : (
                <div className="space-y-3">
                  {selectedEmployees.map((e) => (
                    <div key={e.user_id} className="grid grid-cols-[minmax(0,1fr)_110px_90px] gap-3 items-center">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{e.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{e.email}</div>
                      </div>
                      <Input
                        type="number"
                        step="0.000001"
                        min="0"
                        value={amountByUserId[e.user_id] ?? ''}
                        onChange={(ev) => setAmountByUserId((prev) => ({ ...prev, [e.user_id]: ev.target.value }))}
                        disabled={saving}
                      />
                      <div className="flex items-center justify-end gap-2">
                        <Label className="text-xs text-muted-foreground">{isRateByUserId[e.user_id] ? 'Rate' : 'Fixed'}</Label>
                        <Switch
                          checked={isRateByUserId[e.user_id] ?? true}
                          onCheckedChange={(checked) => setIsRateByUserId((prev) => ({ ...prev, [e.user_id]: checked }))}
                          disabled={saving}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

