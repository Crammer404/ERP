'use client';

import { useEffect, useMemo, useRef } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { CheckCircle2, Circle, FileText, MoreVertical, RefreshCw, Search, X, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader } from '@/components/ui/loader';
import { useCurrencies } from '@/app/settings/currencies/hooks/useCurrencies';
import { formatCurrencyAmount } from '@/app/settings/currencies/services/currencyService';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DEFAULT_PAYROLL_TYPES,
  WIZARD_STEPS,
  GeneratePayrollPayload,
  GeneratePayrollUser,
  formatRequestedHoursLabel,
  formatRemainingMinutesLabel,
  formatClockTime12h,
  formatColaEntryEmployeeName,
  formatCashAdvanceEmployeeName,
  useGeneratePayrollModal,
} from '../hooks/use-generate-payroll';

interface GeneratePayrollDialogProps {
  onGenerate?: (payload: GeneratePayrollPayload) => Promise<void> | void;
  users?: GeneratePayrollUser[]; // optional static users if provided
  payrollTypes?: string[];
  triggerLabel?: string;
}


const GeneratePayrollDialog = ({
  onGenerate,
  users,
  payrollTypes = DEFAULT_PAYROLL_TYPES,
  triggerLabel = 'Generate Payroll',
}: GeneratePayrollDialogProps) => {
  const {
    open,
    setOpen,
    availablePayrollTypes,
    payrollType,
    setPayrollType,
    dateRange,
    handlePayrollRangeChange,
    handleClearRange,
    selectedUserIds,
    includeStatutory,
    setIncludeStatutory,
    includeCola,
    setIncludeCola,
    includeCashAdvance,
    setIncludeCashAdvance,
    availableUsers,
    employeeSearch,
    setEmployeeSearch,
    loadingUsers,
    usersError,
    isGenerating,
    isStepChecking,
    currentStep,
    stepError,
    showGenerateConfirm,
    setShowGenerateConfirm,
    showPendingOvertimeDialog,
    setShowPendingOvertimeDialog,
    showPendingEarlyOutDialog,
    setShowPendingEarlyOutDialog,
    pendingOvertimeRecords,
    pendingEarlyOutRecords,
    pendingOvertimeLoading,
    pendingEarlyOutLoading,
    cashAdvanceEntries,
    cashAdvanceLoading,
    fetchCashAdvanceEntries,
    statutoryActiveTab,
    setStatutoryActiveTab,
    statutoryEntries,
    statutoryLoading,
    fetchStatutoryEntries,
    colaEntries,
    colaLoading,
    fetchColaEntries,
    payrollTypeForSubmit,
    totalSteps,
    cashAdvanceWindow,
    activeStepMeta,
    activeBranchName,
    selectedRangeLabel,
    isStepConditionSatisfied,
    filteredUsers,
    selectAllState,
    handleToggleAll,
    handleToggleUser,
    handleClose,
    fetchPendingOvertimeRecords,
    fetchPendingEarlyOutRecords,
    selectedOvertimeRecord,
    approveOvertimeModalOpen,
    setApproveOvertimeModalOpen,
    rejectOvertimeModalOpen,
    setRejectOvertimeModalOpen,
    overtimePayType,
    setOvertimePayType,
    overtimeActionNotes,
    setOvertimeActionNotes,
    approveOvertimeSubmitting,
    rejectOvertimeSubmitting,
    openApproveOvertimeModalFromStep,
    openRejectOvertimeModalFromStep,
    confirmApproveOvertimeFromStep,
    confirmRejectOvertimeFromStep,
    selectedEarlyOutRecord,
    approveEarlyOutModalOpen,
    setApproveEarlyOutModalOpen,
    rejectEarlyOutModalOpen,
    setRejectEarlyOutModalOpen,
    earlyOutModalNotes,
    setEarlyOutModalNotes,
    earlyOutModalSubmitting,
    openApproveEarlyOutModalFromStep,
    openRejectEarlyOutModalFromStep,
    confirmApproveEarlyOutFromStep,
    confirmRejectEarlyOutFromStep,
    handleGenerate,
    handleNextStep,
    handleBackStep,
    goToOvertime,
    goToTimeClock,
  } = useGeneratePayrollModal({
    users,
    payrollTypes,
    onGenerate,
  });

  const { currencies } = useCurrencies();
  const { defaultCurrency } = useCurrency();
  const colaCurrencySymbol = useMemo(() => {
    if (defaultCurrency?.id != null) {
      const fromList = currencies.find((c) => c.id === defaultCurrency.id);
      if (fromList?.symbol) return fromList.symbol;
    }
    return defaultCurrency?.symbol;
  }, [currencies, defaultCurrency]);

  const stepperScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const container = stepperScrollRef.current;
    if (!container) return;
    const raf = requestAnimationFrame(() => {
      const el = container.querySelector<HTMLElement>(`[data-payroll-step="${currentStep}"]`);
      el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
    return () => cancelAnimationFrame(raf);
  }, [open, currentStep]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <FileText className="h-4 w-4 mr-2" />
        {triggerLabel}
      </Button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogContent
          className="w-full max-w-5xl h-[80vh] max-h-[80vh] flex flex-col [&>button]:hidden"
          onInteractOutside={(event) => event.preventDefault()}
        >
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <DialogTitle className="text-base font-semibold leading-none tracking-tight">
                {activeStepMeta.title}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                {activeStepMeta.subtitle}
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClose}
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="border rounded-lg p-4 bg-muted/30">
            <div
              ref={stepperScrollRef}
              className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth"
            >
              {WIZARD_STEPS.map((step, index) => {
                const isCompleted = step.id < currentStep;
                const isActive = step.id === currentStep;
                return (
                  <div key={step.id} className="flex items-center shrink-0" data-payroll-step={step.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-7 w-7 rounded-full flex items-center justify-center border ${
                          isCompleted
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : isActive
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'bg-background border-muted-foreground/40 text-muted-foreground'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-3 w-3 fill-current" />}
                      </div>
                      <div className="leading-tight">
                        <p className={`text-xs font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                          Step {step.id}
                        </p>
                        <p className={`text-[11px] ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {step.title}
                        </p>
                      </div>
                    </div>
                    {index < WIZARD_STEPS.length - 1 && (
                      <div className="w-8 sm:w-12 h-[2px] bg-border mx-2" />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <div className="w-full mx-auto flex-1 min-h-0">
              {stepError && (
                <p className="text-sm text-destructive">{stepError}</p>
              )}

            {currentStep === 1 && (
              <div className="w-full max-w-3xl mx-auto space-y-4 py-2">
                <div className="w-full min-w-[260px] max-w-2xl mx-auto space-y-2">
                  <Label>Select Payroll Type</Label>
                  <Select value={payrollType} onValueChange={setPayrollType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payroll type" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePayrollTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full min-w-[260px] max-w-2xl mx-auto space-y-2">
                  <Label>Payroll Range</Label>
                  <div className="flex flex-col sm:flex-row gap-2 items-stretch">
                    <DateRangePicker
                      date={dateRange}
                      onDateChange={handlePayrollRangeChange}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleClearRange}
                      className="sm:w-24"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="p-4 h-full min-h-0 flex flex-col gap-3">
                <div className="rounded-md border bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <Label>Select Employees</Label>
                      <p className="text-xs text-muted-foreground">
                        {filteredUsers.length} shown of {availableUsers.length} • {selectedUserIds.length} selected
                      </p>
                    </div>

                    <label
                      htmlFor="select-all-users"
                      className="flex items-center justify-center gap-2 flex-shrink-0 rounded-md border bg-muted/30 px-3 py-2 text-sm cursor-pointer hover:bg-muted/50 select-none"
                    >
                      <Checkbox
                        id="select-all-users"
                        checked={selectAllState}
                        onCheckedChange={(checked) =>
                          handleToggleAll(checked === true)
                        }
                      />
                      <span className="font-medium">Select All</span>
                    </label>
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    placeholder="Search employees..."
                    className="pl-10"
                  />
                </div>

                <ScrollArea className="flex-1 min-h-0 rounded-md border p-4">
                  <div className="space-y-3">
                    {loadingUsers ? (
                      <div className="flex justify-center py-4">
                        <Loader size="sm" />
                      </div>
                    ) : usersError ? (
                      <p className="text-sm text-destructive">{usersError}</p>
                    ) : availableUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No users found for this branch/range.
                      </p>
                    ) : filteredUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No employees match your search.
                      </p>
                    ) : (
                      filteredUsers.map((user) => {
                        const checked = selectedUserIds.includes(user.id);
                        return (
                          <div
                            key={user.id}
                            className="flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                id={`user-${user.id}`}
                                checked={checked}
                                onCheckedChange={(isChecked) =>
                                  handleToggleUser(user.id, isChecked === true)
                                }
                              />
                              <div className="space-y-0.5">
                                <Label htmlFor={`user-${user.id}`}>
                                  {user.id} - {user.name}
                                </Label>
                                {user.role && (
                                  <p className="text-xs text-muted-foreground">
                                    {user.role}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-3 p-4">
                <div className="rounded-md border bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <Label>Pending Overtime Check</Label>
                      <p className="text-sm">
                        <span className="font-bold text-amber-500">{pendingOvertimeRecords.length}</span> pending overtime requests in{' '}
                        <span className="font-medium text-amber-500">{activeBranchName}</span> on{' '}
                        <span className="font-medium text-amber-500">{selectedRangeLabel}</span>.
                      </p>
                      {pendingOvertimeRecords.length > 0 && (
                        <p className="font-bold text-xs text-amber-600">
                          Approve or reject all <span className="font-bold text-amber-500">{pendingOvertimeRecords.length}</span> pending records to proceed.
                        </p>
                      )}
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      className="shrink-0 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                      onClick={fetchPendingOvertimeRecords}
                      disabled={pendingOvertimeLoading}
                    >
                      <RefreshCw className={`h-4 w-4 ${pendingOvertimeLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </div>
                <div className="rounded-md border max-h-[280px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Requested Hours</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingOvertimeLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6">
                            <Loader size="sm" />
                          </TableCell>
                        </TableRow>
                      ) : pendingOvertimeRecords.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                            No pending overtime requests found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        pendingOvertimeRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{record.date_formatted}</TableCell>
                            <TableCell>{record.employee}</TableCell>
                            <TableCell>{formatRequestedHoursLabel(record.requested_hours)}</TableCell>
                            <TableCell className="max-w-[220px] truncate">{record.reason || '-'}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => openApproveOvertimeModalFromStep(record)}
                                    className="text-green-600 focus:text-green-600"
                                  >
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => openRejectOvertimeModalFromStep(record)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    Reject
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-3 p-4">
                <div className="rounded-md border bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <Label>Pending Early Out Check</Label>
                      <p className="text-sm">
                        <span className="font-bold text-amber-500">{pendingEarlyOutRecords.length}</span> pending early-out requests in{' '}
                        <span className="font-medium text-amber-500">{activeBranchName}</span> on{' '}
                        <span className="font-medium text-amber-500">{selectedRangeLabel}</span>.
                      </p>
                      {pendingEarlyOutRecords.length > 0 && (
                        <p className="font-bold text-xs text-amber-600">
                          Approve or reject all <span className="font-bold text-amber-500">{pendingEarlyOutRecords.length}</span> pending records to proceed.
                        </p>
                      )}
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      className="shrink-0 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                      onClick={fetchPendingEarlyOutRecords}
                      disabled={pendingEarlyOutLoading}
                    >
                      <RefreshCw className={`h-4 w-4 ${pendingEarlyOutLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </div>
                <div className="rounded-md border max-h-[280px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Scheduled Out</TableHead>
                        <TableHead>Actual Out</TableHead>
                        <TableHead>Remaining</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingEarlyOutLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-6">
                            <Loader size="sm" />
                          </TableCell>
                        </TableRow>
                      ) : pendingEarlyOutRecords.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                            No pending early-out requests found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        pendingEarlyOutRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{record.date}</TableCell>
                            <TableCell>{record.employee_name || '-'}</TableCell>
                            <TableCell>{formatClockTime12h(record.scheduled_clock_out_at)}</TableCell>
                            <TableCell>{formatClockTime12h(record.actual_clock_out_at)}</TableCell>
                            <TableCell>{formatRemainingMinutesLabel(record.remaining_minutes)}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => openApproveEarlyOutModalFromStep(record)}
                                    disabled={!record.request_id}
                                    className="text-green-600 focus:text-green-600"
                                  >
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => openRejectEarlyOutModalFromStep(record)}
                                    disabled={!record.request_id}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    Reject
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="p-4 h-full min-h-0 flex flex-col gap-3">
                <div className="rounded-md border bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className={`flex items-center gap-12 border-r pr-4 ${!includeCola ? 'text-muted-foreground' : ''}`}>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Label>COLA Inclusion</Label>
                          
                        </div>
                        <p className={`text-sm ${!includeCola ? 'text-muted-foreground' : ''}`}>
                          <span className="font-bold text-amber-500">{colaEntries.length}</span> employees with COLA configured in{' '}
                          <span className="font-medium text-amber-500">{activeBranchName}</span>.
                        </p>
                      </div>
                      <Switch checked={includeCola} onCheckedChange={setIncludeCola} />
                    </div>
                    <div className="shrink-0 flex items-center">
                      <Button
                        type="button"
                        size="sm"
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => void fetchColaEntries()}
                        disabled={colaLoading}
                      >
                        <RefreshCw className={`h-4 w-4 ${colaLoading ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </div>
                <div className={`rounded-md border flex-1 min-h-0 overflow-y-auto ${!includeCola ? 'opacity-60' : ''}`}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">Count</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead className="text-right whitespace-nowrap">COLA Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {colaLoading ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-6">
                            <Loader size="sm" />
                          </TableCell>
                        </TableRow>
                      ) : colaEntries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                            No COLA amounts configured for this branch.
                          </TableCell>
                        </TableRow>
                      ) : (
                        colaEntries.map((row, index) => (
                          <TableRow key={row.user_id}>
                            <TableCell className="text-muted-foreground tabular-nums">{index + 1}</TableCell>
                            <TableCell>
                              <div className="font-medium">
                                <span className="text-muted-foreground tabular-nums">{row.user_id}</span>
                                {' - '}
                                {formatColaEntryEmployeeName(row)}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="tabular-nums">
                                {formatCurrencyAmount(
                                  Number.isFinite(row.amount) ? row.amount : 0,
                                  colaCurrencySymbol
                                )}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {currentStep === 6 && (
              <div className="p-4 h-full min-h-0 flex flex-col gap-3">
                <div className="rounded-md border bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                  <div className={`flex items-center gap-12 border-r pr-4 ${!includeCashAdvance ? 'text-muted-foreground' : ''}`}>
                    <div className="min-w-0 flex-1 space-y-1">
                      <Label>Cash Advance Deductions</Label>
                        {cashAdvanceWindow ? (
                          <p className={`text-sm ${!includeCashAdvance ? 'text-muted-foreground' : ''}`}>
                            <span className="font-medium text-amber-500">{activeBranchName}</span>{' '}
                            Cash Advances deduction from{' '}
                            <span className="font-medium text-amber-500">
                              {format(cashAdvanceWindow.startDate, 'MMM d, yyyy')} - {format(cashAdvanceWindow.endDate, 'MMM d, yyyy')}
                            </span>
                            .
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">Please set payroll range first.</p>
                        )}
                       </div>
                       <Switch checked={includeCashAdvance} onCheckedChange={setIncludeCashAdvance} />
                    </div>

                    <div className="shrink-0 flex items-center">
                      <Button
                        type="button"
                        size="sm"
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => void fetchCashAdvanceEntries()}
                        disabled={cashAdvanceLoading || !cashAdvanceWindow}
                      >
                        <RefreshCw className={`h-4 w-4 ${cashAdvanceLoading ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </div>

                <div className={`rounded-md border max-h-[280px] overflow-y-auto ${!includeCashAdvance ? 'opacity-60' : ''}`}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee: {cashAdvanceEntries.length}</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Cash Advance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cashAdvanceLoading ? (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center py-6">
                              <Loader size="sm" />
                            </TableCell>
                          </TableRow>
                        ) : !cashAdvanceWindow ? (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center text-muted-foreground py-6">
                              Set payroll range first to compute the cash advance window.
                            </TableCell>
                          </TableRow>
                        ) : cashAdvanceEntries.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center text-muted-foreground py-6">
                              No active cash advances found in this window.
                            </TableCell>
                          </TableRow>
                        ) : (
                          cashAdvanceEntries.map((row) => (
                            <TableRow key={row.id}>
                              <TableCell>
                                <div className="font-medium">{formatCashAdvanceEmployeeName(row)}</div>
                                <div className="text-xs text-muted-foreground">{row.code}</div>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="tabular-nums">
                                  {formatCurrencyAmount(
                                    (() => {
                                      const outstanding = Number((row as any).outstanding_balance);
                                      if (Number.isFinite(outstanding) && outstanding > 0) return outstanding;
                                      const amount = Number((row as any).amount);
                                      return Number.isFinite(amount) ? amount : 0;
                                    })(),
                                    colaCurrencySymbol
                                  )}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                </div>
              </div>
            )}

            {currentStep === 7 && (
              <div className="p-4 h-full min-h-0 flex flex-col gap-3">
                <div className="rounded-md border bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className={`min-w-0 flex-1 space-y-1 ${!includeStatutory ? 'text-muted-foreground' : ''}`}>
                      <div className="flex items-center gap-2">
                        <Label>Statutory Deductions</Label>
                        <Switch checked={includeStatutory} onCheckedChange={setIncludeStatutory} />
                      </div>
                      <p className="text-sm">
                        Preview configured SSS / PhilHealth / Pag-IBIG for the selected employees.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Employees: {selectedUserIds.length}
                      </p>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      className="shrink-0 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => void fetchStatutoryEntries(statutoryActiveTab)}
                      disabled={statutoryLoading || selectedUserIds.length === 0}
                    >
                      <RefreshCw className={`h-4 w-4 ${statutoryLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </div>

                <div className={`rounded-md border p-3 ${!includeStatutory ? 'opacity-60' : ''}`}>
                  <Tabs value={statutoryActiveTab} onValueChange={(v) => setStatutoryActiveTab(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="sss">SSS</TabsTrigger>
                      <TabsTrigger value="philhealth">PhilHealth</TabsTrigger>
                      <TabsTrigger value="pagibig">Pag-IBIG</TabsTrigger>
                    </TabsList>

                    <TabsContent value={statutoryActiveTab} className="mt-4">
                      <div className="rounded-md border max-h-[280px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Employee</TableHead>
                              <TableHead className="w-[160px]">Mode</TableHead>
                              <TableHead className="w-[180px] text-right">Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {statutoryLoading ? (
                              <TableRow>
                                <TableCell colSpan={3} className="text-center py-6">
                                  <Loader size="sm" />
                                </TableCell>
                              </TableRow>
                            ) : statutoryEntries.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                                  No configured entries for selected employees.
                                </TableCell>
                              </TableRow>
                            ) : (
                              statutoryEntries.map((e) => {
                                const ui: any = (e as any)?.user_info;
                                const u: any = (e as any)?.user;
                                const first = ui?.first_name ?? u?.user_info?.first_name ?? '';
                                const last = ui?.last_name ?? u?.user_info?.last_name ?? '';
                                const fullName = `${first} ${last}`.trim();
                                const email = ui?.user?.email ?? u?.email ?? (e as any)?.employee?.email ?? '';
                                const name = fullName || email || `#${(e as any).user_id}`;
                                const raw = typeof e.amount === 'string' ? Number(e.amount) : (e.amount as any);
                                const num = Number.isFinite(raw) ? Number(raw) : 0;
                                const display = e.is_rate ? `${(num * 100).toFixed(2)}%` : formatCurrencyAmount(num, colaCurrencySymbol);

                                return (
                                  <TableRow key={e.id}>
                                    <TableCell className="font-medium">{(e as any).user_id} - {name}</TableCell>
                                    <TableCell>{e.is_rate ? 'Rate' : 'Fixed'}</TableCell>
                                    <TableCell className="text-right tabular-nums">{display}</TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}
            </div>
          </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2 mt-auto pt-4 border-t">
          <div className="flex items-center gap-2 ml-auto">
            {currentStep === 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isGenerating}
              >
                Cancel
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={(event) => handleBackStep(event)}
                disabled={isGenerating || isStepChecking}
              >
                Back
              </Button>
            )}
            <Button
              type="button"
              onClick={handleNextStep}
              disabled={isGenerating || isStepChecking || !isStepConditionSatisfied}
            >
              {isStepChecking
                ? 'Checking...'
                : currentStep === totalSteps
                  ? 'Confirm'
                  : 'Next'}
            </Button>
          </div>
        </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showGenerateConfirm} onOpenChange={setShowGenerateConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Payroll Generation</DialogTitle>
            <DialogDescription>
              Review the details below before generating payroll.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Payroll Type:</span> {payrollTypeForSubmit}</p>
            <p>
              <span className="font-medium">Payroll Range:</span>{' '}
              {dateRange?.from && dateRange?.to
                ? `${format(dateRange.from!, 'MMM d, yyyy')} - ${format(dateRange.to!, 'MMM d, yyyy')}`
                : 'Not set'}
            </p>
            <p><span className="font-medium">Employees:</span> {selectedUserIds.length}</p>
            <p><span className="font-medium">Include COLA:</span> {includeCola ? 'Yes' : 'No'}</p>
            <p><span className="font-medium">Include Cash Advance:</span> {includeCashAdvance ? 'Yes' : 'No'}</p>
            <p><span className="font-medium">Include Statutory:</span> {includeStatutory ? 'Yes' : 'No'}</p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowGenerateConfirm(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Generate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPendingOvertimeDialog} onOpenChange={setShowPendingOvertimeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pending Overtime Requests</DialogTitle>
            <DialogDescription>
              There are pending overtime requests for the selected employees in this date range.
              Please approve or reject all overtime before generating payroll.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              onClick={goToOvertime}
            >
              Go to Overtime
          </Button>
        </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPendingEarlyOutDialog} onOpenChange={setShowPendingEarlyOutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pending Early Time-Out Requests</DialogTitle>
            <DialogDescription>
              There are pending early time-out requests for the selected employees in this date range.
              Please approve or reject all early time-out requests before generating payroll.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              onClick={goToTimeClock}
            >
              Go to Time Clock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={approveOvertimeModalOpen} onOpenChange={setApproveOvertimeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Overtime Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this overtime request?
            </DialogDescription>
          </DialogHeader>
          {selectedOvertimeRecord && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-muted rounded-md space-y-1">
                <p className="text-sm"><strong>Employee:</strong> {selectedOvertimeRecord!.employee}</p>
                <p className="text-sm"><strong>Date:</strong> {selectedOvertimeRecord!.date_formatted}</p>
                <p className="text-sm"><strong>Hours:</strong> {formatRequestedHoursLabel(selectedOvertimeRecord!.requested_hours)}</p>
                <p className="text-sm"><strong>Reason:</strong> {selectedOvertimeRecord!.reason || '-'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Pay Type *</Label>
                <RadioGroup
                  value={overtimePayType}
                  onValueChange={(value) => setOvertimePayType(value as 'overtime' | 'regular')}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="overtime" id="approve-overtime" />
                    <Label htmlFor="approve-overtime" className="font-normal cursor-pointer">
                      Overtime Pay (Premium Rate)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="regular" id="approve-regular" />
                    <Label htmlFor="approve-regular" className="font-normal cursor-pointer">
                      Regular Hours (Regular Rate)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label className="text-sm font-medium">Notes (Optional)</Label>
                <Textarea
                  value={overtimeActionNotes}
                  onChange={(e) => setOvertimeActionNotes(e.target.value.slice(0, 1000))}
                  placeholder="Optionally add a short explanation or clarification."
                  className="mt-1"
                  rows={3}
                  maxLength={1000}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setApproveOvertimeModalOpen(false)}
              disabled={approveOvertimeSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmApproveOvertimeFromStep}
              className="bg-green-600 hover:bg-green-700"
              disabled={approveOvertimeSubmitting}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {approveOvertimeSubmitting ? 'Approving...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOvertimeModalOpen} onOpenChange={setRejectOvertimeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Overtime Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this overtime request?
            </DialogDescription>
          </DialogHeader>
          {selectedOvertimeRecord && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-muted rounded-md space-y-1">
                <p className="text-sm"><strong>Employee:</strong> {selectedOvertimeRecord!.employee}</p>
                <p className="text-sm"><strong>Date:</strong> {selectedOvertimeRecord!.date_formatted}</p>
                <p className="text-sm"><strong>Hours:</strong> {formatRequestedHoursLabel(selectedOvertimeRecord!.requested_hours)}</p>
                <p className="text-sm"><strong>Reason:</strong> {selectedOvertimeRecord!.reason || '-'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Rejection Reason *</Label>
                <Textarea
                  value={overtimeActionNotes}
                  onChange={(e) => setOvertimeActionNotes(e.target.value.slice(0, 1000))}
                  placeholder="Clearly explain why this request is being rejected."
                  className="mt-1"
                  rows={3}
                  maxLength={1000}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectOvertimeModalOpen(false)}
              disabled={rejectOvertimeSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmRejectOvertimeFromStep}
              className="bg-red-600 hover:bg-red-700"
              disabled={!overtimeActionNotes.trim() || rejectOvertimeSubmitting}
            >
              <XCircle className="h-4 w-4 mr-2" />
              {rejectOvertimeSubmitting ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={approveEarlyOutModalOpen} onOpenChange={setApproveEarlyOutModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Early Out Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this early-out request?
            </DialogDescription>
          </DialogHeader>
          {selectedEarlyOutRecord && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-muted rounded-md space-y-1">
                <p className="text-sm"><strong>Employee:</strong> {selectedEarlyOutRecord!.employee_name || '-'}</p>
                <p className="text-sm"><strong>Date:</strong> {selectedEarlyOutRecord!.date}</p>
                <p className="text-sm"><strong>Scheduled out:</strong> {formatClockTime12h(selectedEarlyOutRecord!.scheduled_clock_out_at)}</p>
                <p className="text-sm"><strong>Actual out:</strong> {formatClockTime12h(selectedEarlyOutRecord!.actual_clock_out_at)}</p>
                <p className="text-sm"><strong>Remaining:</strong> {formatRemainingMinutesLabel(selectedEarlyOutRecord!.remaining_minutes)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Notes (Optional)</Label>
                <Textarea
                  value={earlyOutModalNotes}
                  onChange={(e) => setEarlyOutModalNotes(e.target.value.slice(0, 1000))}
                  placeholder="Optionally add approval notes (maximum 1000 characters)."
                  className="mt-1"
                  rows={3}
                  maxLength={1000}
                />
                <p className="mt-1 text-xs text-muted-foreground">{earlyOutModalNotes.length}/1000 characters</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setApproveEarlyOutModalOpen(false)}
              disabled={earlyOutModalSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmApproveEarlyOutFromStep}
              className="bg-green-600 hover:bg-green-700"
              disabled={earlyOutModalSubmitting}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {earlyOutModalSubmitting ? 'Approving...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectEarlyOutModalOpen} onOpenChange={setRejectEarlyOutModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Early Out Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this early-out request?
            </DialogDescription>
          </DialogHeader>
          {selectedEarlyOutRecord && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-muted rounded-md space-y-1">
                <p className="text-sm"><strong>Employee:</strong> {selectedEarlyOutRecord!.employee_name || '-'}</p>
                <p className="text-sm"><strong>Date:</strong> {selectedEarlyOutRecord!.date}</p>
                <p className="text-sm"><strong>Scheduled out:</strong> {formatClockTime12h(selectedEarlyOutRecord!.scheduled_clock_out_at)}</p>
                <p className="text-sm"><strong>Actual out:</strong> {formatClockTime12h(selectedEarlyOutRecord!.actual_clock_out_at)}</p>
                <p className="text-sm"><strong>Remaining:</strong> {formatRemainingMinutesLabel(selectedEarlyOutRecord!.remaining_minutes)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Rejection Reason *</Label>
                <Textarea
                  value={earlyOutModalNotes}
                  onChange={(e) => setEarlyOutModalNotes(e.target.value.slice(0, 1000))}
                  placeholder="Clearly explain why this request is being rejected (maximum 1000 characters)."
                  className="mt-1"
                  rows={3}
                  maxLength={1000}
                />
                <p className="mt-1 text-xs text-muted-foreground">{earlyOutModalNotes.length}/1000 characters</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectEarlyOutModalOpen(false)}
              disabled={earlyOutModalSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmRejectEarlyOutFromStep}
              className="bg-red-600 hover:bg-red-700"
              disabled={earlyOutModalSubmitting || !earlyOutModalNotes.trim()}
            >
              <XCircle className="h-4 w-4 mr-2" />
              {earlyOutModalSubmitting ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GeneratePayrollDialog;

