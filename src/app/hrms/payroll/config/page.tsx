'use client';

import { useState, useEffect } from 'react';
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
import { Info } from 'lucide-react';
import { configService, type ComputationData } from './services/config-service';
import { positionService } from '../positions/services/position-service';
import { useToast } from '@/hooks/use-toast';
import { Loader } from '@/components/ui/loader';

export default function ComputationPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [computationData, setComputationData] = useState<ComputationData | null>(null);
  
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
  const [sssFixed, setSssFixed] = useState('0.00');
  const [philHealthPercent, setPhilHealthPercent] = useState('0.00');
  const [philHealthFixed, setPhilHealthFixed] = useState('0.00');
  const [pagibigPercent, setPagibigPercent] = useState('0.00');
  const [pagibigFixed, setPagibigFixed] = useState('0.00');

  // Actual Deductions State
  const [incomeTax, setIncomeTax] = useState('0.00');
  const [sssDeduction, setSssDeduction] = useState('0.00');
  const [philHealthDeduction, setPhilHealthDeduction] = useState('0.00');
  const [pagibigDeduction, setPagibigDeduction] = useState('0.00');

  // Total Computation State
  const [grossPay, setGrossPay] = useState('0.00');
  const [totalDeduction, setTotalDeduction] = useState('0.00');
  const [netPay, setNetPay] = useState('0.00');

  // Fetch computation data on mount
  useEffect(() => {
    fetchComputationData();
  }, []);

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
      
      // Set rates from components
      const rates = data.components.filter(c => c.group === 'rates');
      rates.forEach(rate => {
        const value = String(rate.value);
        switch(rate.code) {
          case 'nightpay':
            setNightDiffPay(value);
            break;
          case 'restpay':
            setRestDayPay(value);
            break;
          case 'holiday':
            setHolidayPay(value);
            break;
          case 'ot_regular':
            setRegularOT(value);
            break;
          case 'ot_restday':
            setRestDayOT(value);
            break;
          case 'ot_holiday':
            setHolidayOT(value);
            break;
          case 'sss':
            setSssPercent(value);
            break;
          case 'f_sss':
            setSssFixed(value);
            break;
          case 'philhealth':
            setPhilHealthPercent(value);
            break;
          case 'f_philhealth':
            setPhilHealthFixed(value);
            break;
          case 'pagibig':
            setPagibigPercent(value);
            break;
          case 'f_pagibig':
            setPagibigFixed(value);
            break;
        }
      });

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
    const f_sss = parseFloat(sssFixed) || 0;

    if (monthlySalary < 1000) {
      return 0;
    }

    if (monthlySalary <= 3250 && f_sss > 0) {
      return Math.round(f_sss * 100) / 100;
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
    const f_philhealth = parseFloat(philHealthFixed) || 0;

    if (monthlySalary < 10000 && f_philhealth > 0) {
      return Math.round(f_philhealth * 100) / 100;
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
    const f_pagibig = parseFloat(pagibigFixed) || 0;

    if (monthlySalary < 1500 && f_pagibig > 0) {
      return Math.round(f_pagibig * 100) / 100;
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

  const calculateFromMonthly = (monthlyValue: number) => {
    const value = typeof monthlyValue === 'number' && !isNaN(monthlyValue) ? monthlyValue : 0;
    setMonthly(value.toFixed(2));
    setSemiMonthly((value / 2).toFixed(2));
    setDaily((value / 22).toFixed(2)); // Assuming 22 working days
    setHourly((value / 22 / 8).toFixed(2)); // Assuming 8 hours per day
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
    const numValue = parseFloat(value) || 0;
    calculateFromMonthly(numValue);
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
      await positionService.update(positionId, {
        base_salary: parseFloat(monthly),
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

  const handleEditDeductions = async () => {
    try {
      setSaving(true);
      await configService.updateRate({
        nightpay: parseFloat(nightDiffPay),
        restpay: parseFloat(restDayPay),
        holiday: parseFloat(holidayPay),
        ot_regular: parseFloat(regularOT),
        ot_restday: parseFloat(restDayOT),
        ot_holiday: parseFloat(holidayOT),
        sss: parseFloat(sssPercent),
        philhealth: parseFloat(philHealthPercent),
        pagibig: parseFloat(pagibigPercent),
        f_sss: parseFloat(sssFixed),
        f_philhealth: parseFloat(philHealthFixed),
        f_pagibig: parseFloat(pagibigFixed),
      });
      
      toast({
        title: 'Success',
        description: 'Deduction rates updated successfully',
        variant: 'default',
      });
      
      // Reload data
      await fetchComputationData();
    } catch (error: any) {
      console.error('Error updating deduction rates:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update deduction rates',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

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
                <CardTitle className="italic font-bold">Basic Pay</CardTitle>
                {/* <Button size="sm" onClick={handleEditBasicPay} disabled={saving || !positionId || !branchId}>
                  {isEditingBasicPay ? 'Save' : 'Edit'}
                </Button> */}
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
                  <Input type="text" value={formatCurrency(daily)} readOnly />
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
                  <Input type="text" value={formatCurrency(semiMonthly)} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Hourly</Label>
                  <Input type="text" value={formatCurrency(hourly)} readOnly />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payroll Variables Rates Section */}
        <Card>
          <CardHeader>
            <CardTitle className="italic font-bold">Payroll Variables Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Column 1: Work Pay */}
              <div className="space-y-4">
                <h3 className="font-semibold">Work Pay</h3>
                <div className="space-y-2">
                  <Label>Night Differential Pay</Label>
                  <Input type="text" value={`${nightDiffPay}x`} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Rest Day Pay</Label>
                  <Input type="text" value={`${restDayPay}x`} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Holiday Pay</Label>
                  <Input type="text" value={`${holidayPay}x`} readOnly />
                </div>
              </div>

              {/* Column 2: Overtime Pay */}
              <div className="space-y-4">
                <h3 className="font-semibold">Overtime Pay</h3>
                <div className="space-y-2">
                  <Label>Regular Overtime</Label>
                  <Input type="text" value={`${regularOT}x`} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Rest Day Overtime</Label>
                  <Input type="text" value={`${restDayOT}x`} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Holiday Overtime</Label>
                  <Input type="text" value={`${holidayOT}x`} readOnly />
                </div>
              </div>

              {/* Column 3: Deductions */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Deductions</h3>
                  {/* <Button size="sm" onClick={handleEditDeductions} disabled={saving}>
                    Edit
                  </Button> */}
                </div>
                <div className="space-y-2">
                  <Label>Social Security System</Label>
                  <Input type="text" value={`${((parseFloat(sssPercent) || 0) * 100).toFixed(2)}%`} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>PhilHealth</Label>
                  <Input type="text" value={`${((parseFloat(philHealthPercent) || 0) * 100).toFixed(2)}%`} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Pagibig</Label>
                  <Input type="text" value={`${((parseFloat(pagibigPercent) || 0) * 100).toFixed(2)}%`} readOnly />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom 3 Cards in a Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Additional Compensation Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Additional Compensation</CardTitle>
                <Info className="h-4 w-4 text-muted-foreground" />
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
                <CardTitle>Deductions</CardTitle>
                <Info className="h-4 w-4 text-muted-foreground" />
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
                <CardTitle>Total Computation</CardTitle>
                <Info className="h-4 w-4 text-muted-foreground" />
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
    </div>
  );
}
