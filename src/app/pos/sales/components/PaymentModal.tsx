"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { usePaymentMethods } from "../hooks/usePaymentMethods";
import { useCustomers as usePosCustomers } from "../hooks/useCustomers";
import { useCurrency } from "@/contexts/CurrencyContext";
import { CustomerFormModal } from "@/app/customers/components/CustomerFormModal";
import { useCustomerForm } from "@/app/customers/hooks/useCustomerForm";
import { useCustomers as useCustomersFull } from "@/app/customers/hooks/useCustomers";
import { Plus, Trash2 } from "lucide-react";

type PaymentRow = {
  id: string;
  paymentMethodId: number | null;
  amount: string;
  notes?: string;
};

type PaymentModalProps = {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   grandTotal: number;
   processing?: boolean;
   onConfirm: (data: {
     payments: Array<{paymentMethodId: number, amount: number, notes?: string}>;
     orderType: "dine_in" | "take_out";
     customerId?: number;
     cashEntered?: number;
   }) => void;
   preselectedCustomerId?: number | null; // Customer ID from floating order to auto-select
 };

export default function PaymentModal({
  open,
  onOpenChange,
  grandTotal,
  processing = false,
  onConfirm,
  preselectedCustomerId = null,
}: PaymentModalProps) {
  const { paymentMethods, loading } = usePaymentMethods();
  const { customers, loading: customersLoading, refetch } = usePosCustomers();
  const { defaultCurrency } = useCurrency();
  const { handleCreate } = useCustomersFull();
  const [addCustomerModalOpen, setAddCustomerModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const { formData, errors, setErrors, resetForm, handleInputChange, handleAddressUpdate, validateForm, prepareSubmitData } = useCustomerForm();
  const [payments, setPayments] = useState<PaymentRow[]>([{ id: '1', paymentMethodId: null, amount: '', notes: '' }]);
  const [orderType, setOrderType] = useState<"dine_in" | "take_out">("dine_in");
  const [isLoyalCustomer, setIsLoyalCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [newlyCreatedCustomerId, setNewlyCreatedCustomerId] = useState<number | null>(null);

  // Helper function to check if a payment method is cash
  const isCashPayment = (paymentMethodId: number | null): boolean => {
    if (!paymentMethodId) return false;
    const method = paymentMethods.find(pm => pm.id === paymentMethodId);
    return method?.slug?.toLowerCase() === 'cash';
  };

  // Calculate non-cash payments total (exact amounts)
  const nonCashTotal = payments.reduce((sum, payment) => {
    if (payment.paymentMethodId && !isCashPayment(payment.paymentMethodId)) {
      return sum + (parseFloat(payment.amount) || 0);
    }
    return sum;
  }, 0);

  // Calculate cash payments total (entered amounts)
  const cashEnteredTotal = payments.reduce((sum, payment) => {
    if (payment.paymentMethodId && isCashPayment(payment.paymentMethodId)) {
      return sum + (parseFloat(payment.amount) || 0);
    }
    return sum;
  }, 0);

  // Calculate cash needed (grandTotal - nonCashTotal)
  const cashNeeded = Math.max(0, grandTotal - nonCashTotal);

  // Calculate total paid (non-cash exact + cash entered)
  const totalPaid = nonCashTotal + cashEnteredTotal;

  // Calculate change (only from cash, if cash entered > cash needed)
  const change = Math.max(0, cashEnteredTotal - cashNeeded);

  // Convert to cents for accurate currency comparison (avoid floating-point precision issues)
  const totalPaidCents = Math.round(totalPaid * 100);
  const grandTotalCents = Math.round(grandTotal * 100);
  const isPaymentValid = totalPaidCents >= grandTotalCents && payments.every(p => p.paymentMethodId !== null && parseFloat(p.amount) > 0);

  // Pre-select first payment method when modal opens and methods are loaded
  useEffect(() => {
    if (open && !loading && paymentMethods.length > 0) {
      // Initialize first payment with first method if not set
      setPayments(prev => {
        if (prev.length === 0 || prev[0].paymentMethodId === null) {
          return [{ id: '1', paymentMethodId: paymentMethods[0].id, amount: '', notes: '' }];
        }
        return prev;
      });
    } else if (!open) {
      // Reset when modal closes
      setPayments([{ id: '1', paymentMethodId: null, amount: '', notes: '' }]);
      setSelectedCustomer(null);
      setIsLoyalCustomer(false);
      setAddCustomerModalOpen(false);
      setFormLoading(false);
      setNewlyCreatedCustomerId(null);
    }
  }, [open, loading, paymentMethods]);

  // Auto-select customer from floating order when modal opens
  useEffect(() => {
    if (open && preselectedCustomerId && !customersLoading && customers.length > 0) {
      const customerExists = customers.some(customer => customer.id === preselectedCustomerId);
      if (customerExists) {
        // Auto-check Loyal Customer checkbox
        setIsLoyalCustomer(true);
        // Use setTimeout to ensure Select component has the option available
        setTimeout(() => {
          setSelectedCustomer(preselectedCustomerId);
          setCustomerError(null);
        }, 50);
      } else {
        // Customer doesn't exist in the list, show error
        console.warn('Preselected customer not found in customers list:', preselectedCustomerId);
        setCustomerError('Customer from floating order not found. Please select a customer.');
      }
    }
  }, [open, preselectedCustomerId, customers, customersLoading]);

  // Automatically select newly created customer
  useEffect(() => {
    if (newlyCreatedCustomerId !== null && !customersLoading && customers.length > 0) {
      const customerExists = customers.some(customer => customer.id === newlyCreatedCustomerId);
      if (customerExists) {
        // Ensure Loyal Customer checkbox is checked
          setIsLoyalCustomer(true);
        // Use setTimeout to ensure Select component has the new option available and re-rendered
        setTimeout(() => {
          setSelectedCustomer(newlyCreatedCustomerId);
          setCustomerError(null);
          setNewlyCreatedCustomerId(null); // Reset after setting
        }, 100);
      }
    }
  }, [newlyCreatedCustomerId, customers, customersLoading]);

  const onCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setFormLoading(false);
      return;
    }

    const submitData = prepareSubmitData(false);

    try {
      const response = await handleCreate(submitData);
      // Get the newly created customer ID from the response
      const newCustomerId = response?.customer?.id;
      setAddCustomerModalOpen(false);
      resetForm();
      
      // Refresh the POS customers list and wait for it to complete
      await refetch();
      
      // Set the newly created customer ID - the useEffect will handle selection
      // after the customers list is updated
      if (newCustomerId) {
          setNewlyCreatedCustomerId(newCustomerId);
      }
    } catch (apiErrors: any) {
      setErrors(apiErrors);
    } finally {
      setFormLoading(false);
    }
  };

  const addPaymentRow = () => {
    setPayments(prev => [...prev, { 
      id: Date.now().toString(), 
      paymentMethodId: null, 
      amount: '', 
      notes: '' 
    }]);
  };

  const removePaymentRow = (id: string) => {
    if (payments.length > 1) {
      setPayments(prev => prev.filter(p => p.id !== id));
    }
  };

  const updatePayment = (id: string, field: keyof PaymentRow, value: string | number | null) => {
    setPayments(prev => prev.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const handleConfirm = () => {
    // Validate all payments have method and amount
    const hasInvalidPayments = payments.some(p => !p.paymentMethodId || !parseFloat(p.amount) || parseFloat(p.amount) <= 0);
    if (hasInvalidPayments || !isPaymentValid) return;

    if (isLoyalCustomer && !selectedCustomer) {
      setCustomerError("Customer is required.");
      return;
    } else {
      setCustomerError(null);
    }

    // Prepare payments with adjusted cash amounts
    const adjustedPayments = payments.map(p => {
      const amount = parseFloat(p.amount) || 0;
      
      // If this is a cash payment and there are non-cash payments, adjust the amount
      if (isCashPayment(p.paymentMethodId) && nonCashTotal > 0) {
        // Cash payment should only be the amount needed (grandTotal - nonCashTotal)
        const adjustedCashAmount = Math.max(0, grandTotal - nonCashTotal);
        return {
          paymentMethodId: p.paymentMethodId!,
          amount: adjustedCashAmount,
          notes: p.notes || undefined,
        };
      }
      
      // Non-cash payments: send exact amount
      return {
        paymentMethodId: p.paymentMethodId!,
        amount: amount,
        notes: p.notes || undefined,
      };
    });

    console.log("Selected customer:", selectedCustomer);
    onConfirm({
      payments: adjustedPayments,
      orderType,
      customerId: selectedCustomer || undefined,
      cashEntered: cashEnteredTotal > 0 ? cashEnteredTotal : undefined
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Order</DialogTitle>
        </DialogHeader>

        {/* Customer Selection */}
        <div className="space-y-2">
          <Label>Customer Type</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="loyal-customer"
              checked={isLoyalCustomer}
              onCheckedChange={(checked) => {
                setIsLoyalCustomer(checked as boolean);
                if (!checked) {
                  setSelectedCustomer(null);
                  setCustomerError(null);
                }
              }}
            />
            <Label htmlFor="loyal-customer">Loyal Customer</Label>
          </div>
          {isLoyalCustomer && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Customer <span className="text-red-500">*</span></Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    resetForm();
                    setAddCustomerModalOpen(true);
                  }}
                >
                  Add Customer
                </Button>
              </div>
              {customersLoading ? (
                <p className="text-sm text-muted-foreground">Loading customers...</p>
              ) : (
                <>
                  <Select 
                    key={`customer-select-${customers.length}-${selectedCustomer}-${newlyCreatedCustomerId}`}
                    value={selectedCustomer?.toString() || ""} 
                    onValueChange={(value) => {
                      setSelectedCustomer(parseInt(value));
                      setCustomerError(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.first_name} {customer.last_name}{customer.email ? ` (${customer.email})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {customerError && <p className="text-sm text-red-500">{customerError}</p>}
                </>
              )}
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Payment Methods <span className="text-red-500">*</span></Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPaymentRow}
              className="h-8"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Payment
            </Button>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment, index) => (
                <div key={payment.id} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Payment {index + 1}</Label>
                    {payments.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePaymentRow(payment.id)}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Select
                      value={payment.paymentMethodId?.toString() || ""}
                      onValueChange={(value) => updatePayment(payment.id, 'paymentMethodId', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((pm) => (
                          <SelectItem key={pm.id} value={pm.id.toString()}>
                            {pm.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={payment.amount}
                      onChange={(e) => updatePayment(payment.id, 'amount', e.target.value)}
                      placeholder="Amount"
                      step="0.01"
                      min="0"
                    />
                    <Input
                      type="text"
                      value={payment.notes || ''}
                      onChange={(e) => updatePayment(payment.id, 'notes', e.target.value)}
                      placeholder="Notes (optional)"
                      maxLength={500}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Type */}
        <div className="space-y-2">
          <Label>Order Type <span className="text-red-500">*</span></Label>
          <div className="flex gap-2">
            {(["dine_in", "take_out"] as const).map((type) => (
              <Button
                key={type}
                variant="outline"
                onClick={() => setOrderType(type)}
                className={cn(
                  "flex-1 border-2 capitalize",
                  orderType === type ? "border-primary" : "border-input"
                )}
              >
                {type.replace("_", " ")}
              </Button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-1 text-right border-t pt-2">
          <p className="text-muted-foreground">Total: {defaultCurrency?.symbol || '₱'}{grandTotal.toFixed(2)}</p>
          {nonCashTotal > 0 && cashEnteredTotal > 0 && (
            <>
              <p className="text-muted-foreground text-sm">Non-Cash: {defaultCurrency?.symbol || '₱'}{nonCashTotal.toFixed(2)}</p>
              <p className="text-muted-foreground text-sm">Cash Needed: {defaultCurrency?.symbol || '₱'}{cashNeeded.toFixed(2)}</p>
              <p className="text-muted-foreground text-sm">Cash Entered: {defaultCurrency?.symbol || '₱'}{cashEnteredTotal.toFixed(2)}</p>
            </>
          )}
          <p className="text-muted-foreground">Paid: {defaultCurrency?.symbol || '₱'}{totalPaid.toFixed(2)}</p>
          <p className={cn(
            "font-semibold",
            totalPaidCents < grandTotalCents ? "text-destructive" : "text-foreground"
          )}>
            {totalPaidCents < grandTotalCents 
              ? `Remaining: ${defaultCurrency?.symbol || '₱'}${(grandTotal - totalPaid).toFixed(2)}`
              : change > 0 && cashEnteredTotal > 0
                ? `Change: ${defaultCurrency?.symbol || '₱'}${change.toFixed(2)}`
                : totalPaidCents > grandTotalCents
                  ? `Change: ${defaultCurrency?.symbol || '₱'}${(totalPaid - grandTotal).toFixed(2)}`
                  : null
            }
          </p>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" disabled={processing}>Cancel</Button>
          </DialogClose>
          <Button
            onClick={handleConfirm}
            disabled={!isPaymentValid || processing}>
            {processing ? "Processing..." : "Confirm Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>

      <CustomerFormModal
        isOpen={addCustomerModalOpen}
        onOpenChange={setAddCustomerModalOpen}
        isEdit={false}
        formData={formData}
        onInputChange={handleInputChange}
        onAddressUpdate={handleAddressUpdate}
        errors={errors}
        isLoading={formLoading}
        onSubmit={onCreateCustomer}
      />
    </Dialog>
  );
}
