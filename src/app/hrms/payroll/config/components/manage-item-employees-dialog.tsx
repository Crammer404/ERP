'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';
import { configService, type PayrollItemEmployee } from '../services/config-service';
import type { RateItem } from './types';

interface ManageItemEmployeesDialogProps {
  open: boolean;
  item: RateItem | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

export function ManageItemEmployeesDialog({
  open,
  item,
  onClose,
  onSaved,
}: ManageItemEmployeesDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [employees, setEmployees] = useState<PayrollItemEmployee[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    if (!open || !item?.id) {
      return;
    }

    const loadEmployees = async () => {
      try {
        setLoading(true);
        const response = await configService.getItemEmployees(item.id as number);
        setEmployees(response.employees || []);
        setSelectedIds(response.assigned_user_ids || []);
      } finally {
        setLoading(false);
      }
    };

    void loadEmployees();
  }, [open, item?.id]);

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = !q
      ? employees
      : employees.filter((employee) =>
      String(employee.id).includes(q)
      || employee.name.toLowerCase().includes(q)
      || employee.email.toLowerCase().includes(q)
    );

    return [...base].sort((a, b) => {
      const aSelected = selectedIds.includes(a.id) ? 1 : 0;
      const bSelected = selectedIds.includes(b.id) ? 1 : 0;
      if (aSelected !== bSelected) {
        return bSelected - aSelected;
      }
      return a.name.localeCompare(b.name);
    });
  }, [employees, search, selectedIds]);

  const visibleIds = useMemo(() => filteredEmployees.map((employee) => employee.id), [filteredEmployees]);
  const visibleSelectedCount = useMemo(
    () => visibleIds.filter((id) => selectedIds.includes(id)).length,
    [visibleIds, selectedIds],
  );
  const allVisibleSelected = visibleIds.length > 0 && visibleSelectedCount === visibleIds.length;

  const toggleAllVisible = (checked: boolean) => {
    if (!checked) {
      const visibleSet = new Set(visibleIds);
      setSelectedIds((prev) => prev.filter((id) => !visibleSet.has(id)));
      return;
    }

    setSelectedIds((prev) => {
      const next = new Set(prev);
      visibleIds.forEach((id) => next.add(id));
      return Array.from(next);
    });
  };

  const toggleEmployee = (employeeId: number, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) {
        return prev.includes(employeeId) ? prev : [...prev, employeeId];
      }
      return prev.filter((id) => id !== employeeId);
    });
  };

  const handleSave = async () => {
    if (!item?.id) {
      return;
    }

    try {
      setSaving(true);
      await configService.updateItemEmployees(item.id, selectedIds);
      await onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Payroll Item Employees</DialogTitle>
          <DialogDescription>
            Select employees entitled to <span className="font-medium">{item?.label || 'this payroll item'}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>{selectedIds.length} selected</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={allVisibleSelected} onCheckedChange={(value) => toggleAllVisible(value === true)} />
              <span>Select all shown</span>
            </label>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee by name, id, or email"
            />
          </div>

          <ScrollArea className="h-80 rounded-md border p-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading employees...</p>
            ) : filteredEmployees.length === 0 ? (
              <p className="text-sm text-muted-foreground">No employees found.</p>
            ) : (
              <div className="space-y-2">
                {filteredEmployees.map((employee) => {
                  const checked = selectedIds.includes(employee.id);
                  return (
                    <label
                      key={employee.id}
                      className="flex cursor-pointer items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox checked={checked} onCheckedChange={(value) => toggleEmployee(employee.id, value === true)} />
                        <div>
                          <p className="text-sm font-medium">{employee.name}</p>
                          <p className="text-xs text-muted-foreground">#{employee.id} - {employee.email}</p>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <p className="mr-auto text-xs text-muted-foreground">
            If no employee is assigned, this item stays global and applies to all employees in payroll run.
          </p>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || loading || !item?.id}>
            {saving ? 'Saving...' : 'Save Selection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
