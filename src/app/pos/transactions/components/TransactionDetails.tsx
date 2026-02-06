import type { BackendTransaction, BackendOrderItemDiscount } from '@/lib/types';
import { useCurrency } from '@/contexts/CurrencyContext';

interface TransactionDetailsProps {
  transaction: BackendTransaction;
}

export function TransactionDetails({ transaction }: TransactionDetailsProps) {
  const { defaultCurrency } = useCurrency();
  const currencySymbol = defaultCurrency?.symbol || '₱';
  
  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${amount.toFixed(2)}`;
  };

  const subtotal = Number(transaction.sub_total || 0);
  const totalDiscount = Number(transaction.total_discount || 0);
  const grandTotal = Number(transaction.grand_total || 0);
  const paidAmount = Number(transaction.paid_amount || 0);
  const change = Number(transaction.change || 0);
  const totalTax = Number(transaction.total_tax || 0);

  let priceWithoutVat = subtotal;
  let vatAmount = 0;
  
  if (transaction.taxes && transaction.taxes.length > 0) {
    const totalTaxRate = transaction.taxes.reduce((sum, tax) => sum + (tax.tax?.percentage || 0), 0);
    if (totalTaxRate > 0) {
      priceWithoutVat = subtotal / (1 + totalTaxRate / 100);
      vatAmount = subtotal - priceWithoutVat;
    } else if (subtotal > 0) {
      priceWithoutVat = subtotal / 1.12;
      vatAmount = subtotal - priceWithoutVat;
    }
  } else if (subtotal > 0) {
    priceWithoutVat = subtotal / 1.12;
    vatAmount = subtotal - priceWithoutVat;
  }

  return (
    <div className="pl-6 pr-6 border-l-2 ml-6 border-primary/20 py-4 bg-muted/40 rounded-md">
      <div className="pb-2">
        <div className="border-t border-gray-300 dark:border-gray-600 pt-2">
          {transaction.order_items.map((item, index) => {
            const itemName = item.stock?.product?.name || 'Deleted Product';
            const variantName = item.stock?.variant_specification?.name;
            const displayName = variantName ? `${itemName} (${variantName})` : itemName;
            const unitPrice = Number(item.stock?.price || item.stock?.selling_price || 0);
            const quantity = item.quantity || 0;
            const itemTotal = unitPrice * quantity;
            const itemDiscounts = item.discounts || [];
            const hasDiscounts = itemDiscounts.length > 0;

            let originalPrice = itemTotal;
            itemDiscounts.forEach((disc: BackendOrderItemDiscount) => {
              const discAmount = disc.discount?.value
                ? Number(disc.discount.value)
                : (itemTotal * (disc.discount?.value_in_percentage || 0) / 100);
              originalPrice += discAmount;
            });

            return (
              <div key={`${item.id}-${index}`} className="mb-2 text-xs text-gray-800 dark:text-gray-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-2">{displayName}</div>
                  <div className="text-right whitespace-nowrap">{formatCurrency(hasDiscounts ? originalPrice : itemTotal)}</div>
              </div>
                {hasDiscounts && itemDiscounts.map((disc: BackendOrderItemDiscount, discountIndex) => {
                  const discAmount = disc.discount?.value
                    ? Number(disc.discount.value)
                    : (itemTotal * (disc.discount?.value_in_percentage || 0) / 100);
                  return (
                    <div key={`${disc.id}-${discountIndex}`} className="mt-0.5 flex justify-between items-start pl-4 text-xs text-gray-600 dark:text-gray-400">
                      <span className="flex-1 pr-2">{disc.discount?.name || 'Deleted Discount'} (Disc)</span>
                      <span className="text-right whitespace-nowrap">-{formatCurrency(discAmount)}</span>
                    </div>
                  );
                })}
                    </div>
                  );
          })}
        </div>
      </div>

      <div className="pb-2">
        <div className="border-t border-gray-300 dark:border-gray-600 pt-2">
          <div className="flex justify-between text-xs mb-1 text-gray-800 dark:text-gray-200">
            <span>Subtotal</span>
            <span className="text-right">{formatCurrency(subtotal)}</span>
          </div>
          
          {transaction.taxes && transaction.taxes.length > 0 ? (
            <>
              <div className="flex justify-between text-xs mb-1 text-gray-800 dark:text-gray-200">
                <span>Price w/o VAT</span>
                <span className="text-right">{formatCurrency(priceWithoutVat)}</span>
              </div>
              {transaction.taxes.map((tax, taxIndex) => {
                const taxRate = tax.tax?.percentage || 12;
                const taxAmount = priceWithoutVat * (taxRate / 100);
                return (
                  <div key={tax.id || taxIndex} className="flex justify-between text-xs mb-1 text-gray-800 dark:text-gray-200">
                    <span>{tax.tax?.name || 'VAT'} ({taxRate}%):</span>
                    <span className="text-right">{formatCurrency(taxAmount)}</span>
                  </div>
                );
              })}
            </>
          ) : (
            <>
              <div className="flex justify-between text-xs mb-1 text-gray-800 dark:text-gray-200">
                <span>Price w/o VAT</span>
                <span className="text-right">{formatCurrency(priceWithoutVat)}</span>
            </div>
              <div className="flex justify-between text-xs mb-1 text-gray-800 dark:text-gray-200">
                <span>VAT (12%):</span>
                <span className="text-right">{formatCurrency(vatAmount)}</span>
              </div>
            </>
          )}
          
          {totalDiscount > 0 && (
            <div className="flex justify-between text-xs mb-1 text-gray-800 dark:text-gray-200">
              <span>Discount:</span>
              <span className="text-right">-{formatCurrency(totalDiscount)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-xs font-bold mb-1 text-gray-800 dark:text-gray-200">
            <span>TOTAL:</span>
            <span className="text-right">{formatCurrency(grandTotal)}</span>
          </div>
        </div>
                </div>

      <div className="pb-2">
        <div className="border-t border-gray-300 dark:border-gray-600 pt-2">
          <div className="flex justify-between text-xs mb-1 text-gray-800 dark:text-gray-200">
            <span>Payment Received:</span>
            <span className="text-right">{formatCurrency(paidAmount)}</span>
              </div>
          
          <div className="flex justify-between text-xs font-bold text-gray-800 dark:text-gray-200">
            <span>CHANGE:</span>
            <span className="text-right">{formatCurrency(change)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}