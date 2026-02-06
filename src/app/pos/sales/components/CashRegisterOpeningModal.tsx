'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { fetchAvailableCashRegisters, openSession, closeSession, fetchSessionPaymentSummary, fetchExpectedBalances, type CashRegister, type ExpectedBalances, type CashRegisterClosingCase } from '@/app/pos/counters/service/cashRegisterService';
import { Plus, Minus, Calculator, Banknote, Coins, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BillCounts, BILLS, COINS, DENOMINATIONS, getHighlightColorClasses } from '../lib/cashRegisterDenominations';
import { useCurrency } from '@/contexts/CurrencyContext';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { useAuth } from '@/components/providers/auth-provider';

interface NonCashMethodSummary {
  name: string;
  amount: number;
}

interface OnlinePaymentMethod {
  id: number;
  name: string;
}

interface CashRegisterOpeningModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionOpened: () => void;
  onSessionOpening?: () => void;
  defaultCashRegisterId?: number | null;
}

export function CashRegisterOpeningModal({
  isOpen,
  onOpenChange,
  onSessionOpened,
  onSessionOpening,
  defaultCashRegisterId,
}: CashRegisterOpeningModalProps) {
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [selectedCashRegisterId, setSelectedCashRegisterId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const selectedCashRegister = useMemo(() => {
    if (!selectedCashRegisterId) return null;
    const id = Number(selectedCashRegisterId);
    return cashRegisters.find((r) => r.id === id) ?? null;
  }, [cashRegisters, selectedCashRegisterId]);
  const selectedStatus = selectedCashRegister?.open_session?.status ?? 'CLOSED';
  const [billCounts, setBillCounts] = useState<BillCounts>({
    bill_1000: 0,
    bill_500: 0,
    bill_200: 0,
    bill_100: 0,
    bill_50: 0,
    bill_20: 0,
    coin_20: 0,
    coin_10: 0,
    coin_5: 0,
    coin_1: 0,
    coin_0_25: 0,
    coin_0_10: 0,
    coin_0_05: 0,
    coin_0_01: 0,
  });
  const [billCountInputs, setBillCountInputs] = useState<Record<keyof BillCounts, string>>({
    bill_1000: '',
    bill_500: '',
    bill_200: '',
    bill_100: '',
    bill_50: '',
    bill_20: '',
    coin_20: '',
    coin_10: '',
    coin_5: '',
    coin_1: '',
    coin_0_25: '',
    coin_0_10: '',
    coin_0_05: '',
    coin_0_01: '',
  });
  const [code, setCode] = useState('');
  const [nonCashTotal, setNonCashTotal] = useState<number>(0);
  const [nonCashMethods, setNonCashMethods] = useState<NonCashMethodSummary[]>([]);
  const [onlinePaymentAmounts, setOnlinePaymentAmounts] = useState<Record<number, string>>({});
  const [onlineCollapsed, setOnlineCollapsed] = useState(false);
  const [cashCollapsed, setCashCollapsed] = useState(false);
  const [expectedBalances, setExpectedBalances] = useState<ExpectedBalances | null>(null);
  const [shortageConfirmOpen, setShortageConfirmOpen] = useState(false);
  const [shortageConfirmData, setShortageConfirmData] = useState<{
    expected: number;
    counted: number;
    shortBy: number;
  } | null>(null);
  const [closeSuccessDialogOpen, setCloseSuccessDialogOpen] = useState(false);
  const { defaultCurrency } = useCurrency();
  const { paymentMethods } = usePaymentMethods();
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();

  const onlinePaymentMethods = useMemo<OnlinePaymentMethod[]>(() => {
    return paymentMethods
      .filter((pm) => (pm.slug || '').toLowerCase() !== 'cash')
      .filter((pm) => pm.isActive)
      .map((pm) => ({ id: pm.id, name: pm.name }));
  }, [paymentMethods]);

  const onlinePaymentMethodNameSet = useMemo(() => {
    return new Set(onlinePaymentMethods.map((m) => m.name));
  }, [onlinePaymentMethods]);

  const currencySymbol = defaultCurrency?.symbol ?? '';

  const formatMoney = (amount: number) => {
    return `${currencySymbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDenomination = (value: number) => {
    const fractionDigits = value < 1 ? 2 : 0;
    return `${currencySymbol}${value.toLocaleString(undefined, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })}`;
  };

  const totalAmount = useMemo(() => {
    return DENOMINATIONS.reduce((sum, denom) => {
      return sum + (billCounts[denom.key] * denom.value);
    }, 0);
  }, [billCounts]);

  const onlineTotal = useMemo(() => {
    return Object.values(onlinePaymentAmounts).reduce((sum, v) => {
      const n = parseFloat(v || '0');
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
  }, [onlinePaymentAmounts]);

  const displayBalance = useMemo(() => {
    return totalAmount + onlineTotal;
  }, [totalAmount, onlineTotal]);

  useEffect(() => {
    if (isOpen) {
      loadCashRegisters();
      if (defaultCashRegisterId && !selectedCashRegisterId) {
        setSelectedCashRegisterId(defaultCashRegisterId.toString());
      }
    } else {
      setBillCounts({
        bill_1000: 0,
        bill_500: 0,
        bill_200: 0,
        bill_100: 0,
        bill_50: 0,
        bill_20: 0,
        coin_20: 0,
        coin_10: 0,
        coin_5: 0,
        coin_1: 0,
        coin_0_25: 0,
        coin_0_10: 0,
        coin_0_05: 0,
        coin_0_01: 0,
      });
      setBillCountInputs({
        bill_1000: '',
        bill_500: '',
        bill_200: '',
        bill_100: '',
        bill_50: '',
        bill_20: '',
        coin_20: '',
        coin_10: '',
        coin_5: '',
        coin_1: '',
        coin_0_25: '',
        coin_0_10: '',
        coin_0_05: '',
        coin_0_01: '',
      });
      setSelectedCashRegisterId('');
      setCode('');
      setOnlinePaymentAmounts({});
      setExpectedBalances(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (onlinePaymentMethods.length === 0) return;
    setOnlinePaymentAmounts(prev => {
      const next: Record<number, string> = {};
      onlinePaymentMethods.forEach((m) => {
        next[m.id] = prev[m.id] ?? '';
      });
      return next;
    });
  }, [isOpen, onlinePaymentMethods]);

  useEffect(() => {
    if (nonCashMethods.length > 0) {
      setOnlinePaymentAmounts(prev => {
        const updated = { ...prev };
        nonCashMethods.forEach(method => {
          if (onlinePaymentMethodNameSet.has(method.name)) {
            const mapped = onlinePaymentMethods.find((m) => m.name === method.name);
            if (mapped) {
              updated[mapped.id] = method.amount > 0 ? method.amount.toFixed(2) : '';
            }
          }
        });
        return updated;
      });
    }
  }, [nonCashMethods, onlinePaymentMethods, onlinePaymentMethodNameSet]);

  useEffect(() => {
    if (!isOpen) return;
    if (selectedStatus !== 'OPEN') return;
    const sessionId = selectedCashRegister?.open_session?.id;
    if (!sessionId) return;

    // Load opening balances from session
    const session = selectedCashRegister?.open_session;
    if (session?.opening_online_payments) {
      const openingPayments: Record<number, string> = {};
      session.opening_online_payments.forEach((op: any) => {
        if (op?.payment_method_id && op?.amount) {
          openingPayments[op.payment_method_id] = Number(op.amount).toFixed(2);
        }
      });
      setOnlinePaymentAmounts((prev) => ({ ...prev, ...openingPayments }));
    }

    // Also load sales summary to show total expected
    fetchSessionPaymentSummary(sessionId)
      .then((res) => {
        // Don't overwrite opening balances, just use for reference
        // The expected balances will show the total (opening + sales)
      })
      .catch(() => {});
  }, [isOpen, selectedStatus, selectedCashRegister?.open_session?.id, selectedCashRegister?.open_session?.opening_online_payments]);

  useEffect(() => {
    if (!isOpen) return;
    if (selectedStatus !== 'OPEN') {
      setExpectedBalances(null);
      return;
    }
    const sessionId = selectedCashRegister?.open_session?.id;
    if (!sessionId) return;

    fetchExpectedBalances(sessionId)
      .then((res) => {
        const balances = res?.data ?? null;
        setExpectedBalances(balances);
        
        // Auto-populate online payment fields with expected amounts (opening + sales)
        // This makes closing easier since online payments are exact amounts (no change)
        if (balances?.expected_balances_by_method && balances.expected_balances_by_method.length > 0) {
          setOnlinePaymentAmounts((prev) => {
            const updated = { ...prev };
            balances.expected_balances_by_method.forEach((ebm: any) => {
              if (ebm.payment_method_id && ebm.expected_balance > 0) {
                updated[ebm.payment_method_id] = ebm.expected_balance.toFixed(2);
              }
            });
            return updated;
          });
        }
      })
      .catch(() => {
        setExpectedBalances(null);
      });
  }, [isOpen, selectedStatus, selectedCashRegister?.open_session?.id]);

  const expectedCashBalance = useMemo(() => {
    return Number(expectedBalances?.expected_cash_balance ?? 0);
  }, [expectedBalances]);
  const expectedOnlineBalance = useMemo(() => {
    return Number(expectedBalances?.expected_online_balance ?? 0);
  }, [expectedBalances]);
  const expectedTotalBalance = useMemo(() => {
    const total = (expectedBalances as any)?.expected_total_balance;
    return Number(
      Number.isFinite(total)
        ? total
        : (expectedCashBalance + expectedOnlineBalance)
    );
  }, [expectedBalances, expectedCashBalance, expectedOnlineBalance]);

  const closingCase = useMemo<CashRegisterClosingCase>(() => {
    if (selectedStatus !== 'OPEN') return 'SALE';
    const base = expectedBalances?.case;
    if (base === 'NO_SALE') return 'NO_SALE';
    const variance = (totalAmount + onlineTotal) - expectedTotalBalance;
    if (variance < -0.01) return 'SHORTED';
    return 'SALE';
  }, [expectedBalances?.case, expectedTotalBalance, selectedStatus, totalAmount, onlineTotal]);

  const loadCashRegisters = async () => {
    setLoading(true);
    try {
      const response = await fetchAvailableCashRegisters();
      if (response?.data && Array.isArray(response.data)) {
        setCashRegisters(response.data);
        if (response.data.length === 1) {
          setSelectedCashRegisterId(response.data[0].id.toString());
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load cash registers.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBillCount = (key: keyof BillCounts, delta: number) => {
    setBillCounts(prev => {
      const next = Math.max(0, prev[key] + delta);
      setBillCountInputs(inputs => ({
        ...inputs,
        [key]: String(next)
      }));
      return {
        ...prev,
        [key]: next
      };
    });
  };

  const setBillCount = (key: keyof BillCounts, nextValue: number) => {
    setBillCounts(prev => ({
      ...prev,
      [key]: Math.max(0, Number.isFinite(nextValue) ? nextValue : 0)
    }));
  };

  const setBillCountInput = (key: keyof BillCounts, raw: string) => {
    setBillCountInputs(prev => ({
      ...prev,
      [key]: raw
    }));
    if (raw === '') {
      setBillCount(key, 0);
      return;
    }
    const parsed = parseInt(raw, 10);
    setBillCount(key, Number.isNaN(parsed) ? 0 : parsed);
  };

  const handleClear = () => {
    setBillCounts({
      bill_1000: 0,
      bill_500: 0,
      bill_200: 0,
      bill_100: 0,
      bill_50: 0,
      bill_20: 0,
      coin_20: 0,
      coin_10: 0,
      coin_5: 0,
      coin_1: 0,
      coin_0_25: 0,
      coin_0_10: 0,
      coin_0_05: 0,
      coin_0_01: 0,
    });
    setBillCountInputs({
      bill_1000: '',
      bill_500: '',
      bill_200: '',
      bill_100: '',
      bill_50: '',
      bill_20: '',
      coin_20: '',
      coin_10: '',
      coin_5: '',
      coin_1: '',
      coin_0_25: '',
      coin_0_10: '',
      coin_0_05: '',
      coin_0_01: '',
    });
    if (selectedStatus === 'CLOSED') {
      setOnlinePaymentAmounts(prev => {
        const cleared: Record<number, string> = {};
        Object.keys(prev).forEach((k) => {
          cleared[Number(k)] = '';
        });
        return cleared;
      });
    }
  };

  const isManager = useMemo(() => {
    if (!user?.role_name) return false;
    const roleLower = user.role_name.toLowerCase();
    return roleLower.includes('manager');
  }, [user]);

  const needsCodeForOpening = useMemo(() => {
    if (!selectedCashRegister || !user?.id) return false;
    const userId = Number(user.id);
    const assignedId = selectedCashRegister.assigned_user_id ? Number(selectedCashRegister.assigned_user_id) : null;
    if (assignedId === userId) return false;
    return isManager;
  }, [selectedCashRegister, user, isManager]);

  const needsCodeForClosing = useMemo(() => {
    if (!selectedCashRegister || !user?.id || !selectedCashRegister.open_session) return false;
    const userId = Number(user.id);
    const assignedId = selectedCashRegister.assigned_user_id ? Number(selectedCashRegister.assigned_user_id) : null;
    const sessionUserId = Number(selectedCashRegister.open_session.user_id);
    if (assignedId === userId || sessionUserId === userId) return false;
    return isManager;
  }, [selectedCashRegister, user, isManager]);

  const handleSubmit = async () => {
    if (!selectedCashRegisterId || !selectedCashRegister) {
      toast({
        title: "Error",
        description: "Please select a cash register.",
        variant: "destructive"
      });
      return;
    }

    if (totalAmount <= 0) {
      toast({
        title: "Error",
        description: "Please count at least some bills/coins.",
        variant: "destructive"
      });
      return;
    }

      const isOpening = selectedStatus === 'CLOSED';
      
    if (isOpening && needsCodeForOpening) {
      if (!code.trim()) {
        toast({
          title: "Error",
          description: "Code is required to open a cash register assigned to another user.",
          variant: "destructive"
        });
        return;
      }
      if (code.trim().length < 4) {
        toast({
          title: "Error",
          description: "Code must be at least 4 characters.",
          variant: "destructive"
        });
        return;
      }
    }


    setSubmitting(true);
    try {
      if (isOpening) {
        onSessionOpening?.();
        const openingBills: Record<string, number> = {};
        Object.entries(billCounts).forEach(([key, count]) => {
          if (count > 0) {
            openingBills[key] = count;
          }
        });
        const openingOnlinePayments = Object.entries(onlinePaymentAmounts)
          .map(([paymentMethodId, amountStr]) => {
            const amount = parseFloat(amountStr || '0');
            return {
              payment_method_id: Number(paymentMethodId),
              amount: Number.isFinite(amount) ? Number(amount.toFixed(2)) : 0,
            };
          })
          .filter((row) => row.amount > 0);

        await openSession({
          cash_register_id: parseInt(selectedCashRegisterId),
          opening_balance: displayBalance,
          opening_cash_balance: totalAmount,
          opening_bills: Object.keys(openingBills).length > 0 ? openingBills : undefined,
          opening_online_payments: openingOnlinePayments.length > 0 ? openingOnlinePayments : undefined,
          override_code: needsCodeForOpening ? code.trim() : undefined,
        });

        toast({
          title: "Success",
          description: "Cash register session opened successfully!",
          variant: "success"
        });
        onSessionOpened();
      } else {
        const performClose = async () => {
          const sessionId = selectedCashRegister.open_session?.id;
          if (!sessionId) {
            throw new Error('No open session found to close.');
          }

          const closingBills: Record<string, number> = {};
          Object.entries(billCounts).forEach(([key, count]) => {
            if (count > 0) {
              closingBills[key] = count;
            }
          });
          const closingOnlinePayments = Object.entries(onlinePaymentAmounts)
            .map(([paymentMethodId, amountStr]) => {
              const amount = parseFloat(amountStr || '0');
              return {
                payment_method_id: Number(paymentMethodId),
                amount: Number.isFinite(amount) ? Number(amount.toFixed(2)) : 0,
              };
            })
            .filter((row) => row.amount > 0);

          const closePayload: any = {
            counted_closing_balance: totalAmount,
            code: code && code.trim() ? code.trim() : null,
            closing_bills: Object.keys(closingBills).length > 0 ? closingBills : undefined,
            closing_online_payments: closingOnlinePayments.length > 0 ? closingOnlinePayments : undefined,
          };

          await closeSession(sessionId, closePayload);
        };

        if (closingCase === 'SHORTED' && expectedBalances) {
          const expected = expectedCashBalance;
          const counted = totalAmount;
          const shortBy = Math.max(0, expected - counted);
          setShortageConfirmData({ expected, counted, shortBy });
          setShortageConfirmOpen(true);
          setSubmitting(false);
          return;
        }

        await performClose();

        setSubmitting(false);
        setCloseSuccessDialogOpen(true);
        onOpenChange(false);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || `Failed to ${selectedStatus === 'CLOSED' ? 'open' : 'close'} cash register session.`,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!submitting && !open) {
          onOpenChange(open);
        }
      }}
    >
      <DialogContent className="sm:max-w-[1300px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-xl font-semibold">Cash Register</DialogTitle>
          <DialogDescription>
            Manage your cash register session. Count and enter the cash denominations below.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto px-6">
          <div className="space-y-4 my-2 mx-2 flex flex-col items-center">
            {/* Cashier and Cash Register Row */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-3xl">
              {/* Cashier */}
              <div className="space-y-2">
                <div className="flex items-center h-5">
                  <Label>Cashier <span className="text-red-500">*</span></Label>
                </div>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : (() => {
                  const assignedUser = (selectedCashRegister as any)?.assignedUser || (selectedCashRegister as any)?.assigned_user;
                  const userInfo = assignedUser?.userInfo || assignedUser?.user_info;
                  
                  if (userInfo) {
                    return (
                      <div className="px-3 py-2 border rounded-md bg-muted/50">
                        <p className="text-sm font-medium">
                          {userInfo.first_name} {userInfo.last_name}
                        </p>
                      </div>
                    );
                  }
                  
                  if (selectedCashRegisterId) {
                    return (
                      <div className="px-3 py-2 border rounded-md bg-muted/50">
                        <p className="text-sm text-muted-foreground">No cashier assigned</p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="px-3 py-2 border rounded-md bg-muted/50">
                      <p className="text-sm text-muted-foreground">Select a cash register</p>
                    </div>
                  );
                })()}
              </div>

              {/* Cash Register */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3 h-5">
                  <Label>Cash Register <span className="text-red-500">*</span></Label>
                  <div className="inline-flex items-center gap-2">
                    <span className="relative h-2 w-2 shrink-0">
                      <span
                        className={cn(
                          "absolute inset-0 rounded-full",
                          selectedStatus === 'OPEN' ? "bg-emerald-500" : "bg-red-500"
                        )}
                      />
                      <span
                        className={cn(
                          "absolute inset-0 rounded-full animate-ping opacity-75",
                          selectedStatus === 'OPEN' ? "bg-emerald-500" : "bg-red-500"
                        )}
                      />
                    </span>
                    <span className={cn(
                      "text-xs font-semibold leading-none",
                      selectedStatus === 'OPEN' ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    )}>{selectedStatus}</span>
                  </div>
                </div>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading cash registers...</p>
                ) : (
                  <Select
                    value={selectedCashRegisterId}
                    onValueChange={setSelectedCashRegisterId}
                    disabled={submitting}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select cash register" />
                    </SelectTrigger>
                    <SelectContent>
                      {cashRegisters.map((register) => (
                        <SelectItem key={register.id} value={register.id.toString()}>
                          <div className="flex flex-col gap-1 w-full">
                            <div className="flex items-center justify-between gap-3">
                              <span className="truncate font-medium">{register.name}</span>
                              <span className="relative h-1.5 w-1.5 shrink-0">
                                <span
                                  className={cn(
                                    "absolute inset-0 rounded-full",
                                    register.open_session?.status === 'OPEN' 
                                      ? "bg-emerald-500" 
                                      : "bg-red-500"
                                  )}
                                />
                                <span
                                  className={cn(
                                    "absolute inset-0 rounded-full animate-ping opacity-75",
                                    register.open_session?.status === 'OPEN' 
                                      ? "bg-emerald-500" 
                                      : "bg-red-500"
                                  )}
                                />
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Closing Summary (expected vs counted) */}
            {selectedStatus === 'OPEN' && expectedBalances && (
              <div className="w-full max-w-5xl">
                <div className="rounded-md border bg-muted/30 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Expected Balance:</span>{' '}
                    <span className="font-semibold text-foreground">{formatMoney(expectedTotalBalance)}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Counted Balance:</span>{' '}
                    <span className="font-semibold text-foreground">{formatMoney(totalAmount + onlineTotal)}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Variance:</span>{' '}
                    <span className={cn(
                      "font-semibold",
                      ((totalAmount + onlineTotal) - expectedTotalBalance) < -0.01 ? "text-red-600 dark:text-red-400"
                        : ((totalAmount + onlineTotal) - expectedTotalBalance) > 0.01 ? "text-emerald-600 dark:text-emerald-400"
                        : "text-foreground"
                    )}>
                      {formatMoney((totalAmount + onlineTotal) - expectedTotalBalance)}
                    </span>
                  </div>
                  <div className={cn(
                    "text-xs font-semibold px-2 py-1 rounded-md w-fit",
                    closingCase === 'SHORTED' ? "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-300"
                      : closingCase === 'NO_SALE' ? "bg-slate-100 text-slate-700 dark:bg-slate-950/30 dark:text-slate-300"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                  )}>
                    {closingCase}
                  </div>
                </div>
              </div>
            )}

            {/* Online Balance (Non-cash Payments) */}
            <div className="w-full max-w-5xl">
              {/* Title divider: Online Balance */}
              <div className="flex items-center gap-4 mb-2">
                <div className="flex-1 border-t border-border" />
                <button
                  type="button"
                  onClick={() => setOnlineCollapsed((v) => !v)}
                  className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Online Balance = {formatMoney(onlineTotal)}
                  <ChevronDown className={cn("h-4 w-4 transition-transform", onlineCollapsed && "-rotate-180")} />
                </button>
                <div className="flex-1 border-t border-border" />
              </div>

              {!onlineCollapsed && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {onlinePaymentMethods.map((method) => {
                    const value = onlinePaymentAmounts[method.id] || '';
                    // Get expected balance for this payment method (opening + sales)
                    const expectedBalanceByMethod = expectedBalances?.expected_balances_by_method?.find(
                      (ebm) => ebm.payment_method_id === method.id
                    );
                    const expectedBalance = expectedBalanceByMethod?.expected_balance ?? 0;
                    const hasExpectedBalance = expectedBalance > 0;
                    
                    return (
                      <div
                        key={method.id}
                        className="rounded-md border bg-background px-3 py-2 flex flex-col gap-1 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-muted-foreground">{method.name}:</span>
                          <Input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            value={value}
                            onChange={(e) => {
                              setOnlinePaymentAmounts(prev => ({
                                ...prev,
                                [method.id]: e.target.value
                              }));
                            }}
                            placeholder="0.00"
                            disabled={submitting}
                            className="w-24 h-8 text-center text-sm font-bold tabular-nums px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        {selectedStatus === 'OPEN' && hasExpectedBalance && (
                          <div className="text-xs text-muted-foreground">
                            Expected: {formatMoney(expectedBalance)}
                            {expectedBalanceByMethod && (
                              <span className="ml-1">
                                ({formatMoney(expectedBalanceByMethod.opening_balance)} + {formatMoney(expectedBalanceByMethod.sales_amount)})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cash Payments (Bills and Coins) */}
            <div className="w-full max-w-5xl">
              {/* Title divider: Cash Balance */}
              <div className="flex items-center gap-4">
                <div className="flex-1 border-t border-border" />
                <button
                  type="button"
                  onClick={() => setCashCollapsed((v) => !v)}
                  className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Cash Balance = {formatMoney(totalAmount)}
                  <ChevronDown className={cn("h-4 w-4 transition-transform", cashCollapsed && "-rotate-180")} />
                </button>
                <div className="flex-1 border-t border-border" />
              </div>

              {!cashCollapsed && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                {/* Bills Column */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-muted-foreground">Bills</Label>
                  <div className="flex flex-wrap gap-3">
                    {BILLS.map((denom) => {
                      const count = billCounts[denom.key];
                      const colors = getHighlightColorClasses(denom.color, count);

                      const getTextColorDark = (colorName: string) => {
                        const colorMap: Record<string, string> = {
                          blue: 'text-blue-700 dark:text-blue-300',
                          yellow: 'text-yellow-700 dark:text-yellow-300',
                          green: 'text-green-700 dark:text-green-300',
                          violet: 'text-violet-700 dark:text-violet-300',
                          red: 'text-red-700 dark:text-red-300',
                          orange: 'text-orange-700 dark:text-orange-300',
                        };
                        return colorMap[colorName] || 'text-foreground';
                      };

                      return (
                        <div
                          key={denom.key}
                          className={cn(
                            "relative border-2 rounded-lg cursor-pointer transition-all hover:shadow-lg overflow-visible",
                            "w-[80px] h-[140px]", // Portrait orientation: height > width (like paper bills)
                            colors.border,
                            colors.bg,
                            colors.hoverBorder,
                            colors.hoverBg,
                            count > 0 && "shadow-md"
                          )}
                          onClick={() => updateBillCount(denom.key, 1)}
                        >
                          {count > 0 && (
                            <div className={cn("absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-md z-10", colors.badge)}>
                              {count}
                            </div>
                          )}

                          <div className="absolute top-2 left-2">
                            <span className={cn(
                              "text-xs font-bold",
                              getTextColorDark(denom.color)
                            )}>
                              {formatDenomination(denom.value)}
                            </span>
                          </div>

                          {/* Center Icon */}
                          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20">
                            <Banknote className={cn(
                              "h-14 w-14",
                              getTextColorDark(denom.color)
                            )} />
                          </div>

                          {/* Bottom Right - Denomination */}
                          <div className="absolute bottom-2 right-2">
                            <span className={cn(
                              "text-xs font-bold",
                              getTextColorDark(denom.color)
                            )}>
                              {formatDenomination(denom.value)}
                            </span>
                          </div>

                          {/* Controls on Right */}
                          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 bg-background/80 hover:bg-background"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateBillCount(denom.key, -1);
                              }}
                              disabled={count === 0 || submitting}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              inputMode="numeric"
                              min="0"
                              step="1"
                              value={billCountInputs[denom.key] ?? ''}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                setBillCountInput(denom.key, e.target.value);
                              }}
                              disabled={submitting}
                              className={cn(
                                "h-7 w-12 px-1 text-center text-xs font-bold tabular-nums bg-background/80 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                getTextColorDark(denom.color)
                              )}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 bg-background/80 hover:bg-background"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateBillCount(denom.key, 1);
                              }}
                              disabled={submitting}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Coins Column */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-muted-foreground">Coins</Label>
                  <div className="flex flex-wrap gap-3">
                    {COINS.map((denom) => {
                      const count = billCounts[denom.key];
                      const colors = getHighlightColorClasses(denom.color, count);
                      const getTextColorDark = (colorName: string) => {
                        const colorMap: Record<string, string> = {
                          'yellow-orange': 'text-amber-700 dark:text-amber-300',
                          'light-yellow': 'text-yellow-700 dark:text-yellow-300',
                          gold: 'text-amber-700 dark:text-amber-300',
                          silver: 'text-slate-700 dark:text-slate-300',
                          yellow: 'text-yellow-700 dark:text-yellow-300',
                          'brown-copper': 'text-amber-900 dark:text-amber-300',
                          'light-copper': 'text-orange-700 dark:text-orange-300',
                          'natural-copper': 'text-orange-800 dark:text-orange-300',
                        };
                        return colorMap[colorName] || 'text-foreground';
                      };
                      return (
                        <div
                          key={denom.key}
                          className={cn(
                            "relative border-2 rounded-lg cursor-pointer transition-all hover:shadow-lg overflow-visible",
                            "w-[80px] h-[140px]", // Portrait orientation: height > width (like paper bills)
                            colors.border,
                            colors.bg,
                            colors.hoverBorder,
                            colors.hoverBg,
                            count > 0 && "shadow-md"
                          )}
                          onClick={() => updateBillCount(denom.key, 1)}
                        >
                          {count > 0 && (
                            <div className={cn("absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-md z-10", colors.badge)}>
                              {count}
                            </div>
                          )}
                          <div className="absolute top-2 left-2">
                            <span className={cn(
                              "text-xs font-bold",
                              getTextColorDark(denom.color)
                            )}>
                              {formatDenomination(denom.value)}
                            </span>
                          </div>

                          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20">
                            <Coins className={cn(
                              "h-14 w-14",
                              getTextColorDark(denom.color)
                            )} />
                          </div>

                          <div className="absolute bottom-2 right-2">
                            <span className={cn(
                              "text-xs font-bold",
                              getTextColorDark(denom.color)
                            )}>
                              {formatDenomination(denom.value)}
                            </span>
                          </div>

                          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 bg-background/80 hover:bg-background"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateBillCount(denom.key, -1);
                              }}
                              disabled={count === 0 || submitting}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              inputMode="numeric"
                              min="0"
                              step="1"
                              value={billCountInputs[denom.key] ?? ''}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                setBillCountInput(denom.key, e.target.value);
                              }}
                              disabled={submitting}
                              className={cn(
                                "h-7 w-12 px-1 text-center text-sm font-bold tabular-nums bg-background/80 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                getTextColorDark(denom.color)
                              )}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 bg-background/80 hover:bg-background"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateBillCount(denom.key, 1);
                              }}
                              disabled={submitting}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

                  <div className="flex justify-center">
                <Button
                  type="button"
                  variant="default"
                  onClick={handleClear}
                  disabled={submitting || (totalAmount === 0 && Object.values(onlinePaymentAmounts).every(v => !v || parseFloat(v) === 0))}
                  className="min-w-[120px]"
                >
                  Clear
                </Button>
              </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <div className="w-full flex items-center justify-center gap-6">
            <DialogTitle className="text-md font-semibold">Balance = {formatMoney(displayBalance)}</DialogTitle>

            <Input
              id="code-input"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={
                selectedStatus === 'CLOSED'
                  ? (needsCodeForOpening ? "Code Required" : "Code (Optional)")
                  : (needsCodeForClosing ? "Code Required" : "Code (Optional)")
              }
              disabled={submitting}
              className="w-48"
            />

            <Button
              onClick={handleSubmit}
              disabled={!selectedCashRegisterId || totalAmount <= 0 || submitting}
              className="min-w-[120px]"
            >
              {submitting 
                ? (selectedStatus === 'CLOSED' ? 'Opening...' : 'Closing...')
                : (selectedStatus === 'CLOSED' ? 'Open' : 'Close')
              }
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={shortageConfirmOpen} onOpenChange={(open) => {
      if (!open) {
        setShortageConfirmOpen(false);
        setShortageConfirmData(null);
      }
    }}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Shortage Detected</DialogTitle>
          <DialogDescription>
            {shortageConfirmData
              ? `The expected SALES is ${formatMoney(shortageConfirmData.expected)} you audited ${formatMoney(shortageConfirmData.counted)} only you are SHORT by ${formatMoney(shortageConfirmData.shortBy)}. This action can't be undone once proceed.`
              : 'This action can’t be undone.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShortageConfirmOpen(false);
              setShortageConfirmData(null);
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={async () => {
              if (!selectedCashRegister) return;
              const sessionId = selectedCashRegister.open_session?.id;
              if (!sessionId) return;

              setShortageConfirmOpen(false);
              setShortageConfirmData(null);
              setSubmitting(true);
              try {
                const closingBills: Record<string, number> = {};
                Object.entries(billCounts).forEach(([key, count]) => {
                  if (count > 0) closingBills[key] = count;
                });
                const closingOnlinePayments = Object.entries(onlinePaymentAmounts)
                  .map(([paymentMethodId, amountStr]) => {
                    const amount = parseFloat(amountStr || '0');
                    return {
                      payment_method_id: Number(paymentMethodId),
                      amount: Number.isFinite(amount) ? Number(amount.toFixed(2)) : 0,
                    };
                  })
                  .filter((row) => row.amount > 0);

                const closePayload: any = {
                  counted_closing_balance: totalAmount,
                  code: code && code.trim() ? code.trim() : null,
                  closing_bills: Object.keys(closingBills).length > 0 ? closingBills : undefined,
                  closing_online_payments: closingOnlinePayments.length > 0 ? closingOnlinePayments : undefined,
                };

                await closeSession(sessionId, closePayload);

                setShortageConfirmOpen(false);
                setShortageConfirmData(null);
                setSubmitting(false);
                setCloseSuccessDialogOpen(true);
                onOpenChange(false);
              } catch (error: any) {
                toast({
                  title: "Error",
                  description: error?.response?.data?.message || 'Failed to close cash register session.',
                  variant: "destructive"
                });
              } finally {
                setSubmitting(false);
              }
            }}
          >
            Proceed Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog open={closeSuccessDialogOpen} onOpenChange={setCloseSuccessDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cash Register Closed</AlertDialogTitle>
          <AlertDialogDescription>
            Thank you. The cash register has been successfully closed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={() => {
              setCloseSuccessDialogOpen(false);
              router.push('/dashboard');
            }}
          >
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
