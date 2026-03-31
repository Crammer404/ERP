import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader } from '@/components/ui/loader';
import { Search } from 'lucide-react';

export interface ColaEmployeeOption {
  id: number;
  name: string;
  email: string;
}

export interface AddColaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loadingEmployees: boolean;
  employees: ColaEmployeeOption[];
  onSave: (items: Array<{ user_id: number; amount: number }>) => Promise<void> | void;
}

export function AddColaModal({ open, onOpenChange, loadingEmployees, employees, onSave }: AddColaModalProps) {
  const [saving, setSaving] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [amountByUserId, setAmountByUserId] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!open) {
      setSaving(false);
      setEmployeeSearch('');
      setSelectedUserIds([]);
      setAmountByUserId({});
    }
  }, [open]);

  const filteredEmployees = useMemo(() => {
    const q = employeeSearch.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => {
      return String(e.id).includes(q) || e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q);
    });
  }, [employees, employeeSearch]);

  const visibleUserIds = useMemo(() => filteredEmployees.map((e) => e.id), [filteredEmployees]);
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
          if (!(id in next)) {
            next[id] = '';
          }
        });
        return next;
      });
      return;
    }

    const visibleSet = new Set(visibleUserIds);
    setSelectedUserIds((prev) => prev.filter((id) => !visibleSet.has(id)));
    setAmountByUserId((prev) => {
      const next = { ...prev };
      visibleUserIds.forEach((id) => {
        delete next[id];
      });
      return next;
    });
  };

  const toggleUser = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUserIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
      setAmountByUserId((prev) => (userId in prev ? prev : { ...prev, [userId]: '' }));
      return;
    }

    setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
    setAmountByUserId((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  };

  const selectedEmployees = useMemo(() => {
    const set = new Set(selectedUserIds);
    return employees.filter((e) => set.has(e.id));
  }, [employees, selectedUserIds]);

  const setAmount = (userId: number, value: string) => {
    setAmountByUserId((prev) => ({ ...prev, [userId]: value }));
  };

  const canSave = selectedUserIds.length > 0 && !saving;

  const clearSelection = () => {
    setSelectedUserIds([]);
    setAmountByUserId({});
  };

  const handleSave = async () => {
    if (!canSave) return;

    const items = selectedUserIds.map((userId) => {
      const raw = (amountByUserId[userId] ?? '').trim();
      const parsed = raw === '' ? 0 : Number(raw);
      const amount = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
      return { user_id: userId, amount };
    });

    setSaving(true);
    try {
      await onSave(items);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (saving ? undefined : onOpenChange(next))}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add COLA</DialogTitle>
          <DialogDescription>Select employees and set COLA amounts.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-3">
            <div className="rounded-md border h-[360px] flex flex-col">
              <div className="p-4 border-b space-y-1">
                <Label>Select Employees</Label>
                <p className="text-xs text-muted-foreground">
                  {filteredEmployees.length} shown of {employees.length} • {selectedUserIds.length} selected
                </p>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3 pb-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      placeholder="Search employees..."
                      className="pl-10"
                      disabled={saving || loadingEmployees}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-2 flex-shrink-0">
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
                      const checked = selectedUserIds.includes(e.id);
                      return (
                        <div key={e.id} className="flex items-center justify-between gap-3">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              id={`employee-${e.id}`}
                              checked={checked}
                              onCheckedChange={(isChecked) => toggleUser(e.id, isChecked === true)}
                              disabled={saving}
                            />
                            <div className="space-y-0.5">
                              <Label htmlFor={`employee-${e.id}`}>
                                {e.id} - {e.name}
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
          </div>

          <div className="space-y-3">
            <div className="rounded-md border h-[360px] flex flex-col">
              <div className="p-4 border-b space-y-1">
                <Label>Amounts</Label>
                <p className="text-xs text-muted-foreground">
                  {selectedEmployees.length} inputs
                </p>
              </div>

              <ScrollArea className="flex-1 p-4">
                {selectedEmployees.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Select at least 1 employee.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedEmployees.map((e) => (
                      <div key={e.id} className="grid grid-cols-[minmax(0,1fr)_140px] gap-3 items-center">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{e.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{e.email}</div>
                        </div>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={amountByUserId[e.id] ?? ''}
                          onChange={(ev) => setAmount(e.id, ev.target.value)}
                          disabled={saving}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
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

