import { useEffect, useState } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';
import type { Transaction, BackendTransaction } from '@/lib/types';
import { format } from 'date-fns';
import { useCurrency } from '@/contexts/CurrencyContext';
import { fetchTransaction } from '@/app/pos/transactions/services/transactionsService';
import { type ReceiptData, type ReceiptItem, type ReceiptTax } from '@/components/forms/receipt/receipt-template';
import { settingsService } from '@/services/settings/settingsService';
import { branchService } from '@/app/management/branches/services/branchService';

export function useReceiptData() {
  const [transactions] = useLocalStorage<Transaction[]>('transactions', []);
  const [backendTransaction, setBackendTransaction] = useState<BackendTransaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [branding, setBranding] = useState<any>(null);
  const [brandingLoaded, setBrandingLoaded] = useState(false);
  const [transactionBranch, setTransactionBranch] = useState<any>(null);
  const { defaultCurrency } = useCurrency();

  // Transform BackendTransaction to ReceiptData
  const transformToReceiptData = (transaction: BackendTransaction): ReceiptData => {
    const currencySymbol = defaultCurrency?.symbol || '₱';

    const items: ReceiptItem[] = (transaction.order_items || []).map(item => {
      const unitPrice = parseFloat(item.stock?.selling_price || item.stock?.price || '0');
      const quantity = item.quantity;
      const originalPrice = unitPrice * quantity;
      
      // Calculate discount for this item
      let itemDiscountAmount = 0;
      const discounts: ReceiptItem['discounts'] = [];
      
      if (item.discounts && item.discounts.length > 0) {
        item.discounts.forEach((orderItemDiscount) => {
          const discount = orderItemDiscount.discount;
          if (discount) {
            let discountAmount = 0;
            
            if (discount.value_in_percentage !== null && discount.value_in_percentage !== undefined) {
              // Percentage discount
              const percentageValue = parseFloat(discount.value_in_percentage.toString());
              discountAmount = originalPrice * (percentageValue / 100);
            } else if (discount.value !== null && discount.value !== undefined) {
              // Fixed discount
              discountAmount = parseFloat(discount.value.toString());
            }
            
            if (discountAmount > 0) {
              itemDiscountAmount += discountAmount;
              discounts.push({
                name: discount.name || 'Discount',
                amount: discountAmount,
              });
            }
          }
        });
      }
      
      const finalPrice = Math.max(0, originalPrice - itemDiscountAmount);
      
      // Build item name with variant if available
      const productName = item.stock?.product?.name || 'Deleted Product';
      const variantName = item.stock?.variant_specification?.name;
      const displayName = variantName ? `${productName} (${variantName})` : productName;
      
      return {
        name: displayName,
        quantity: quantity,
        price: unitPrice,
        total: finalPrice,
        vat: true, // Assuming VAT is applied
        originalPrice: originalPrice,
        discountAmount: itemDiscountAmount > 0 ? itemDiscountAmount : undefined,
        discounts: discounts.length > 0 ? discounts : undefined,
      };
    });

    const taxes: ReceiptTax[] = (transaction.taxes || []).map(tax => ({
      name: tax.tax?.name || 'Deleted Tax',
      percentage: tax.tax?.percentage || 0,
      amount: (transaction.sub_total - transaction.total_discount) * ((tax.tax?.percentage || 0) / 100),
    }));

    const subtotal = transaction.sub_total;
    const total = transaction.grand_total;
    const discount = transaction.total_discount;
    const paymentReceived = transaction.paid_amount;
    const change = transaction.change;

    // Apply branding if available
    const appliedBranding = branding?.data || {};
    
    // Determine which branch to use: transaction branch (with address) or branding branch
    // Priority: transactionBranch > (branding.branch if IDs match) > branding.branch
    const transactionBranchId = transaction.branch?.id;
    const brandingBranchId = branding?.branch?.id;
    
    let branchInfo: any = {};
    if (transactionBranch && transactionBranch.id === transactionBranchId) {
      // Use the fetched transaction branch (has full address)
      branchInfo = {
        id: transactionBranch.id,
        name: transactionBranch.name,
        address: transactionBranch.address,
      };
    } else if (branding?.branch && (!transactionBranchId || brandingBranchId === transactionBranchId)) {
      // Use branding branch if IDs match or transaction has no branch
      branchInfo = branding.branch;
    } else if (transaction.branch) {
      // Fallback to transaction branch (name only, no address)
      branchInfo = {
        id: transaction.branch.id,
        name: transaction.branch.name,
        address: null,
      };
    }

    // Format branch address
    const formatAddress = (address: any) => {
      if (!address) return 'Your Store Address';
      const parts = [
        address.block_lot,
        address.street,
        address.barangay,
        address.city,
        address.province,
        address.region,
        address.postal_code || address.zip_code
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : 'Your Store Address';
    };

    const cashierName = transaction.creator?.name || null;

    return {
      storeName: branchInfo.name || transaction.branch?.name || 'Grocery POS',
      address: formatAddress(branchInfo.address),
      vatTin: '123-456-789',
      transactionType: 'Sale',
      posTerminal: 'POS Terminal 1',
      customerName: transaction.customer ? `${transaction.customer.first_name}${transaction.customer.last_name ? ' ' + transaction.customer.last_name : ''}` : undefined,
      cashier: cashierName || undefined,
      items,
      subtotal,
      taxes,
      discount,
      total,
      paymentReceived,
      change,
      transactionNumber: transaction.reference_no.toString(),
      date: format(new Date(transaction.created_at), 'yyyy-MM-dd'),
      time: format(new Date(transaction.created_at), 'HH:mm:ss'),
      headerMessage: appliedBranding.receipt_header || 'Sale Complete',
      footerMessages: appliedBranding.receipt_footer ? [appliedBranding.receipt_footer] : ['Thank you for your purchase!'],
      primaryColor: appliedBranding.brand_color || '#3B82F6',
      logoUrl: appliedBranding.brand_logo || undefined,
      showLogo: true,
      currencySymbol,
    };
  };

  useEffect(() => {
    // Fetch branding settings
    const fetchBranding = async () => {
      try {
        const brandingData = await settingsService.getBranding();
        setBranding(brandingData);
        setBrandingLoaded(true);
      } catch (error) {
        console.error('Failed to fetch branding:', error);
        setBrandingLoaded(true); // Still mark as loaded even on error
        // Continue without branding - use defaults
      }
    };

    fetchBranding();

    // Check for transaction ID in sessionStorage (new flow)
    const storedTransactionId = sessionStorage.getItem('viewReceiptTransactionId');
    if (storedTransactionId) {
      setIsLoading(true);
      fetchTransaction(parseInt(storedTransactionId))
        .then(async (response) => {
          const transaction = response.data;
          setBackendTransaction(transaction);
          
          // Fetch the branch with address if transaction has a branch
          if (transaction.branch?.id) {
            try {
              const branch = await branchService.getById(transaction.branch.id);
              setTransactionBranch(branch);
            } catch (error) {
              console.error('Failed to fetch transaction branch:', error);
              // Continue without branch address
            }
          }
          
          // Clear the stored ID after use
          sessionStorage.removeItem('viewReceiptTransactionId');
        })
        .catch((err) => {
          console.error('Failed to fetch transaction:', err);
          // Fall back to localStorage
          const lastTransaction = transactions.length > 0 ? transactions[transactions.length - 1] : null;
          if (lastTransaction) {
            setBackendTransaction({
              id: lastTransaction.id,
              reference_no: lastTransaction.id.substring(0, 8),
              created_at: lastTransaction.date,
              sub_total: lastTransaction.total + lastTransaction.totalDiscount - lastTransaction.totalTax,
              total_discount: lastTransaction.totalDiscount,
              total_tax: lastTransaction.totalTax,
              grand_total: lastTransaction.total,
              order_items: lastTransaction.items.map((item, index) => ({
                id: index + 1,
                quantity: item.quantity,
                stock: {
                  selling_price: item.price.toString(),
                  product: {
                    name: item.name,
                  },
                  variant_specification: null,
                },
              })),
            } as any);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // Check for full transaction data in sessionStorage (old flow for backward compatibility)
      const storedTransaction = sessionStorage.getItem('viewReceiptTransaction');
      if (storedTransaction) {
        try {
          const transaction = JSON.parse(storedTransaction);
          setBackendTransaction(transaction);
          
          // Fetch the branch with address if transaction has a branch
          if (transaction.branch?.id) {
            branchService.getById(transaction.branch.id)
              .then((branch) => {
                setTransactionBranch(branch);
              })
              .catch((error) => {
                console.error('Failed to fetch transaction branch:', error);
              });
          }
          
          // Clear the stored data after use
          sessionStorage.removeItem('viewReceiptTransaction');
        } catch (err) {
          console.error('Failed to parse stored transaction:', err);
        }
      }
      setIsLoading(false);
    }
  }, [transactions]);

  const lastTransaction = transactions.length > 0 ? transactions[transactions.length - 1] : null;
  const transactionToDisplay = backendTransaction || (lastTransaction ? {
    id: lastTransaction.id,
    reference_no: lastTransaction.id.substring(0, 8),
    created_at: lastTransaction.date,
    sub_total: lastTransaction.total + lastTransaction.totalDiscount - lastTransaction.totalTax,
    total_discount: lastTransaction.totalDiscount,
    total_tax: lastTransaction.totalTax,
    grand_total: lastTransaction.total,
    order_items: lastTransaction.items.map((item, index) => ({
      id: index + 1,
      quantity: item.quantity,
      stock: {
        selling_price: item.price.toString(),
        product: {
          name: item.name,
        },
        variant_specification: null,
      },
    })),
  } as any : null);

  const receiptData = transactionToDisplay ? transformToReceiptData(transactionToDisplay) : null;

  return {
    receiptData,
    transactionToDisplay,
    isLoading,
    brandingLoaded,
  };
}