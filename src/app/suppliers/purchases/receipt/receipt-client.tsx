'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import { ReceiptTemplate } from '@/components/forms/receipt/receipt-template';
import { fetchPurchaseById, Purchase } from '../../services/purchaseService';
import { ReceiptData } from '@/components/forms/receipt/receipt-template';
import { settingsService } from '@/services/settings/settingsService';
import { useReceiptPrint } from '../../../order-success/hooks/use-receipt-print';

export function PurchaseReceiptClient() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [branding, setBranding] = useState<any>(null);
  const [brandingLoaded, setBrandingLoaded] = useState(false);
  const { receiptRef, handlePrint } = useReceiptPrint();

  const purchaseId = typeof window !== 'undefined' ? sessionStorage.getItem('viewPurchaseReceiptId') : null;
  const supplierId = typeof window !== 'undefined' ? sessionStorage.getItem('supplierId') : null;

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      }
    };

    fetchBranding();
  }, []);

  useEffect(() => {
    const loadPurchase = async () => {
      if (!purchaseId) {
        setError('No purchase ID found');
        setLoading(false);
        return;
      }

      try {
        const data = await fetchPurchaseById(Number(purchaseId));
        setPurchase(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load purchase');
      } finally {
        setLoading(false);
      }
    };

    if (isMounted) {
      loadPurchase();
    }
  }, [isMounted, purchaseId]);

  const getReceiptData = (purchase: Purchase): ReceiptData => {
    const items = purchase.purchase_items.map(item => {
      const unitPrice = parseFloat(item.product.stocks[0]?.cost || '0');
      const quantity = item.quantity;
      const originalPrice = unitPrice * quantity;
      const discount = item.discount || 0;
      const finalPrice = originalPrice - discount;
      
      const discounts: ReceiptItem['discounts'] = [];
      if (discount > 0) {
        discounts.push({
          name: 'Discount',
          amount: discount,
        });
      }
      
      return {
        name: item.product.name,
        quantity: quantity,
        price: unitPrice,
        total: finalPrice,
        originalPrice: originalPrice,
        discountAmount: discount > 0 ? discount : undefined,
        discounts: discounts.length > 0 ? discounts : undefined,
      };
    });

    // Apply branding if available
    const appliedBranding = branding?.data || {};
    const branchInfo = branding?.branch || {};

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
        address.postal_code
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : 'Your Store Address';
    };

    return {
      storeName: branchInfo.name || purchase.supplier.name,
      address: formatAddress(branchInfo.address),
      vatTin: '123-456-789', // Could be added to branch/supplier data
      transactionType: 'PURCHASE',
      posTerminal: `Branch: ${purchase.branch?.name || 'N/A'}`,
      customerType: 'Supplier',
      customerName: purchase.supplier.name,
      items,
      subtotal: purchase.subtotal,
      taxes: [], // No taxes for purchases
      discount: purchase.total_discount,
      total: purchase.grand_total,
      paymentReceived: purchase.paid_amount,
      change: purchase.change || 0,
      transactionNumber: purchase.invoice_no.toString(),
      date: new Date(purchase.date).toLocaleDateString(),
      time: new Date(purchase.created_at).toLocaleTimeString(),
      headerMessage: appliedBranding.receipt_header || 'Purchase Complete',
      footerMessages: appliedBranding.receipt_footer ? [appliedBranding.receipt_footer] : ['Thank you for your business!'],
      primaryColor: appliedBranding.brand_color || '#3B82F6',
      logoUrl: appliedBranding.brand_logo || undefined,
      showLogo: true,
      currencySymbol: '₱',
    };
  };

  if (!isMounted || loading || !brandingLoaded) {
    return (
      <div className="text-center text-muted-foreground">
        <p>Loading receipt...</p>
      </div>
    );
  }

  if (error || !purchase) {
    return (
      <div className="w-full max-w-md text-center p-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-xl font-bold mb-4">No Purchase Found</h2>
        <p className="mb-4">{error || 'We couldn\'t find the details of this purchase.'}</p>
        <Button asChild>
          <Link href="/suppliers">Back to Suppliers</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div ref={receiptRef}>
        <ReceiptTemplate data={getReceiptData(purchase)} className="print:shadow-none print:border-none" />
      </div>
      <div className="mt-6 flex justify-center gap-4 print:hidden">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print Receipt
        </Button>
        <Button onClick={() => router.push(`/suppliers/purchases?id=${supplierId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Purchases
        </Button>
      </div>
    </div>
  );
}