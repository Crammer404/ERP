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
import { payrollService, type ComputationData, type PayrollComponent } from '@/services/payroll/payrollService';
import { useToast } from '@/hooks/use-toast';
import { Loader } from '@/components/ui/loader';

export default function ComputationPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [computationData, setComputationData] = useState<ComputationData | null>(null);
  
  // Basic Pay State
  const [designation, setDesignation] = useState('');
  const [designationId, setDesignationId] = useState<number | null>(null);
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

  const fetchComputationData = async () => {
    try {
      setLoading(true);
      const data = await payrollService.getComputationData();
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

      // Set default role and branch if available
      if (data.roles.length > 0) {
        setDesignation(data.roles[0].name);
        setDesignationId(data.roles[0].id);
      }
      if (data.branches.length > 0) {
        setBranch(data.branches[0].name);
        setBranchId(data.branches[0].id);
      }

      // Load salary if role and branch are set
      if (data.roles.length > 0 && data.branches.length > 0) {
        loadSalary(data.roles[0].id, data.branches[0].id, data);
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

  const calculateFromMonthly = (monthlyValue: number) => {
    setMonthly(monthlyValue.toFixed(2));
    setSemiMonthly((monthlyValue / 2).toFixed(2));
    setDaily((monthlyValue / 22).toFixed(2)); // Assuming 22 working days
    setHourly((monthlyValue / 22 / 8).toFixed(2)); // Assuming 8 hours per day
    setGrossPay(monthlyValue.toFixed(2));
    
    // Calculate deductions
    const sssDed = (monthlyValue * parseFloat(sssPercent) / 100) + parseFloat(sssFixed);
    const philHealthDed = (monthlyValue * parseFloat(philHealthPercent) / 100) + parseFloat(philHealthFixed);
    const pagibigDed = (monthlyValue * parseFloat(pagibigPercent) / 100) + parseFloat(pagibigFixed);
    const totalDed = sssDed + philHealthDed + pagibigDed;
    
    setSssDeduction(sssDed.toFixed(2));
    setPhilHealthDeduction(philHealthDed.toFixed(2));
    setPagibigDeduction(pagibigDed.toFixed(2));
    setTotalDeduction(totalDed.toFixed(2));
    setNetPay((monthlyValue - totalDed).toFixed(2));
  };

  const loadSalary = (roleId: number, branchId: number, data?: ComputationData) => {
    const salary = (data || computationData)?.salaries.find(
      s => s.role_id === roleId && s.branch_id === branchId
    );
    
    if (salary) {
      calculateFromMonthly(salary.monthly_salary);
    } else {
      // Reset to defaults if no salary found
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

  const handleDesignationChange = (value: string) => {
    const role = computationData?.roles.find(r => r.id.toString() === value);
    if (role) {
      setDesignation(role.name);
      setDesignationId(role.id);
      if (branchId) {
        loadSalary(role.id, branchId);
      }
    }
  };

  const handleBranchChange = (value: string) => {
    const branch = computationData?.branches.find(b => b.id.toString() === value);
    if (branch) {
      setBranch(branch.name);
      setBranchId(branch.id);
      if (designationId) {
        loadSalary(designationId, branch.id);
      }
    }
  };

  const handleEditBasicPay = async () => {
    if (!isEditingBasicPay) {
      setIsEditingBasicPay(true);
      return;
    }

    if (!designationId || !branchId) {
      toast({
        title: 'Error',
        description: 'Please select designation and branch',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      await payrollService.updatePay({
        role_id: designationId,
        branch_id: branchId,
        monthly: parseFloat(monthly),
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
      await payrollService.updateRate({
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
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-center h-64">
          <Loader size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6">Computation</h1>

      <div className="space-y-6">
        {/* Basic Pay Section */}
        <Card>
          <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="italic font-bold">Basic Pay</CardTitle>
                <Button size="sm" onClick={handleEditBasicPay} disabled={saving || !designationId || !branchId}>
                  {isEditingBasicPay ? 'Save' : 'Edit'}
                </Button>
              </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Designation</Label>
                  <Select value={designationId?.toString() || ''} onValueChange={handleDesignationChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select designation" />
                    </SelectTrigger>
                    <SelectContent>
                      {computationData?.roles.map((role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Monthly</Label>
                  <Input 
                    type="number" 
                    value={monthly} 
                    onChange={(e) => handleMonthlyChange(e.target.value)}
                    readOnly={!isEditingBasicPay}
                    step="0.01"
                    min="0"
                  />
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
                  <Select value={branchId?.toString() || ''} onValueChange={handleBranchChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {computationData?.branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id.toString()}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Button size="sm" onClick={handleEditDeductions} disabled={saving}>
                    Edit
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Social Security System</Label>
                  <Input type="text" value={`${sssPercent}%`} readOnly />
                  <p className="text-xs text-muted-foreground">Fixed Value {formatCurrency(sssFixed)}</p>
                </div>
                <div className="space-y-2">
                  <Label>PhilHealth</Label>
                  <Input type="text" value={`${philHealthPercent}%`} readOnly />
                  <p className="text-xs text-muted-foreground">Fixed Value {formatCurrency(philHealthFixed)}</p>
                </div>
                <div className="space-y-2">
                  <Label>Pagibig</Label>
                  <Input type="text" value={`${pagibigPercent}%`} readOnly />
                  <p className="text-xs text-muted-foreground">Fixed Value {formatCurrency(pagibigFixed)}</p>
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
    </div>
  );
}
