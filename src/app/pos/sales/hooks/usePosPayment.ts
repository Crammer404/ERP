import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/hooks/use-toast";
import { tenantContextService } from "@/services/tenant/tenantContextService";
import { monitorProducts } from "@/lib/stockMonitor";
import { productService } from "@/services/product/productService";

import { postTransaction } from "../services/salesService";
import { invalidateProductsCache } from "./useProducts";
import { invalidateTaxesCache } from "./useTaxes";
import { invalidateCategoriesCache } from "./useCategories";
import { invalidatePaymentMethodsCache, usePaymentMethods } from "./usePaymentMethods";
import { invalidateTransactionsCache } from "../../transactions/hooks/useTransactions";
import { invalidateDiscountsCache } from "../../../inventory/discounts/hooks/useDiscounts";
import { invalidateActivityLogsCache } from "../../../settings/activity-logs/hooks/useActivityLogs";
import { invalidateFloatingOrdersCache } from "./useFloatingOrders";

type PaymentConfirmArgs = {
  payments: Array<{ paymentMethodId: number; amount: number; notes?: string }>;
  orderType: "dine_in" | "take_out";
  customerId?: number;
  cashEntered?: number;
};

type UsePosPaymentArgs = {
  user: any;
  items: any[];
  subtotal: number;
  totalDiscount: number;
  taxAmount: number;
  grandTotal: number;
  taxes: any[];
  billingOutFloatingOrderId: number | null;
  setBillingOutFloatingOrderId: (id: number | null) => void;
  currentFloatingOrderId: number | null;
  setCurrentFloatingOrderId: (id: number | null) => void;
  setPreselectedCustomerId: (id: number | null) => void;
  setLinkedOrderInfo: (info: any) => void;
  clearCart: () => void;
  refreshFloatingOrders: () => void;
  setIsProcessingPayment: (value: boolean) => void;
  setIsPaymentModalOpen: (value: boolean) => void;
  currentSession: any | null;
};

