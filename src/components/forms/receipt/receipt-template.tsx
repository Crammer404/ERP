'use client'

import { Sparkles } from 'lucide-react'

export interface ReceiptItemDiscount {
  name: string
  amount: number
}

export interface ReceiptItem {
  name: string
  quantity: number
  price: number
  total: number
  vat?: boolean
  originalPrice?: number // Price before discount (per unit * quantity)
  discountAmount?: number // Total discount amount for this item
  discounts?: ReceiptItemDiscount[] // Array of discounts with names and amounts
}

export interface ReceiptTax {
  name: string
  percentage: number
  amount: number
}

export interface ReceiptData {
  // Store Information
  storeName: string
  address: string
  vatTin: string
  logoUrl?: string

  // Transaction Details
  transactionType: string
  posTerminal: string
  customerType?: string
  customerName?: string
  cashier?: string

  // Items
  items: ReceiptItem[]

  // Totals
  subtotal: number
  taxes?: ReceiptTax[]
  discount: number
  total: number
  paymentReceived: number
  change: number

  // Transaction Info
  transactionNumber: string
  date: string
  time: string

  // Messages
  headerMessage?: string
  footerMessages?: string[]

  // Styling
  primaryColor?: string
  showLogo?: boolean

  // Currency
  currencySymbol?: string
}

interface ReceiptTemplateProps {
  data: ReceiptData
  className?: string
}

export function ReceiptTemplate({ data, className = '' }: ReceiptTemplateProps) {
  // Get currency symbol from data or default to ₱
  const currencySymbol = data.currencySymbol || '₱'
  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div className={`bg-white shadow-lg overflow-hidden max-w-sm mx-auto ${className}`}>
      {/* Store Header */}
      <div className="text-center p-4">
        {data.showLogo && (
          data.logoUrl ? (
            <div className="mx-auto h-12 w-12 rounded-full overflow-hidden mb-3 flex items-center justify-center bg-gray-100">
              <img src={data.logoUrl} alt="Logo" className="h-full w-full object-cover" />
            </div>
          ) : (
            <div
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full mb-3"
              style={{ backgroundColor: `${data.primaryColor || '#3B82F6'}20` }}
            >
              <Sparkles
                className="h-6 w-6"
                style={{ color: data.primaryColor || '#3B82F6' }}
              />
            </div>
          )
        )}

        <h2 className="text-lg font-bold mb-1" style={{ color: data.primaryColor || '#111827' }}>
          {data.storeName}
        </h2>
        
        <div className="text-xs space-y-1 text-gray-800 pb-2">
          <p>{data.address}</p>
          <p>VAT Registered TIN: {data.vatTin}</p>
        </div>
      </div>

      {/* Transaction & Customer Details */}
      <div className="px-4 pb-2">
        <p>
          {data.cashier && (
            <div className="text-xs text-gray-800 mt-1">
              Cashier: {data.cashier}
            </div>
          )}
        </p>
        <div className="flex justify-between items-center text-xs text-gray-800">
          <p>
            {data.transactionType}
            {data.posTerminal ? `: ${data.posTerminal}` : ''}
          </p>
          <div>
            <p>
              {data.customerName ? (data.customerType || 'Regular') : 'WALK-IN'}
            </p>
            {data.customerName && <p>{data.customerName}</p>}
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className="px-4 pb-2">
        <div className="border-t border-gray-300 pt-2">
          {data.items.map((item, index) => {
            const hasDiscounts = item.discounts && item.discounts.length > 0;
            const displayPrice = hasDiscounts && item.originalPrice ? item.originalPrice : item.total;
            return (
              <div key={index} className="mb-2 text-xs text-gray-800">
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-2">{item.name}</div>
                  <div className="text-right whitespace-nowrap">{formatCurrency(displayPrice)}</div>
                </div>
                {hasDiscounts && item.discounts && item.discounts.map((discount, discountIndex) => (
                  <div key={discountIndex} className="mt-0.5 flex justify-between items-start pl-4 text-xs text-gray-600">
                    <span className="flex-1 pr-2">{discount.name} (Disc)</span>
                    <span className="text-right whitespace-nowrap">-{formatCurrency(discount.amount)}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Section */}
      <div className="px-4 pb-2">
        <div className="border-t border-gray-300 pt-2">
          <div className="flex justify-between text-xs mb-1 text-gray-800">
            <span>Subtotal</span>
            <span className="text-right">{formatCurrency(data.subtotal)}</span>
          </div>
          
          {data.transactionType !== 'PURCHASE' && (
            <>
              {data.taxes && data.taxes.length > 0 ? (
                <>
                  {(() => {
                    const totalTaxRate = data.taxes.reduce((sum, tax) => sum + tax.percentage, 0);
                    const priceWithoutVat = totalTaxRate > 0 
                      ? data.subtotal / (1 + totalTaxRate / 100)
                      : data.subtotal;
                    return (
                      <div className="flex justify-between text-xs mb-1 text-gray-800">
                        <span>Price w/o VAT</span>
                        <span className="text-right">{formatCurrency(priceWithoutVat)}</span>
                      </div>
                    );
                  })()}
                  {data.taxes.map((tax, index) => (
                    <div key={index} className="flex justify-between text-xs mb-1 text-gray-800">
                      <span>{tax.name} ({tax.percentage}%):</span>
                      <span>{formatCurrency(tax.amount)}</span>
                    </div>
                  ))}
                </>
              ) : null}
            </>
          )}
          
          {data.discount > 0 && (
            <div className="flex justify-between text-xs mb-1 text-gray-800">
              <span>Discount:</span>
              <span>-{formatCurrency(data.discount)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-xs font-bold mb-1 text-gray-800">
            <span>TOTAL:</span>
            <span>{formatCurrency(data.total)}</span>
          </div>
          
          <div className="border-t border-gray-300 my-1"></div>
          
          <div className="flex justify-between text-xs mb-1 text-gray-800">
            <span>Payment Received:</span>
            <span>{formatCurrency(data.paymentReceived)}</span>
          </div>
          
          <div className="flex justify-between text-xs font-bold text-gray-800">
            <span>CHANGE:</span>
            <span>{formatCurrency(data.change)}</span>
          </div>
        </div>
      </div>

       {/* Transaction Info & Footer Messages */}
       <div className="px-4 pb-4">
         <div className="border-t border-gray-300 pt-2 space-y-2">
           <p className="text-xs text-center text-gray-800">
             Trans No. {data.transactionNumber} - {data.date} - {data.time}
           </p>
           {data.footerMessages && data.footerMessages.length > 0 && (
             <>
               {data.footerMessages.map((message, index) => (
                 <p key={index} className="text-xs text-center font-bold text-gray-800">
                   {message}
                 </p>
               ))}
             </>
           )}
         </div>
       </div>
     </div>
   )
 }