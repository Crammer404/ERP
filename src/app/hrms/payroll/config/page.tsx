'use client';
 
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Info, Loader2 } from 'lucide-react';
import { configService, type ComputationData } from './services/config-service';
import { positionService } from '../positions/services/position-service';
import { useToast } from '@/hooks/use-toast';
import { Loader } from '@/components/ui/loader';
import type { DropResult } from '@hello-pangea/dnd';
import { PayrollItemsCard } from './components/payroll-items-card';
import { SectionInfoDialog } from './components/section-info-dialog';
import { PayrollItemFormDialog } from './components/payroll-item-form-dialog';
import { AddGroupDialog } from './components/add-group-dialog';
import { DeletePayrollItemDialog } from './components/delete-payroll-item-dialog';
import type {
  EditRateDraft,
  NewRateDraft,
  RateFormErrors,
  RateItem,
  SectionInfoKey,
} from './components/types';

export default function ComputationPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [computationData, setComputationData] = useState<ComputationData | null>(null);

  // Payroll Variable Rates (data-driven)
  const [ratesSaving, setRatesSaving] = useState(false);
  const [rateItems, setRateItems] = useState<RateItem[]>([]);
  const [rateGroupOrder, setRateGroupOrder] = useState<string[]>([]);
  const [addRateOpen, setAddRateOpen] = useState(false);
  const [newRate, setNewRate] = useState<NewRateDraft>({
    code: '',
    label: '',
    value: '',
    is_rate: 1,
    group: '',
    category: 'earnings',
  });

  const [editRateOpen, setEditRateOpen] = useState(false);
  const [editRate, setEditRate] = useState<EditRateDraft | null>(null);
  const [deleteRateTarget, setDeleteRateTarget] = useState<{ code: string; label: string; group: string } | null>(null);
  const [customRateGroups, setCustomRateGroups] = useState<string[]>([]);
  const [addGroupModalOpen, setAddGroupModalOpen] = useState(false);
  const [tempGroupName, setTempGroupName] = useState('');
  const [tempGroupError, setTempGroupError] = useState('');
  const [rateFormErrors, setRateFormErrors] = useState<RateFormErrors>({});
  const [infoModalSection, setInfoModalSection] = useState<SectionInfoKey | null>(null);

  const clearRateFormError = (...fields: Array<keyof RateFormErrors>) => {
    setRateFormErrors((prev) => {
      if (fields.every((field) => !prev[field])) return prev;
      const next = { ...prev };
      fields.forEach((field) => {
        delete next[field];
      });
      return next;
    });
  };
  
  // Basic Pay State
  const [positionId, setPositionId] = useState<number | null>(null);
  const [branch, setBranch] = useState('');
  const [branchId, setBranchId] = useState<number | null>(null);
  const [monthly, setMonthly] = useState('0.00');
  const [semiMonthly, setSemiMonthly] = useState('0.00');
  const [daily, setDaily] = useState('0.00');
  const [hourly, setHourly] = useState('0.00');
  const [isEditingBasicPay, setIsEditingBasicPay] = useState(false);

  // Payroll Variables Rates State
  const [nightDiffPay, setNightDiffPay] = useState('1.10');
  const [restDayPay, setRestDayPay] = useState('1.30');
  const [holidayPay, setHolidayPay] = useState('2.00');
  const [regularOT, setRegularOT] = useState('1.25');
  const [restDayOT, setRestDayOT] = useState('1.69');
  const [holidayOT, setHolidayOT] = useState('2.60');

  // Additional Compensation State
  const [thirteenthMonth, setThirteenthMonth] = useState('0.00');

  // Deductions Percentages State
  const [sssPercent, setSssPercent] = useState('0.00');
  const [philHealthPercent, setPhilHealthPercent] = useState('0.00');
  const [pagibigPercent, setPagibigPercent] = useState('0.00');

  // Actual Deductions State
  const [incomeTax, setIncomeTax] = useState('0.00');
  const [sssDeduction, setSssDeduction] = useState('0.00');
  const [philHealthDeduction, setPhilHealthDeduction] = useState('0.00');
  const [pagibigDeduction, setPagibigDeduction] = useState('0.00');

  // Total Computation State
  const [grossPay, setGrossPay] = useState('0.00');
  const [totalDeduction, setTotalDeduction] = useState('0.00');
  const [netPay, setNetPay] = useState('0.00');

  type BasicPayEditableField = 'monthly' | 'daily' | 'semiMonthly' | 'hourly';

  // Fetch computation data on mount
  useEffect(() => {
    fetchComputationData();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('payroll_config_rate_group_order');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) {
        setRateGroupOrder(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  const persistRateGroupOrder = (order: string[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('payroll_config_rate_group_order', JSON.stringify(order));
    } catch {
      // ignore
    }
  };

  const reconcileOrder = (keys: string[], saved: string[]): string[] => {
    const keySet = new Set(keys);
    const base = saved.filter((k) => keySet.has(k));
    const missing = keys.filter((k) => !base.includes(k));
    return [...base, ...missing];
  };

  const getActiveBranchIdFromContext = (): number | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('branch_context');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const id = Number(parsed?.id);
      return Number.isFinite(id) ? id : null;
    } catch {
      return null;
    }
  };

  const fetchComputationData = async () => {
    try {
      setLoading(true);
      const data = await configService.getComputationData();
      setComputationData(data);

      // Populate rate items from payroll_config.
      const dbRates = data.components
        .filter((c) => c.group)
        .map((c) => ({
          id: c.id,
          group: String(c.group || 'work_rate'),
          category: (c.category as 'earnings' | 'deductions' | undefined) ?? undefined,
          code: String(c.code || ''),
          label: String(c.label || c.code || ''),
          value: typeof c.value === 'number' ? c.value : parseFloat(String(c.value || '0')) || 0,
          is_rate: (c.is_rate ? 1 : 0) as 0 | 1,
        }))
        .filter((c) => c.code.trim() !== '')
        .sort((a, b) => a.label.localeCompare(b.label));
      setRateItems(dbRates);

      // Keep group column order stable across refreshes (append new groups at the end)
      const groupKeys = Array.from(new Set(dbRates.map((r) => r.group || 'work_rate')));
      setRateGroupOrder((prev) => reconcileOrder(groupKeys, prev));
      
      // Set statutory/rate values by code (category/group independent).
      const getComponentValue = (code: string, fallback: string) => {
        const match = data.components.find((c) => c.code === code);
        return match ? String(match.value) : fallback;
      };
      setNightDiffPay(getComponentValue('nightpay', '1.10'));
      setRestDayPay(getComponentValue('restpay', '1.30'));
      setHolidayPay(getComponentValue('holiday', '2.00'));
      setRegularOT(getComponentValue('ot_regular', '1.25'));
      setRestDayOT(getComponentValue('ot_restday', '1.69'));
      setHolidayOT(getComponentValue('ot_holiday', '2.60'));
      setSssPercent(getComponentValue('sss', '0.00'));
      setPhilHealthPercent(getComponentValue('philhealth', '0.00'));
      setPagibigPercent(getComponentValue('pagibig', '0.00'));

      // Set default branch from active branch context (localStorage) if available, else first branch
      const activeBranchId = getActiveBranchIdFromContext();
      const defaultBranch =
        (activeBranchId ? data.branches.find(b => b.id === activeBranchId) : undefined) ??
        data.branches[0];

      if (defaultBranch) {
        setBranch(defaultBranch.name);
        setBranchId(defaultBranch.id);

        const defaultPosition =
          data.positions.find(p => p.is_active && p.branch_id === defaultBranch.id) ??
          data.positions.find(p => p.branch_id === defaultBranch.id);

        if (typeof defaultPosition?.id === 'number') {
          setPositionId(defaultPosition.id);
          loadSalary(defaultPosition.id, data);
        } else {
          setPositionId(null);
          calculateFromMonthly(0);
        }
      }
    } catch (error: any) {
      console.error('Error fetching computation data:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to load computation data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrencySymbol = (): string => computationData?.currency_symbol || '₱';
  const isStatutoryRateCode = (code: string): boolean => ['sss', 'philhealth', 'pagibig'].includes(code);
  const deductionCodes = new Set(['sss', 'philhealth', 'pagibig']);
  const getComponentByCode = (code: string) => computationData?.components?.find((c) => c.code === code);

  const inferCategory = (
    input: Partial<{ category?: string; group?: string; code?: string; is_rate?: number }>,
  ): 'earnings' | 'deductions' => {
    const explicit = String(input.category || '').toLowerCase();
    if (explicit === 'deductions') {
      return 'deductions';
    }
    if (explicit === 'earnings' || explicit === 'allowance' || explicit === 'rate') {
      return 'earnings';
    }

    const code = String(input.code || '').toLowerCase();
    if (deductionCodes.has(code)) return 'deductions';

    const group = String(input.group || '').toLowerCase();
    if (group.includes('deduct')) return 'deductions';
    return 'earnings';
  };

  const formatRatePreview = (item: { code: string; value: number; is_rate: 0 | 1 }): string => {
    if (item.is_rate === 0) {
      return `${getCurrencySymbol()} ${item.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (fixed)`;
    }
    // Rate: show % for statutory, otherwise show multiplier (x)
    if (isStatutoryRateCode(item.code)) {
      return `${(item.value * 100).toFixed(2)}%`;
    }
    const multiplier = item.value;
    const premiumPercent = (multiplier - 1) * 100;
    if (premiumPercent <= 0) {
      return `${multiplier}x`;
    }
    return `${multiplier}x (${premiumPercent.toFixed(0)}% premium)`;
  };

  const normalizeCode = (value: string): string =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^\w]+/g, '_')
      .replace(/^_+|_+$/g, '');

  const handleSaveRates = async () => {
    try {
      setRatesSaving(true);
      const payload = {
        rates: rateItems.map((r) => ({
          code: r.code,
          label: r.label,
          value: Number.isFinite(r.value) ? r.value : 0,
          is_rate: r.is_rate,
          group: r.group,
          category: inferCategory(r),
        })),
      };
      await configService.updateRate(payload);
      toast({
        title: 'Success',
        description: 'Payroll variable rates updated successfully',
        variant: 'default',
      });
      await fetchComputationData();
    } catch (error: any) {
      console.error('Error updating payroll rates:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update payroll rates',
        variant: 'destructive',
      });
    } finally {
      setRatesSaving(false);
    }
  };

  const handleAddRate = async () => {
    const label = newRate.label.trim();
    const code = normalizeCode(label);
    const valueNum = parseFloat(newRate.value);
    const group = newRate.group || rateGroupOrder[0] || 'work_rate';
    const category = newRate.category;
    const nextErrors: RateFormErrors = {};

    if (!label) nextErrors.label = 'Item name is required.';
    if (!group) nextErrors.group = 'Item group is required.';
    if (!category) nextErrors.category = 'Category is required.';
    if (newRate.is_rate !== 0 && newRate.is_rate !== 1) nextErrors.is_rate = 'Variable type is required.';
    if (!newRate.value.trim()) {
      nextErrors.value = 'Value is required.';
    } else if (!Number.isFinite(valueNum)) {
      nextErrors.value = 'Value must be a valid number.';
    }
    if (label && rateItems.some((r) => r.code === code)) {
      nextErrors.code = `Item name creates a duplicate code "${code}".`;
    }
    if (Object.keys(nextErrors).length > 0) {
      setRateFormErrors(nextErrors);
      return;
    }
    setRateFormErrors({});

    try {
      setRatesSaving(true);
      await configService.updateRate({
        rates: [{ code, label, value: valueNum, is_rate: newRate.is_rate, group, category }],
      });
      toast({ title: 'Success', description: 'Payroll item added', variant: 'default' });
      setNewRate({ code: '', label: '', value: '', is_rate: 1, group: '', category: 'earnings' });
      setAddRateOpen(false);
      await fetchComputationData();
    } catch (error: any) {
      console.error('Error adding payroll item:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to add payroll item',
        variant: 'destructive',
      });
    } finally {
      setRatesSaving(false);
    }
  };

  const openAddRate = (preset?: Partial<{ is_rate: 0 | 1 }>) => {
    const defaultGroup = rateGroupOrder[0] || 'work_rate';
    setNewRate((p) => ({
      ...p,
      is_rate: preset?.is_rate ?? p.is_rate,
      group: p.group || defaultGroup,
      category: p.category || inferCategory({ group: p.group || defaultGroup, is_rate: p.is_rate }),
    }));
    setRateFormErrors({});
    setAddRateOpen(true);
  };

  const closeRateFormDialog = () => {
    setAddRateOpen(false);
    setEditRateOpen(false);
    setEditRate(null);
    setCustomRateGroups([]);
    setAddGroupModalOpen(false);
    setTempGroupName('');
    setTempGroupError('');
    setRateFormErrors({});
  };

  const closeAddGroupDialog = () => {
    setAddGroupModalOpen(false);
    setTempGroupName('');
    setTempGroupError('');
  };

  const isRateFlagFromDb = (code: string): boolean => {
    const comp = getComponentByCode(code);
    // Default to true (rate) to keep legacy behavior when not set
    return Boolean(comp?.is_rate ?? true);
  };

  const formatGroupLabel = (groupKey: string): string =>
    groupKey
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const rateGroupOptions = useMemo(() => {
    const keys = Array.from(new Set([...rateItems.map((r) => r.group || 'work_rate'), ...customRateGroups]));
    return reconcileOrder(keys, rateGroupOrder);
  }, [rateItems, rateGroupOrder, customRateGroups]);

  const addTemporaryGroupType = () => {
    const normalized = normalizeCode(tempGroupName);
    if (!normalized) {
      setTempGroupError('Group name is required.');
      return;
    }
    if (rateGroupOptions.includes(normalized)) {
      setTempGroupError('Group already exists.');
      return;
    }

    if (!rateGroupOptions.includes(normalized)) {
      setCustomRateGroups((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]));
      setRateGroupOrder((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]));
    }

    if (editRate) {
      setEditRate({ ...editRate, group: normalized });
    } else {
      setNewRate((prev) => ({ ...prev, group: normalized }));
    }
    clearRateFormError('group');

    setTempGroupName('');
    setTempGroupError('');
    setAddGroupModalOpen(false);
  };

  const handleRateGroupDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const from = result.source.index;
    const to = result.destination.index;
    if (from === to) return;

    setRateGroupOrder((prev) => {
      const next = Array.from(prev);
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      persistRateGroupOrder(next);
      return next;
    });
  };

  const getRateRowFromDb = (
    code: string,
    group: string,
  ): { code: string; label: string; value: number; is_rate: 0 | 1; group?: string; category?: 'earnings' | 'deductions' } => {
    const comp = computationData?.components?.find((c) => c.group === group && c.code === code);
    return {
      code,
      label: String(comp?.label || code),
      value: typeof comp?.value === 'number' ? comp.value : parseFloat(String(comp?.value || '0')) || 0,
      is_rate: (comp?.is_rate ? 1 : 0) as 0 | 1,
      group: comp?.group || group,
      category: inferCategory({
        category: comp?.category,
        group: comp?.group || group,
        code,
        is_rate: (comp?.is_rate ? 1 : 0) as 0 | 1,
      }),
    };
  };

  const openEditRate = (code: string, group: string) => {
    const row = getRateRowFromDb(code, group);
    setEditRate({
      code: row.code,
      label: row.label,
      value: String(row.value),
      is_rate: row.is_rate,
      group: row.group,
      category: row.category,
      original_group: row.group,
    });
    setRateFormErrors({});
    setEditRateOpen(true);
  };

  const submitEditRate = async () => {
    if (!editRate) return;
    const label = editRate.label.trim();
    const valueNum = parseFloat(editRate.value);
    const targetGroup = editRate.group || 'work_rate';
    const nextErrors: RateFormErrors = {};

    if (!label) nextErrors.label = 'Item name is required.';
    if (!targetGroup) nextErrors.group = 'Item group is required.';
    if (!editRate.category) nextErrors.category = 'Category is required.';
    if (editRate.is_rate !== 0 && editRate.is_rate !== 1) nextErrors.is_rate = 'Variable type is required.';
    if (!editRate.value.trim()) {
      nextErrors.value = 'Value is required.';
    } else if (!Number.isFinite(valueNum)) {
      nextErrors.value = 'Value must be a valid number.';
    }
    if (Object.keys(nextErrors).length > 0) {
      setRateFormErrors(nextErrors);
      return;
    }
    setRateFormErrors({});

    try {
      setRatesSaving(true);
      const originalGroup = editRate.original_group || targetGroup;
      const category = editRate.category || inferCategory({
        category: editRate.category,
        code: editRate.code,
        group: targetGroup,
        is_rate: editRate.is_rate,
      });
      await configService.updateRate({
        rates: [
          {
            code: editRate.code,
            label,
            value: valueNum,
            is_rate: editRate.is_rate,
            group: targetGroup,
            category,
          },
        ],
        ...(originalGroup !== targetGroup
          ? { delete_items: [{ code: editRate.code, group: originalGroup, category }] }
          : {}),
      });
      toast({ title: 'Success', description: 'Rate item updated', variant: 'default' });
      setEditRateOpen(false);
      setEditRate(null);
      await fetchComputationData();
    } catch (error: any) {
      console.error('Error updating rate item:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update rate item',
        variant: 'destructive',
      });
    } finally {
      setRatesSaving(false);
    }
  };

  const deleteRate = async (code: string, group: string) => {
    try {
      setRatesSaving(true);
      const item = rateItems.find((r) => r.code === code && r.group === group);
      const category = inferCategory(item ?? { code, group, is_rate: 1 });
      await configService.updateRate({ delete_items: [{ code, group, category }] });
      toast({ title: 'Success', description: 'Rate item deleted', variant: 'default' });
      setDeleteRateTarget(null);
      await fetchComputationData();
    } catch (error: any) {
      console.error('Error deleting rate item:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete rate item',
        variant: 'destructive',
      });
    } finally {
      setRatesSaving(false);
    }
  };

  const calculateIncomeTax = (monthlySalary: number): number => {
    const annualSalary = monthlySalary * 12;
    let annualTax = 0;

    if (annualSalary <= 250000) {
      annualTax = 0;
    } else if (annualSalary <= 400000) {
      annualTax = (annualSalary - 250000) * 0.15;
    } else if (annualSalary <= 800000) {
      annualTax = 22500 + (annualSalary - 400000) * 0.20;
    } else if (annualSalary <= 2000000) {
      annualTax = 102500 + (annualSalary - 800000) * 0.25;
    } else if (annualSalary <= 8000000) {
      annualTax = 402500 + (annualSalary - 2000000) * 0.30;
    } else {
      annualTax = 2202500 + (annualSalary - 8000000) * 0.35;
    }

    return Math.round((annualTax / 12) * 100) / 100;
  };

  const calculateSSS = (monthlySalary: number): number => {
    if (monthlySalary <= 0) {
      return 0;
    }

    const sssRate = parseFloat(sssPercent) || 0.045;
    if (!isRateFlagFromDb('sss')) {
      return Math.round(sssRate * 100) / 100;
    }

    if (monthlySalary < 1000) {
      return 0;
    }

    const maxMSC = 30000;
    const msc = Math.min(monthlySalary, maxMSC);
    const contribution = msc * sssRate;

    return Math.round(contribution * 100) / 100;
  };

  const calculatePhilHealth = (monthlySalary: number): number => {
    if (monthlySalary <= 0) {
      return 0;
    }

    const philhealthRate = parseFloat(philHealthPercent) || 0.025;
    if (!isRateFlagFromDb('philhealth')) {
      return Math.round(philhealthRate * 100) / 100;
    }

    const maxPremiumBase = 100000;
    const premiumBase = Math.min(monthlySalary, maxPremiumBase);
    const contribution = premiumBase * philhealthRate;

    return Math.round(contribution * 100) / 100;
  };

  const calculatePagibig = (monthlySalary: number): number => {
    if (monthlySalary <= 0) {
      return 0;
    }

    const pagibigRate = parseFloat(pagibigPercent) || 0;
    if (!isRateFlagFromDb('pagibig')) {
      return Math.round(pagibigRate * 100) / 100;
    }

    const maxCompensation = 5000;
    const compensation = Math.min(monthlySalary, maxCompensation);

    let rate = 0.01;
    if (compensation > 1500) {
      rate = 0.02;
    }

    const finalRate = pagibigRate > 0 ? pagibigRate : rate;
    const contribution = compensation * finalRate;

    return Math.round(contribution * 100) / 100;
  };

  const calculateFromMonthly = (
    monthlyValue: number,
    preserve?: { field: BasicPayEditableField; raw: string },
  ) => {
    const value = typeof monthlyValue === 'number' && !isNaN(monthlyValue) ? monthlyValue : 0;
    const monthlyText = value.toFixed(2);
    const semiMonthlyText = (value / 2).toFixed(2);
    const dailyText = (value / 22).toFixed(2); // Assuming 22 working days
    const hourlyText = (value / 22 / 8).toFixed(2); // Assuming 8 hours per day

    setMonthly(preserve?.field === 'monthly' ? preserve.raw : monthlyText);
    setSemiMonthly(preserve?.field === 'semiMonthly' ? preserve.raw : semiMonthlyText);
    setDaily(preserve?.field === 'daily' ? preserve.raw : dailyText);
    setHourly(preserve?.field === 'hourly' ? preserve.raw : hourlyText);
    setGrossPay(value.toFixed(2));
    
    // Calculate 13th Month Pay (typically 1/12 of annual salary, or monthly salary)
    const thirteenthMonthPay = value;
    setThirteenthMonth(thirteenthMonthPay.toFixed(2));
    
    // Calculate Income Tax
    const incomeTaxAmount = calculateIncomeTax(value);
    setIncomeTax(incomeTaxAmount.toFixed(2));
    
    // Calculate statutory deductions using proper functions
    const sssDed = calculateSSS(value);
    const philHealthDed = calculatePhilHealth(value);
    const pagibigDed = calculatePagibig(value);
    
    // Total deductions include Income Tax
    const totalDed = incomeTaxAmount + sssDed + philHealthDed + pagibigDed;
    
    setSssDeduction(sssDed.toFixed(2));
    setPhilHealthDeduction(philHealthDed.toFixed(2));
    setPagibigDeduction(pagibigDed.toFixed(2));
    setTotalDeduction(totalDed.toFixed(2));
    setNetPay((value - totalDed).toFixed(2));
  };

  const loadSalary = (payrollPositionId: number, data?: ComputationData) => {
    const position = (data || computationData)?.positions?.find(p => p.id === payrollPositionId);
    
    if (position && position.base_salary != null) {
      const salary = typeof position.base_salary === 'number' 
        ? position.base_salary 
        : parseFloat(String(position.base_salary)) || 0;
      calculateFromMonthly(salary);
    } else {
      calculateFromMonthly(0);
    }
  };

  const handleMonthlyChange = (value: string) => {
    setMonthly(value);
    if (value.trim() === '') return;
    const numValue = Number.parseFloat(value);
    if (Number.isFinite(numValue)) {
      calculateFromMonthly(numValue, { field: 'monthly', raw: value });
    }
  };

  const handleMonthlyBlur = () => {
    const numValue = Number.parseFloat(monthly);
    calculateFromMonthly(Number.isFinite(numValue) ? numValue : 0);
  };

  const handleDailyChange = (value: string) => {
    setDaily(value);
    if (value.trim() === '') return;
    const numValue = Number.parseFloat(value);
    if (Number.isFinite(numValue)) {
      calculateFromMonthly(numValue * 22, { field: 'daily', raw: value });
    }
  };

  const handleDailyBlur = () => {
    const numValue = Number.parseFloat(daily);
    calculateFromMonthly(Number.isFinite(numValue) ? numValue * 22 : 0);
  };

  const handleSemiMonthlyChange = (value: string) => {
    setSemiMonthly(value);
    if (value.trim() === '') return;
    const numValue = Number.parseFloat(value);
    if (Number.isFinite(numValue)) {
      calculateFromMonthly(numValue * 2, { field: 'semiMonthly', raw: value });
    }
  };

  const handleSemiMonthlyBlur = () => {
    const numValue = Number.parseFloat(semiMonthly);
    calculateFromMonthly(Number.isFinite(numValue) ? numValue * 2 : 0);
  };

  const handleHourlyChange = (value: string) => {
    setHourly(value);
    if (value.trim() === '') return;
    const numValue = Number.parseFloat(value);
    if (Number.isFinite(numValue)) {
      calculateFromMonthly(numValue * 22 * 8, { field: 'hourly', raw: value });
    }
  };

  const handleHourlyBlur = () => {
    const numValue = Number.parseFloat(hourly);
    calculateFromMonthly(Number.isFinite(numValue) ? numValue * 22 * 8 : 0);
  };

  const formatCurrency = (value: string) => {
    const symbol = computationData?.currency_symbol || '₱';
    return `${symbol} ${parseFloat(value || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handlePositionChange = (value: string) => {
    const pos = computationData?.positions.find(p => typeof p.id === 'number' && p.id.toString() === value);
    if (typeof pos?.id === 'number') {
      setPositionId(pos.id);
      // Automatically load salary from position's base_salary
      loadSalary(pos.id, computationData ?? undefined);
    } else {
      setPositionId(null);
      calculateFromMonthly(0);
    }
  };


  const handleEditBasicPay = async () => {
    if (!isEditingBasicPay) {
      setIsEditingBasicPay(true);
      return;
    }

    if (!positionId || !branchId) {
      toast({
        title: 'Error',
        description: 'Please select position and branch',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      const monthlyValue = Number.parseFloat(monthly);
      if (!Number.isFinite(monthlyValue)) {
        toast({
          title: 'Error',
          description: 'Please enter a valid basic pay amount',
          variant: 'destructive',
        });
        return;
      }
      await positionService.update(positionId, {
        base_salary: monthlyValue,
        branch_id: branchId,
      });
      
      toast({
        title: 'Success',
        description: 'Basic pay updated successfully',
        variant: 'default',
      });
      
      setIsEditingBasicPay(false);
      // Reload data
      await fetchComputationData();
    } catch (error: any) {
      console.error('Error updating basic pay:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update basic pay',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const SECTION_INFO_CONTENT: Record<SectionInfoKey, { title: string; description: string }> = {
    basePay: {
      title: 'Base Pay Information',
      description:
        'This section sets the base salary for the selected position. You can edit monthly, daily, semi-monthly, or hourly rates, and all values auto-sync. When saved, it is stored as the monthly base pay.',
    },
    payrollItems: {
      title: 'Payroll Items Information',
      description:
        'Use this section to manage payroll variables such as earnings, deductions, and contributions. Set each item as Rate or Fixed, organize items by group, and use the menu to edit or delete entries.',
    },
    additionalCompensation: {
      title: 'Additional Compensation Information',
      description:
        'This section shows supplemental compensation values derived from the current base salary setup. The displayed 13th Month Pay is computed from the latest salary configuration.',
    },
    deductions: {
      title: 'Deductions Information',
      description:
        'This section displays estimated deductions including tax and statutory contributions such as SSS, PhilHealth, and Pagibig. Values update based on your current salary and payroll rate settings.',
    },
    totalComputation: {
      title: 'Total Computation Information',
      description:
        'This section summarizes the computed results: Gross Pay, Total Deduction, and Net Pay. It reflects the combined effect of base pay, configured rates, and deduction calculations.',
    },
  };
  const activeSectionInfo = infoModalSection ? SECTION_INFO_CONTENT[infoModalSection] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Basic Pay Section */}
        <Card>
          <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CardTitle className="italic md:text-lg font-semibold">Base Pay</CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground"
                    onClick={() => setInfoModalSection('basePay')}
                    aria-label="Base pay information"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
                <Button size="sm" onClick={handleEditBasicPay} disabled={saving || !positionId || !branchId}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : isEditingBasicPay ? 'Save Changes' : 'Edit Base Pay'}
                </Button>
              </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Select value={positionId?.toString() || ''} onValueChange={handlePositionChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {branchId && computationData?.positions
                        ?.filter(p => typeof p.id === 'number' && p.branch_id === branchId)
                        ?.sort((a, b) => {
                          const activeDiff = Number(b.is_active) - Number(a.is_active);
                          if (activeDiff !== 0) return activeDiff;
                          return (a.name || '').localeCompare(b.name || '');
                        })
                        ?.map((pos) => (
                        <SelectItem key={pos.id} value={String(pos.id)}>
                          {pos.name}{pos.is_active ? '' : ' (Inactive)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Monthly</Label>
                  {isEditingBasicPay ? (
                    <Input 
                      type="number" 
                      value={monthly} 
                      onChange={(e) => handleMonthlyChange(e.target.value)}
                      onBlur={handleMonthlyBlur}
                      step="0.01"
                      min="0"
                      placeholder="Enter monthly salary"
                    />
                  ) : (
                    <Input type="text" value={formatCurrency(monthly)} readOnly />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Daily</Label>
                  {isEditingBasicPay ? (
                    <Input
                      type="number"
                      value={daily}
                      onChange={(e) => handleDailyChange(e.target.value)}
                      onBlur={handleDailyBlur}
                      step="0.01"
                      min="0"
                      placeholder="Enter daily rate"
                    />
                  ) : (
                    <Input type="text" value={formatCurrency(daily)} readOnly />
                  )}
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Input type="text" value={branch || ''} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Semi-Monthly</Label>
                  {isEditingBasicPay ? (
                    <Input
                      type="number"
                      value={semiMonthly}
                      onChange={(e) => handleSemiMonthlyChange(e.target.value)}
                      onBlur={handleSemiMonthlyBlur}
                      step="0.01"
                      min="0"
                      placeholder="Enter semi-monthly rate"
                    />
                  ) : (
                    <Input type="text" value={formatCurrency(semiMonthly)} readOnly />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Hourly</Label>
                  {isEditingBasicPay ? (
                    <Input
                      type="number"
                      value={hourly}
                      onChange={(e) => handleHourlyChange(e.target.value)}
                      onBlur={handleHourlyBlur}
                      step="0.01"
                      min="0"
                      placeholder="Enter hourly rate"
                    />
                  ) : (
                    <Input type="text" value={formatCurrency(hourly)} readOnly />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <PayrollItemsCard
          rateItems={rateItems}
          rateGroupOrder={rateGroupOrder}
          ratesSaving={ratesSaving}
          saving={saving}
          onOpenInfo={() => setInfoModalSection('payrollItems')}
          onAddItem={() => openAddRate()}
          onDragEnd={handleRateGroupDragEnd}
          onEditItem={openEditRate}
          onDeleteItem={setDeleteRateTarget}
          formatGroupLabel={formatGroupLabel}
          formatRatePreview={formatRatePreview}
          reconcileOrder={reconcileOrder}
        />

                {/* Bottom 3 Cards in a Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Additional Compensation Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="italic md:text-lg font-semibold">Additional Compensation</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  onClick={() => setInfoModalSection('additionalCompensation')}
                  aria-label="Additional compensation information"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>13th Month Pay</Label>
                <Input type="text" value={formatCurrency(thirteenthMonth)} readOnly />
              </div>
            </CardContent>
          </Card>

          {/* Deductions Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="italic md:text-lg font-semibold">Deductions</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  onClick={() => setInfoModalSection('deductions')}
                  aria-label="Deductions information"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Income Tax</Label>
                <Input type="text" value={formatCurrency(incomeTax)} readOnly />
              </div>

              <div className="space-y-2">
                <Label>Social Security System</Label>
                <Input type="text" value={formatCurrency(sssDeduction)} readOnly />
              </div>

              <div className="space-y-2">
                <Label>PhilHealth</Label>
                <Input type="text" value={formatCurrency(philHealthDeduction)} readOnly />
              </div>

              <div className="space-y-2">
                <Label>Pagibig</Label>
                <Input type="text" value={formatCurrency(pagibigDeduction)} readOnly />
              </div>
            </CardContent>
          </Card>

          {/* Total Computation Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="italic md:text-lg font-semibold">Total Computation</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  onClick={() => setInfoModalSection('totalComputation')}
                  aria-label="Total computation information"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Gross Pay</Label>
                <Input type="text" value={formatCurrency(grossPay)} readOnly />
              </div>

              <div className="space-y-2">
                <Label>Total Deduction</Label>
                <Input type="text" value={formatCurrency(totalDeduction)} readOnly />
              </div>

              <div className="space-y-2">
                <Label>Net Pay</Label>
                <Input type="text" value={formatCurrency(netPay)} readOnly className="font-semibold" />
              </div>
            </CardContent>
          </Card>
        </div>

        <SectionInfoDialog
          open={Boolean(infoModalSection)}
          title={activeSectionInfo?.title}
          description={activeSectionInfo?.description}
          onClose={() => setInfoModalSection(null)}
        />

        <PayrollItemFormDialog
          open={addRateOpen || editRateOpen}
          editRate={editRate}
          newRate={newRate}
          rateGroupOptions={rateGroupOptions}
          formatGroupLabel={formatGroupLabel}
          rateFormErrors={rateFormErrors}
          ratesSaving={ratesSaving}
          onOpenAddGroup={() => setAddGroupModalOpen(true)}
          onCancel={closeRateFormDialog}
          onSubmit={editRate ? submitEditRate : handleAddRate}
          onLabelChange={(value) => {
            if (editRate) {
              setEditRate({ ...editRate, label: value });
            } else {
              setNewRate((p) => ({ ...p, label: value }));
            }
          }}
          onGroupChange={(value) => {
            if (editRate) {
              setEditRate({ ...editRate, group: value });
            } else {
              setNewRate((p) => ({ ...p, group: value }));
            }
          }}
          onCategoryChange={(value) => {
            if (editRate) {
              setEditRate({ ...editRate, category: value });
            } else {
              setNewRate((p) => ({ ...p, category: value }));
            }
          }}
          onTypeChange={(value) => {
            if (editRate) {
              setEditRate({ ...editRate, is_rate: value });
            } else {
              setNewRate((p) => ({ ...p, is_rate: value }));
            }
          }}
          onValueChange={(value) => {
            if (editRate) {
              setEditRate({ ...editRate, value });
            } else {
              setNewRate((p) => ({ ...p, value }));
            }
          }}
          clearRateFormError={clearRateFormError}
        />

        <AddGroupDialog
          open={addGroupModalOpen}
          tempGroupName={tempGroupName}
          tempGroupError={tempGroupError}
          ratesSaving={ratesSaving}
          onTempGroupNameChange={(value) => {
            setTempGroupName(value);
            if (tempGroupError) setTempGroupError('');
          }}
          onSubmit={addTemporaryGroupType}
          onCancel={closeAddGroupDialog}
        />

        <DeletePayrollItemDialog
          target={deleteRateTarget}
          ratesSaving={ratesSaving}
          onCancel={() => setDeleteRateTarget(null)}
          onConfirm={(code, group) => {
            void deleteRate(code, group);
          }}
        />
    </div>
  );
}