export function usePosPayment({
  user,
  items,
  subtotal,
  totalDiscount,
  taxAmount,
  grandTotal,
  taxes,
  billingOutFloatingOrderId,
  setBillingOutFloatingOrderId,
  currentFloatingOrderId,
  setCurrentFloatingOrderId,
  setPreselectedCustomerId,
  setLinkedOrderInfo,
  clearCart,
  refreshFloatingOrders,
  setIsProcessingPayment,
  setIsPaymentModalOpen,
  currentSession,
}: UsePosPaymentArgs) {
  const router = useRouter();
  const { toast } = useToast();
  const { paymentMethods } = usePaymentMethods();

  const handleCompletePurchaseClick = useCallback(() => {
    if (items.length === 0) return;
    if (!currentFloatingOrderId) {
      setPreselectedCustomerId(null);
    }
    setIsPaymentModalOpen(true);
  }, [items.length, currentFloatingOrderId, setPreselectedCustomerId, setIsPaymentModalOpen]);

  const handlePaymentConfirm = useCallback(
    async ({ payments, orderType, customerId, cashEntered }: PaymentConfirmArgs) => {
      setIsProcessingPayment(true);

      if (!user) {
        setIsProcessingPayment(false);
        return;
      }

      const branchContext = tenantContextService.getStoredBranchContext();

      const isCashPaymentMethod = (paymentMethodId: number): boolean => {
        const method = paymentMethods.find(pm => pm.id === paymentMethodId);
        return method?.slug?.toLowerCase() === 'cash';
      };

      const cashPayments = payments.filter(p => isCashPaymentMethod(p.paymentMethodId));
      const nonCashPayments = payments.filter(p => !isCashPaymentMethod(p.paymentMethodId));

      const nonCashTotal = nonCashPayments.reduce((sum, p) => sum + p.amount, 0);
      const cashTotalInPayments = cashPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalPaidAmount = nonCashTotal + cashTotalInPayments;
      const primaryPaymentMethodId = payments[0].paymentMethodId;

      let calculatedChange = 0;
      if (cashEntered && cashEntered > 0 && cashPayments.length > 0) {
        const cashPaymentAmount = cashTotalInPayments;
        calculatedChange = Math.max(0, cashEntered - cashPaymentAmount);
      } else {
        calculatedChange = Math.max(0, totalPaidAmount - grandTotal);
      }

      const payload: any = {
        created_by: Number(user.id),
        payment_method_id: primaryPaymentMethodId,
        is_dine_in: orderType === "dine_in",
        status: "completed",
        paid_amount: Math.round(totalPaidAmount * 100) / 100,
        sub_total: Math.round(subtotal * 100) / 100,
        grand_total: Math.round(grandTotal * 100) / 100,
        total_discount: Math.round(totalDiscount * 100) / 100,
        total_tax: Math.round(taxAmount * 100) / 100,
        change: Math.round(calculatedChange * 100) / 100,
        due_amount: Math.round(Math.max(0, grandTotal - totalPaidAmount) * 100) / 100,
        customer_id: customerId,
        branch_id: branchContext?.id,
        payments: payments.map((p) => ({
          payment_method_id: p.paymentMethodId,
          amount: Math.round(p.amount * 100) / 100,
          notes: p.notes || null,
        })),
        order_items: (() => {
          const itemMap = new Map<string, { stock_id: number; quantity: number; discounts: number[] }>();
          
          items.forEach((item) => {
            const stockId = item.id;
            const discounts = (item.stockDiscountIds || []) as number[];
            const normalizedDiscounts = discounts
              .map((d: any) => (typeof d === 'number' ? d : d?.id ?? d))
              .filter((d: any) => d != null)
              .sort((a: number, b: number) => a - b);
            
            const key = `${stockId}:${normalizedDiscounts.join(',')}`;
            
            const existing = itemMap.get(key);
            if (existing) {
              existing.quantity += item.quantity;
            } else {
              const orderItem: any = {
                stock_id: stockId,
                quantity: item.quantity,
              };
              if (normalizedDiscounts.length > 0) {
                orderItem.discounts = normalizedDiscounts;
              }
              itemMap.set(key, orderItem);
            }
          });
          
          return Array.from(itemMap.values());
        })(),
        taxes: taxes.filter((t) => t.isActive).map((t) => t.id),
      };

      if (currentSession) {
        payload.cash_register_id = currentSession.cash_register_id;
        payload.cash_register_session_id = currentSession.id;
      }

      if (billingOutFloatingOrderId) {
        payload.floating_order_id = billingOutFloatingOrderId;
      } else if (currentFloatingOrderId) {
        payload.floating_order_id = currentFloatingOrderId;
      }

      try {
        const res = await postTransaction(payload);

        sessionStorage.setItem("viewReceiptTransactionId", res.data.id.toString());
        sessionStorage.setItem("receiptSource", "other");

        invalidateTransactionsCache();
        invalidateProductsCache();
        invalidateCategoriesCache();
        invalidateTaxesCache();
        invalidatePaymentMethodsCache();
        invalidateDiscountsCache();
        invalidateActivityLogsCache();

        try {
          const { data: updatedProducts } = await productService.getAll({ per_page: 10000 });
          monitorProducts(updatedProducts);
        } catch (error) {
          console.error("Failed to monitor stock changes after transaction:", error);
        }

        window.dispatchEvent(new CustomEvent("stockUpdated"));

        toast({
          title: "Payment Successful",
          description: "Order has been completed successfully.",
          variant: "success",
        });

        if (billingOutFloatingOrderId || currentFloatingOrderId) {
          invalidateFloatingOrdersCache();
          await refreshFloatingOrders();
          if (billingOutFloatingOrderId) {
          setBillingOutFloatingOrderId(null);
          }
        }

        router.push("/order-success");
        clearCart();
        setCurrentFloatingOrderId(null);
        setPreselectedCustomerId(null);
        setLinkedOrderInfo(null);
      } catch (err: any) {
        console.error("Failed to post transaction", err);
        console.error("Backend validation errors:", err.response?.data);
        toast({
          title: "Payment Failed",
          description: err.response?.data?.message || "Failed to process payment. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsProcessingPayment(false);
        if (billingOutFloatingOrderId) {
          setBillingOutFloatingOrderId(null);
        }
      }
    },
    [
      user,
      items,
      subtotal,
      totalDiscount,
      taxAmount,
      grandTotal,
      taxes,
      billingOutFloatingOrderId,
      currentFloatingOrderId,
      setBillingOutFloatingOrderId,
      clearCart,
      setCurrentFloatingOrderId,
      setPreselectedCustomerId,
      setLinkedOrderInfo,
      setIsProcessingPayment,
      refreshFloatingOrders,
      toast,
      router,
      paymentMethods,
      currentSession,
    ]
  );

  return { handleCompletePurchaseClick, handlePaymentConfirm };
}

