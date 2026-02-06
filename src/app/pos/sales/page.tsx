'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import type { Product as CartProduct, Transaction, DiscountType } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCart } from '@/hooks/use-cart';
import { Search, X, CreditCard, Clock, User, Lock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import useLocalStorage from '@/hooks/use-local-storage';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/components/providers/auth-provider';
import { Loader } from '@/components/ui/loader';
import { cn } from '@/lib/utils';

import { useProducts, type Product as PosProduct } from './hooks/useProducts';
import { useTaxes } from './hooks/useTaxes';
import { useCategories } from './hooks/useCategories';
import { usePaymentMethods } from './hooks/usePaymentMethods';
import { useToast } from '@/hooks/use-toast';
import { tenantContextService } from '@/services/tenant/tenantContextService';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { PaginationInfo } from '@/components/ui/pagination-info';

import AddOrderDialog from "./components/AddOrderDialog";
import CartItemList from "./components/CartItemList";
import CartSummary from "./components/CartSummary";
import PaymentModal from "./components/PaymentModal";
import ProductCard from "./components/ProductCard";
import CategoryFilter from "./components/CategoryFilter";
import FloatingOrdersPanel from "./components/FloatingOrdersPanel";
import CreateFloatingOrderDialog from "./components/CreateFloatingOrderDialog";
import { CashRegisterOpeningModal } from "./components/CashRegisterOpeningModal";
import { useFloatingOrders } from "./hooks/useFloatingOrders";
import { updateFloatingOrder, getFloatingOrder, type FloatingOrder } from "./services/floatingOrderService";
import { usePosPayment } from "./hooks/usePosPayment";
import { getCurrentSession, type CashRegisterSession } from '@/app/pos/counters/service/cashRegisterService';

export default function PosPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10;
  const { items, addItem, addItems, replaceItems, removeItem, updateItemQuantity, clearCart, cartTotal, totalDiscount } = useCart();
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
  const { products, loading, error } = useProducts();
  const { categories } = useCategories();
  const { user } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<PosProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { taxes } = useTaxes();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { toast } = useToast();
  const {
    floatingOrders,
    loading: floatingOrdersLoading,
    error: floatingOrdersError,
    createOrder: createFloatingOrder,
    addItem: addItemToFloatingOrder,
    removeItem: removeItemFromFloatingOrder,
    addTaxes,
    billOut: billOutFloatingOrder,
    cancelOrder: cancelFloatingOrder,
    refresh: refreshFloatingOrders,
  } = useFloatingOrders();
  const [isFloatingOrdersPanelOpen, setIsFloatingOrdersPanelOpen] = useState(false);
  const [currentFloatingOrderId, setCurrentFloatingOrderId] = useLocalStorage<number | null>('current_floating_order_id', null);
  const [billingOutFloatingOrderId, setBillingOutFloatingOrderId] = useState<number | null>(null);
  const [isCreateFloatingOrderModalOpen, setIsCreateFloatingOrderModalOpen] = useState(false);
  const [isCancelFloatingOrderModalOpen, setIsCancelFloatingOrderModalOpen] = useState(false);
  const [isLoadingFloatingOrder, setIsLoadingFloatingOrder] = useState(false);
  const [loadingOrderId, setLoadingOrderId] = useState<number | null>(null);
  const [preselectedCustomerId, setPreselectedCustomerId] = useLocalStorage<number | null>('preselected_customer_id', null);
  const [linkedOrderInfo, setLinkedOrderInfo] = useLocalStorage<FloatingOrder | null>('linked_order_info', null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [hasOpenSession, setHasOpenSession] = useState<boolean | null>(null); // null = checking, true = has session, false = no session
  const [isCashRegisterModalOpen, setIsCashRegisterModalOpen] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [currentSession, setCurrentSession] = useState<CashRegisterSession | null>(null);
  const [sessionTimer, setSessionTimer] = useState<string>('0:00:00');
  const [isSessionOpening, setIsSessionOpening] = useState(false);
  const sessionJustOpenedRef = useRef(false);
  const statusUpdateInProgressRef = useRef<number | null>(null); // Track which order is having status updated

  const activeFloatingOrdersCount = useMemo(() => {
    return floatingOrders.filter(order => order.status === 'active' || order.status === 'in-progress').length;
  }, [floatingOrders]);

  const subtotal = cartTotal + totalDiscount;

  const totalTaxPercentage = useMemo(() => {
    return taxes.reduce((acc, t) => acc + (t.isActive ? t.percentage : 0), 0);
  }, [taxes]);

  const taxAmount = useMemo(() => {
    return (subtotal - totalDiscount) * (totalTaxPercentage / 100);
  }, [subtotal, totalDiscount, totalTaxPercentage]);

  const grandTotal = useMemo(() => {
    return cartTotal + taxAmount;
  }, [cartTotal, taxAmount]);

  const { handleCompletePurchaseClick: runCompletePurchase, handlePaymentConfirm } = usePosPayment({
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
  });

  const handleCancelClick = () => {
    if (currentFloatingOrderId) {
      setIsCancelFloatingOrderModalOpen(true);
    } else {
      clearCart();
      setCurrentFloatingOrderId(null);
      setLinkedOrderInfo(null);
      setPreselectedCustomerId(null);
      statusUpdateInProgressRef.current = null; // Clear status update tracking
    }
  };

  const handleCancelFloatingOrderConfirm = async () => {
    if (!currentFloatingOrderId) {
      clearCart();
      return;
    }

    try {
      await cancelFloatingOrder(currentFloatingOrderId);
      setCurrentFloatingOrderId(null);
      setLinkedOrderInfo(null);
      statusUpdateInProgressRef.current = null; // Clear status update tracking
      refreshFloatingOrders();
      clearCart();
      toast({
        title: "Order Cancelled",
        description: "The floating order has been cancelled successfully.",
        variant: "success",
      });
    } catch (error: any) {
      console.error('Failed to cancel floating order:', error);
      toast({
        title: "Failed to Cancel Order",
        description: error.message || "Failed to cancel order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCancelFloatingOrderModalOpen(false);
    }
  };


  const handleAddOrder = async () => {
    if (!user || items.length === 0) {
      toast({
        title: "No Items",
        description: "Please add items to cart before adding the order.",
        variant: "destructive",
      });
      return;
    }

    if (currentFloatingOrderId) {
      try {
        const response = await getFloatingOrder(currentFloatingOrderId);
        const existingOrder = response.data;

        if (existingOrder && (existingOrder.status === 'active' || existingOrder.status === 'in-progress')) {
          const existingMap = new Map<string, number>();
          if (existingOrder.order_items) {
            existingOrder.order_items.forEach((orderItem: any) => {
              const stockId = orderItem.stock?.id ?? orderItem.stock_id ?? 0;
              const discounts = ((orderItem.discounts || []) as any[])
                .map((d: any) => {
                  if (typeof d === 'number') return d;
                  if (d?.discount?.id) return d.discount.id;
                  if (d?.id) return d.id;
                  return null;
                })
                .filter((d: any) => d != null)
                .sort((a: number, b: number) => a - b);

              const key = `${stockId}:${discounts.join(',')}`;
              const qty = Number(orderItem.quantity ?? 0);
              existingMap.set(key, (existingMap.get(key) || 0) + qty);
            });
          }

          const cartMap = new Map<string, { stockId: number; discounts: number[]; totalQty: number }>();
          
          items.forEach((cartItem) => {
            const stockId = cartItem.id ?? 0;
            const discounts = ((cartItem as any).stockDiscountIds || []) as any[];
            const normalizedDiscounts = discounts
              .map((d: any) => (typeof d === 'number' ? d : d?.id ?? d))
              .filter((d: any) => d != null)
              .sort((a: number, b: number) => a - b);

            const key = `${stockId}:${normalizedDiscounts.join(',')}`;
            const cartQty = Number(cartItem.quantity ?? 0);
            
            const existing = cartMap.get(key);
            if (existing) {
              existing.totalQty += cartQty;
            } else {
              cartMap.set(key, {
                stockId,
                discounts: normalizedDiscounts,
                totalQty: cartQty,
              });
            }
          });

          let anyAdded = false;

          for (const [key, cartData] of cartMap.entries()) {
            const existingQty = existingMap.get(key) || 0;
            const cartTotalQty = cartData.totalQty;
            const deltaQty = cartTotalQty - existingQty;

            if (deltaQty > 0) {
              const payload = {
                stock_id: cartData.stockId,
                quantity: deltaQty,
                ...(cartData.discounts.length > 0 && { discounts: cartData.discounts }),
              };
              console.log('Adding diff item to floating order:', payload, {
                key,
                existingQty,
                cartTotalQty,
                deltaQty,
              });
              await addItemToFloatingOrder(currentFloatingOrderId, payload);
              anyAdded = true;
            }
          }

          const activeTaxIds = taxes.filter((t) => t.isActive).map((t) => t.id);
          if (activeTaxIds.length > 0) {
            await addTaxes(currentFloatingOrderId, activeTaxIds);
          }

          // Update status to 'in-progress' when items are added to floating order
          // This ensures the order shows in the floating orders panel
          try {
            await updateFloatingOrder(currentFloatingOrderId, { status: 'in-progress' });
            setLinkedOrderInfo(prev => prev ? { ...prev, status: 'in-progress' as const } : null);
          } catch (error) {
            console.error('Failed to update floating order status to in-progress:', error);
          }

          await refreshFloatingOrders();

          const order = floatingOrders.find(o => o.id === currentFloatingOrderId) || existingOrder;
          const referenceNo = order?.reference_no || `#${currentFloatingOrderId}`;

          if (!anyAdded) {
            clearCart();
            toast({
              title: "No Changes Detected",
              description: `This floating order already matches the cart. The cart has been cleared.`,
              variant: "success",
            });
          } else {
            clearCart();
            toast({
              title: "Order Updated",
              description: `Items from the cart have been applied to floating order ${referenceNo}. The cart has been cleared.`,
              variant: "success",
            });
          }

          return;
        } else {
          console.warn('Floating order no longer exists or is not active/in-progress, clearing link');
          setCurrentFloatingOrderId(null);
        }
      } catch (error: any) {
        console.error('Error adding items to existing floating order:', error);
        const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
        
        if (errorMessage?.includes('not found') || errorMessage?.includes('not active') || errorMessage?.includes('not in-progress')) {
          console.warn('Floating order is invalid, clearing link');
          setCurrentFloatingOrderId(null);
        } else {
          toast({
            title: "Failed to Add Order",
            description: errorMessage || "Failed to add items to existing order. Please try again.",
            variant: "destructive",
          });
          return;
        }
      }
    }

    setIsCreateFloatingOrderModalOpen(true);
  };

  const handleCreateFloatingOrderAndAddItems = async (data: {
    table_number: string;
    customer_id?: number;
    notes?: string;
  }) => {
    if (!user) return;

    const branchContext = tenantContextService.getStoredBranchContext();
    try {
      const response = await createFloatingOrder({
        branch_id: branchContext?.id,
        created_by: Number(user.id),
        table_number: data.table_number,
        customer_id: data.customer_id,
        notes: data.notes,
      });

      if (!response || !response.data || !response.data.id) {
        throw new Error('Failed to create floating order: Invalid response');
      }

      const floatingOrder = response.data;
      const floatingOrderId = floatingOrder.id;
      setCurrentFloatingOrderId(floatingOrderId);

      const isExistingOrder = response.existing === true;

      if (isExistingOrder) {
        console.log('Using existing floating order for table', data.table_number, ':', floatingOrder.reference_no);
        toast({
          title: "Order Consolidated",
          description: `Items will be added to existing order ${floatingOrder.reference_no} for Table ${data.table_number}.`,
          variant: "success",
        });
      } else {
        console.log('Created new floating order:', floatingOrder);
      }

      await addItemsToFloatingOrder(floatingOrderId);
      await refreshFloatingOrders();
    } catch (error: any) {
      console.error('Failed to create floating order:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to create floating order. Please try again.";
      toast({
        title: "Failed to Create Order",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const addItemsToFloatingOrder = async (floatingOrderId: number) => {
    try {
      for (const item of items) {
        try {
          const payload = {
            stock_id: item.id,
            quantity: item.quantity,
            ...(item.stockDiscountIds && item.stockDiscountIds.length > 0 && { discounts: item.stockDiscountIds }),
          };
          console.log('Adding item to floating order:', payload);
          await addItemToFloatingOrder(floatingOrderId, payload);
        } catch (error: any) {
          console.error('Error adding item to floating order:', error);
          console.error('Error details:', error.response?.data);
          console.error('Item data:', { stock_id: item.id, quantity: item.quantity, discounts: item.stockDiscountIds });
          const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to add item to floating order';
          throw new Error(errorMessage);
        }
      }

      const activeTaxIds = taxes.filter((t) => t.isActive).map((t) => t.id);
      if (activeTaxIds.length > 0) {
        await addTaxes(floatingOrderId, activeTaxIds);
      }

      // Update status to 'in-progress' when items are added to floating order
      // This ensures the order shows in the floating orders panel
      try {
        await updateFloatingOrder(floatingOrderId, { status: 'in-progress' });
      } catch (error) {
        console.error('Failed to update floating order status to in-progress:', error);
      }

      const order = floatingOrders.find(o => o.id === floatingOrderId);
      const referenceNo = order?.reference_no || `#${floatingOrderId}`;

      toast({
        title: "Order Added",
        description: `Items added to order ${referenceNo} successfully.`,
        variant: "success",
      });

      clearCart();
      refreshFloatingOrders();
    } catch (error: any) {
      console.error('Failed to add items to floating order:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to add order. Please try again.";
      toast({
        title: "Failed to Add Order",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleLoadFloatingOrderToCart = async (order: any, skipCancel: boolean = false) => {
    if (!order.order_items || order.order_items.length === 0) {
      toast({
        title: "Empty Order",
        description: "This floating order has no items.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoadingFloatingOrder(true);
      setLoadingOrderId(order.id);
      setCurrentFloatingOrderId(order.id);
      
      setLinkedOrderInfo(order);
      
      if (order.customer?.id) {
        setPreselectedCustomerId(order.customer.id);
      } else {
        setPreselectedCustomerId(null);
      }
      
      const itemsToAdd: Array<{
        product: CartProduct;
        quantity: number;
        discountType: DiscountType;
        discountValue: number;
        percentageDiscounts: number[];
        fixedDiscounts: number[];
        stockDiscountIds: number[];
      }> = [];

      for (const orderItem of order.order_items) {
        if (!orderItem.stock) {
          console.warn('Order item missing stock:', orderItem);
          continue;
        }

        const stockPrice = orderItem.stock.price ?? orderItem.stock.selling_price ?? 0;
        const stockCost = orderItem.stock.cost ?? 0;
        const stockQuantity = orderItem.stock.quantity ?? 0;
        const itemQuantity = orderItem.quantity ?? 1;

        if (!orderItem.stock.id || stockPrice <= 0) {
          console.warn('Order item has invalid data:', {
            stockId: orderItem.stock.id,
            price: stockPrice,
            orderItem,
          });
          continue;
        }

        const discountIds: number[] = [];
        const percentageDiscounts: number[] = [];
        const fixedDiscounts: number[] = [];

        if (orderItem.discounts && Array.isArray(orderItem.discounts)) {
          orderItem.discounts.forEach((d: any) => {
            const discount = d?.discount;
            if (discount?.id) {
              discountIds.push(discount.id);
              
              if (discount.value_in_percentage != null) {
                percentageDiscounts.push(discount.value_in_percentage);
              } else if (discount.value != null) {
                const fixedValue = parseFloat(discount.value);
                if (!isNaN(fixedValue)) {
                  fixedDiscounts.push(fixedValue);
                }
              }
            } else if (d?.id) {
              discountIds.push(d.id);
            }
          });
        }

        console.log('Loading order item with discounts:', {
          orderItemId: orderItem.id,
          discounts: orderItem.discounts,
          discountIds,
          percentageDiscounts,
          fixedDiscounts,
        });

        const variantName = orderItem.stock.variant_specification?.name || orderItem.stock.variant || null;
        const productName = orderItem.stock.product?.name || 'Unknown Product';
        const displayName = variantName ? `${productName} (${variantName})` : productName;

        const product: CartProduct = {
          id: orderItem.stock.id,
          name: displayName,
          price: stockPrice,
          cost: stockCost,
          image: orderItem.stock.product?.image || '/placeholder.png',
          category: orderItem.stock.product?.category?.name || 'Uncategorized',
          stock: stockQuantity,
          stockDiscountIds: discountIds,
        };

        if (!itemQuantity || itemQuantity <= 0) {
          console.warn('Order item has invalid quantity:', itemQuantity);
          continue;
        }

        itemsToAdd.push({
          product,
          quantity: itemQuantity,
          discountType: 'none',
          discountValue: 0,
          percentageDiscounts,
          fixedDiscounts,
          stockDiscountIds: discountIds,
        });
      }

      // Update status to 'active' BEFORE loading items to prevent race conditions
      // Mark that we're updating status for this order
      statusUpdateInProgressRef.current = order.id;
      try {
        await updateFloatingOrder(order.id, { status: 'active' });
        setLinkedOrderInfo(prev => prev ? { ...prev, status: 'active' as const } : null);
      } catch (error) {
        console.error('Failed to update floating order status to active:', error);
      } finally {
        // Clear the ref after a short delay to allow items to load
        setTimeout(() => {
          if (statusUpdateInProgressRef.current === order.id) {
            statusUpdateInProgressRef.current = null;
          }
        }, 500);
      }

      // Load items to cart after status update
      replaceItems(itemsToAdd);

      await refreshFloatingOrders();
      setIsFloatingOrdersPanelOpen(false);
      setIsLoadingFloatingOrder(false);
      setLoadingOrderId(null);

      toast({
        title: "Order Loaded",
        description: `Floating order ${order.reference_no} has been loaded into the cart.`,
        variant: "success",
      });
    } catch (error: any) {
      console.error('Failed to load floating order to cart:', error);
      setIsLoadingFloatingOrder(false);
      setLoadingOrderId(null);
      toast({
        title: "Failed to Load Order",
        description: error.message || "Failed to load order into cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBillOutFloatingOrder = async (orderId: number) => {
    setBillingOutFloatingOrderId(orderId);
    
    if (currentFloatingOrderId === orderId) {
      setCurrentFloatingOrderId(null);
    }
    
    const order = floatingOrders.find(o => o.id === orderId);
    if (order) {
      if (order.customer?.id) {
        setPreselectedCustomerId(order.customer.id);
      } else {
        setPreselectedCustomerId(null);
      }
      
      await handleLoadFloatingOrderToCart(order, true);
      setTimeout(() => {
        setIsPaymentModalOpen(true);
      }, 100);
    }
  };

  const handleCancelFloatingOrder = async (orderId: number) => {
    try {
      if (currentFloatingOrderId === orderId) {
        setCurrentFloatingOrderId(null);
      }
      await cancelFloatingOrder(orderId);
      toast({
        title: "Order Cancelled",
        description: "The floating order has been cancelled successfully.",
        variant: "success",
      });
      refreshFloatingOrders();
    } catch (error: any) {
      console.error('Failed to cancel floating order:', error);
      toast({
        title: "Failed to Cancel Order",
        description: error.message || "Failed to cancel order. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check for open cash register session on mount
  useEffect(() => {
    const checkOpenSession = async () => {
      if (!isMounted || !user) return;
      
      setCheckingSession(true);
      try {
        const response = await getCurrentSession();
        const hasSession = !!response?.data;
        setHasOpenSession(hasSession);
        setCurrentSession(response?.data || null);
        
        // If no open session, show modal (mandatory)
        if (!hasSession) {
          setIsCashRegisterModalOpen(true);
        }
      } catch (error: any) {
        console.error('Failed to check for open session:', error);
        // On error, assume no session and show modal
        setHasOpenSession(false);
        setCurrentSession(null);
        setIsCashRegisterModalOpen(true);
      } finally {
        setCheckingSession(false);
      }
    };

    if (isMounted && user) {
      checkOpenSession();
    }
  }, [isMounted, user]);

  // Update session timer
  useEffect(() => {
    if (!currentSession || currentSession.status !== 'OPEN') {
      setSessionTimer('0:00:00');
      return;
    }

    const updateTimer = () => {
      const openedAt = new Date(currentSession.opened_at).getTime();
      const now = Date.now();
      const diff = now - openedAt;
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setSessionTimer(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [currentSession]);

  const handleSessionOpened = async () => {
    sessionJustOpenedRef.current = true;
    setIsSessionOpening(false);
    setHasOpenSession(true);
    try {
      const response = await getCurrentSession();
      if (response?.data) {
        setCurrentSession(response.data);
      }
    } catch (error) {
      // Silently fail, session will be refreshed on next check
    }
    setIsCashRegisterModalOpen(false);
    // Reset the ref after a short delay to allow state updates to complete
    setTimeout(() => {
      sessionJustOpenedRef.current = false;
    }, 100);
  };

  useEffect(() => {
    const restoreLinkedOrderInfo = async () => {
      if (!isMounted) return;
      
      if (currentFloatingOrderId && !isLoadingFloatingOrder) {
        const needsRefresh = !linkedOrderInfo || linkedOrderInfo.id !== currentFloatingOrderId;
        if (needsRefresh) {
          try {
            const response = await getFloatingOrder(currentFloatingOrderId);
            const order = response.data;
            if (order) {
              setLinkedOrderInfo(order);
              if (order.customer?.id) {
                setPreselectedCustomerId(order.customer.id);
              } else {
                setPreselectedCustomerId(null);
              }
            } else {
              setCurrentFloatingOrderId(null);
              setLinkedOrderInfo(null);
              setPreselectedCustomerId(null);
            }
          } catch (error) {
            console.error('Failed to restore linked order info:', error);
            setCurrentFloatingOrderId(null);
            setLinkedOrderInfo(null);
            setPreselectedCustomerId(null);
          }
        }
      }
      
      setHasInitialized(true);
    };

    if (isMounted) {
      restoreLinkedOrderInfo();
    }
  }, [isMounted]);

  useEffect(() => {
    // Only change status back to 'in-progress' if:
    // 1. System is initialized
    // 2. Not currently loading a floating order
    // 3. Cart is empty
    // 4. There's a current floating order ID
    // 5. No status update is in progress for this order (prevents race conditions)
    if (
      hasInitialized && 
      !isLoadingFloatingOrder && 
      items.length === 0 && 
      currentFloatingOrderId &&
      statusUpdateInProgressRef.current !== currentFloatingOrderId
    ) {
      // Increased timeout to 500ms to allow status updates to complete
      const timer = setTimeout(async () => {
        // Double-check conditions haven't changed
        if (
          hasInitialized && 
          items.length === 0 && 
          !isLoadingFloatingOrder && 
          currentFloatingOrderId &&
          statusUpdateInProgressRef.current !== currentFloatingOrderId
        ) {
          try {
            await updateFloatingOrder(currentFloatingOrderId, { status: 'in-progress' });
            await refreshFloatingOrders();
          } catch (error) {
            console.error('Failed to update floating order status back to in-progress:', error);
          }
          
          setCurrentFloatingOrderId(null);
          setLinkedOrderInfo(null);
          setPreselectedCustomerId(null);
          statusUpdateInProgressRef.current = null; // Clear status update tracking
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [hasInitialized, items.length, isLoadingFloatingOrder, currentFloatingOrderId, updateFloatingOrder, refreshFloatingOrders]);

  const handleProductClick = (product: PosProduct) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };
  
  const handleAddToCart = (
    product: CartProduct,
    quantity: number,
    discountType: DiscountType,
    discountValue: number,
    percentageDiscounts: number[] = [],
    fixedDiscounts: number[] = [],
    stockDiscountIds: number[] = [],
  ) => {
    if (!isLoadingFloatingOrder && currentFloatingOrderId) {
      const existingOrder = floatingOrders.find(o => o.id === currentFloatingOrderId && (o.status === 'active' || o.status === 'in-progress'));
      if (!existingOrder) {
        setCurrentFloatingOrderId(null);
      }
    }
    addItem(product, quantity, discountType, discountValue, percentageDiscounts, fixedDiscounts, stockDiscountIds);
  }

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategoryId === null || product.category.id === selectedCategoryId;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategoryId, products]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const from = filteredProducts.length === 0 ? 0 : (currentPage - 1) * productsPerPage + 1;
  const to = Math.min(currentPage * productsPerPage, filteredProducts.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategoryId]);

  const renderProductGrid = () => {
    if (!isMounted) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
             <div key={i} className="flex flex-col items-center space-y-2">
                <Skeleton className="h-20 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>
      );
    }

    if (loading) {
      return (
        <div className="text-center py-20 col-span-full">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-muted-foreground font-medium">Fetching products...</p>
        </div>
      );
    }

    if (filteredProducts.length === 0) {
      return (
        <div className="text-center py-20 col-span-full">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No products found.</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Try adjusting your search terms</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {paginatedProducts.map((product) => (
          <ProductCard key={product.id} product={product} onSelect={handleProductClick} />
        ))}
      </div>
    );
  }

  // Show loading overlay while checking for session
  if (checkingSession) {
    return (
      <div className="h-full bg-gradient-to-br from-secondary/30 via-background to-secondary/20 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <Loader size="md" />
          <p className="text-muted-foreground font-small">Checking cash register session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-secondary/30 via-background to-secondary/20">
      <AddOrderDialog
        product={selectedProduct}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onAddToCart={handleAddToCart}
      />

      <PaymentModal
        open={isPaymentModalOpen}
        onOpenChange={(open) => {
          setIsPaymentModalOpen(open);
          if (!open) {
            setPreselectedCustomerId(null);
          }
        }}
        grandTotal={grandTotal}
        processing={isProcessingPayment}
        onConfirm={handlePaymentConfirm}
        preselectedCustomerId={preselectedCustomerId}
      />

      <CreateFloatingOrderDialog
        isOpen={isCreateFloatingOrderModalOpen}
        onOpenChange={setIsCreateFloatingOrderModalOpen}
        onCreate={handleCreateFloatingOrderAndAddItems}
      />

      <CashRegisterOpeningModal
        isOpen={isCashRegisterModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            // Don't redirect if session was just successfully opened
            if (sessionJustOpenedRef.current) {
              setIsCashRegisterModalOpen(open);
              return;
            }
            
            // Reset the flag when modal closes (in case of error or cancellation)
            if (isSessionOpening && !hasOpenSession && !currentSession) {
              setIsSessionOpening(false);
            }
            
            // Only redirect if:
            // 1. There's no open session
            // 2. No current session exists
            // 3. We're not in the process of opening a session (prevents redirect after successful open)
            const shouldRedirect = !hasOpenSession && !currentSession && !isSessionOpening;
            
            if (shouldRedirect) {
              // Redirect to previous route or dashboard when user tries to close without session
              if (typeof window !== 'undefined') {
                const referrer = document.referrer;
                const hasReferrer = referrer && new URL(referrer).origin === window.location.origin;
                
                if (hasReferrer && window.history.length > 1) {
                  router.back();
                } else {
                  router.push('/dashboard');
                }
              } else {
                router.push('/dashboard');
              }
              return;
            }
          }
          setIsCashRegisterModalOpen(open);
        }}
        onSessionOpened={handleSessionOpened}
        onSessionOpening={() => setIsSessionOpening(true)}
        defaultCashRegisterId={currentSession?.cash_register_id ?? null}
      />

      <AlertDialog open={isCancelFloatingOrderModalOpen} onOpenChange={setIsCancelFloatingOrderModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Floating Order</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const order = floatingOrders.find(o => o.id === currentFloatingOrderId);
                if (!order) return "Are you sure you want to cancel this order?";
                
                return (
                  <div className="space-y-2 mt-2">
                    <p>Are you sure you want to cancel the following floating order?</p>
                    <div className="bg-muted p-3 rounded-md space-y-1 text-left">
                      <p><strong>Reference:</strong> {order.reference_no}</p>
                      {order.table_number && (
                        <p><strong>Table:</strong> {order.table_number}</p>
                      )}
                      {order.customer && (
                        <p><strong>Customer:</strong> {order.customer.first_name} {order.customer.last_name}</p>
                      )}
                      {order.order_items && order.order_items.length > 0 && (
                        <p><strong>Items:</strong> {order.order_items.length} item(s)</p>
                      )}
                      {order.notes && (
                        <p><strong>Notes:</strong> {order.notes}</p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelFloatingOrderConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full p-4">
        <div className="col-span-1 bg-gradient-to-br from-background to-secondary/20 p-6 flex flex-col">
           <div className="mb-4">
             <h2 className="text-2xl font-bold text-foreground mb-2">Product Catalog</h2>
             <p className="text-xs text-muted-foreground">Select products to add to your order</p>
           </div>

             <div className="mb-6 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search products by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-5 pr-4 py-3 w-full text-sm sm:text-base border border-border/40
                  focus:outline-none focus:ring-0 focus:border-primary/20 rounded-xl
                  bg-background/80 backdrop-blur-sm transition-all duration-200"
                />
             </div>

           <CategoryFilter categories={categories} selectedCategoryId={selectedCategoryId} setSelectedCategoryId={setSelectedCategoryId} />

           <div className="flex-grow">
             {renderProductGrid()}
             {totalPages > 1 && (
               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-6 pt-4 border-t text-xs">
                 <PaginationInfo
                   from={from}
                   to={to}
                   total={filteredProducts.length}
                   itemsPerPage={productsPerPage}
                   // keep POS page fixed at 10 per page, but match AssignDiscountModal compact UI
                   onItemsPerPageChange={() => {}}
                   textSize="xs"
                   compact={true}
                   showItemsPerPage={false}
                   className="min-w-0"
                 />
                 <Pagination>
                   <PaginationContent>
                     <PaginationItem>
                       <PaginationPrevious
                         onClick={(e) => {
                           e.preventDefault();
                           setCurrentPage(Math.max(1, currentPage - 1));
                         }}
                         className={cn(
                           "text-xs h-7 px-2",
                           currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                         )}
                       />
                     </PaginationItem>
                     
                     {(() => {
                       const pages: (number | 'ellipsis')[] = [];
                       const maxPageNumbers = 2;
                       
                       if (totalPages <= maxPageNumbers) {
                         for (let i = 1; i <= totalPages; i++) {
                           pages.push(i);
                         }
                       } else {
                         if (currentPage === 1) {
                           pages.push(1);
                           if (totalPages > 2) {
                             pages.push('ellipsis');
                           }
                           pages.push(totalPages);
                         } else if (currentPage === totalPages) {
                           pages.push(1);
                           if (totalPages > 2) {
                             pages.push('ellipsis');
                           }
                           pages.push(totalPages);
                         } else {
                           pages.push(1);
                           if (currentPage > 2) {
                             pages.push('ellipsis');
                           }
                           pages.push(currentPage);
                           if (currentPage < totalPages - 1) {
                             pages.push('ellipsis');
                           }
                           pages.push(totalPages);
                         }
                       }
                       
                       return pages.map((page, index) => {
                         if (page === 'ellipsis') {
                           return (
                             <PaginationItem key={`ellipsis-${index}`}>
                               <PaginationEllipsis />
                             </PaginationItem>
                           );
                         }
                         return (
                           <PaginationItem key={page}>
                             <PaginationLink
                               onClick={(e) => {
                                 e.preventDefault();
                                 setCurrentPage(page);
                               }}
                               isActive={currentPage === page}
                               className="cursor-pointer text-xs h-7 px-2"
                             >
                               {page}
                             </PaginationLink>
                           </PaginationItem>
                         );
                       });
                     })()}
                     
                     <PaginationItem>
                       <PaginationNext
                         onClick={(e) => {
                           e.preventDefault();
                           setCurrentPage(Math.min(totalPages, currentPage + 1));
                         }}
                         className={cn(
                           "text-xs h-7 px-2",
                           currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                         )}
                       />
                     </PaginationItem>
                   </PaginationContent>
                 </Pagination>
               </div>
             )}
           </div>
        </div>
        
        <div className="col-span-1 bg-gradient-to-br from-background to-secondary/10 p-6 flex flex-col">
          <Card className="flex flex-col shadow-xl border-0 bg-background/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-2">
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    {currentSession?.cash_register ? (
                      <>
                        <div className="text-xs text-muted-foreground">
                          Counter: <span className="font-medium text-foreground">{currentSession.cash_register.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Status:</span>
                          <span className="relative h-2 w-2 shrink-0">
                            <span
                              className={cn(
                                "absolute inset-0 rounded-full",
                                currentSession.status === 'OPEN' ? "bg-emerald-500" : "bg-red-500"
                              )}
                            />
                            {currentSession.status === 'OPEN' && (
                              <span
                                className={cn(
                                  "absolute inset-0 rounded-full animate-ping opacity-75",
                                  currentSession.status === 'OPEN' 
                                    ? "bg-emerald-500" 
                                    : "bg-red-500"
                                )}
                              />
                            )}
                          </span>
                          <span className={cn(
                            "font-medium",
                            currentSession.status === 'OPEN' ? "text-emerald-600" : "text-red-600"
                          )}>
                            {currentSession.status === 'OPEN' ? 'Open' : 'Closed'}
                          </span>
                          {currentSession.status === 'OPEN' && (
                            <span className="text-xs text-foreground">- {sessionTimer}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(() => {
                            const user = currentSession.user as any;
                            const userInfo = user?.userInfo || user?.user_info;
                            if (userInfo) {
                              return (
                                <>
                                  Cashier: <span className="font-medium text-foreground">{userInfo.first_name} {userInfo.last_name}</span>
                                </>
                              );
                            }
                            if (user?.email) {
                              return (
                                <>
                                  Cashier: <span className="font-medium text-foreground">{user.email}</span>
                                </>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </>
                    ) : (
                      <CardTitle className="flex items-center text-lg sm:text-xl">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <CreditCard className="h-4 w-4 text-primary" />
                          </div>
                          <span>Current Order</span>
                        </div>
                      </CardTitle>
                    )}
                  </div>
                  <div className="flex flex-row flex-wrap gap-2 items-center xl:items-end shrink-0">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setIsCashRegisterModalOpen(true)}
                      className="relative flex items-center gap-2 h-9 px-4"
                    >
                      <Lock className="h-4 w-4" />
                      <span>Close</span>
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setIsFloatingOrdersPanelOpen(true)}
                      className="relative flex items-center gap-2 h-9 px-4"
                    >
                      <Clock className="h-4 w-4" />
                      <span>Orders</span>
                      {activeFloatingOrdersCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                          {activeFloatingOrdersCount}
                        </Badge>
                      )}
                    </Button>
                  </div>
                </div>
                {currentFloatingOrderId && (() => {
                  const linkedOrder = floatingOrders.find(o => o.id === currentFloatingOrderId) || linkedOrderInfo;
                  if (linkedOrder) {
                    return (
                      <div className="flex items-center gap-2 px-2 py-1.5 bg-primary/5 border border-primary/20 rounded-md">
                        <Badge variant="outline" className="text-xs">
                          {linkedOrder.status === 'active' ? 'In Cart' : 'Floating Order'}
                        </Badge>
                        <span className="text-xs font-medium text-foreground">
                          {linkedOrder.reference_no}
                        </span>
                        {linkedOrder.table_number && (
                          <span className="text-xs text-muted-foreground">
                            • Table {linkedOrder.table_number}
                          </span>
                        )}
                        {linkedOrder.customer && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {linkedOrder.customer.first_name} {linkedOrder.customer.last_name}
                          </span>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </CardHeader>

            <CardContent className="p-0 flex flex-col">
               <div className="grid grid-cols-12 gap-4 px-4 sm:px-6 py-2 text-xs xs:text-sm font-semibold text-muted-foreground">
                 <div className="col-span-3">Item</div>
                 <div className="col-span-2 text-center">Price</div>
                 <div className="col-span-1 text-center">Qty</div>
                 <div className="col-span-2 text-center">Disc</div>
                 <div className="col-span-1 text-center">Disc%</div>
                 <div className="col-span-2 text-center">Subtotal</div>
                 <div className="col-span-1"></div>
               </div>

                <CartItemList
                  items={items}
                  isMounted={isMounted}
                  removeItem={removeItem}
                  updateItemQuantity={updateItemQuantity}
                />
            </CardContent>

            <CardFooter className="flex-col !p-0">
              <CartSummary
                cartTotal={cartTotal}
                totalDiscount={totalDiscount}
                totalTaxPercentage={totalTaxPercentage}
                taxAmount={taxAmount}
                grandTotal={grandTotal}
              />
              <div className="w-full p-4 xl:p-6 border-t bg-gradient-to-r from-primary/5 to-secondary/20">
                <div className="flex flex-col xl:flex-row gap-3 w-full">
                  <div className="w-full xl:w-1/3">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full h-10 xs:h-12 text-sm xs:text-base font-semibold transition-all duration-200"
                      onClick={handleCancelClick}
                      disabled={items.length === 0}
                    >
                      Cancel
                    </Button>
                  </div>

                  <div className="w-full xl:w-1/3">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full h-10 xs:h-12 text-sm xs:text-base font-semibold transition-all duration-200"
                      onClick={handleAddOrder}
                      disabled={items.length === 0}
                    >
                      Add Order
                    </Button>
                  </div>

                  <div className="w-full xl:w-1/3">
                    <Button
                      size="lg"
                      className="w-full h-10 xs:h-12 text-xs xs:text-base font-semibold shadow-md xl:shadow-lg 
                      hover:shadow-lg xl:hover:shadow-xl 
                      transition-all duration-200 bg-primary hover:bg-primary/90"
                      onClick={runCompletePurchase}
                      disabled={items.length === 0}
                    >
                      <CreditCard className="mr-2 h-4 w-4 xl:h-5 xl:w-5" />
                      Complete Order
                    </Button>
                  </div>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>

        <FloatingOrdersPanel
          floatingOrders={floatingOrders}
          loading={floatingOrdersLoading}
          error={floatingOrdersError}
          onSelectOrder={handleLoadFloatingOrderToCart}
          onBillOut={handleBillOutFloatingOrder}
          onCancel={handleCancelFloatingOrder}
          onRefresh={refreshFloatingOrders}
          isOpen={isFloatingOrdersPanelOpen}
          onOpenChange={setIsFloatingOrdersPanelOpen}
          loadingOrderId={loadingOrderId}
        />
      </div>
    </div>   
  );
}