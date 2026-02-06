'use client'

import { CreditCard, Smartphone, Building2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { applyMaxLength, INPUT_LIMITS } from '../utils/input-limits'

interface PaymentsStepProps {
  data: any
  onUpdate: (data: any) => void
}

export function PaymentsStep({ data, onUpdate }: PaymentsStepProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>(data.paymentMethod || '')
  const [businessInfo, setBusinessInfo] = useState({
    businessName: data.storeName || '',
    businessEmail: data.email || ''
  })
  const [cardDetails, setCardDetails] = useState({
    fullName: '',
    cardNumber: '',
    expDate: '',
    cvv: '',
    saveCard: false
  })
  const [limitCounters, setLimitCounters] = useState<Record<string, { counter: string, isAtLimit: boolean }>>({})

  // Update businessInfo when data changes (e.g., user navigates back and updates)
  useEffect(() => {
    const businessName = data.storeName || ''
    const businessEmail = data.email || ''
    
    // Apply limits to incoming data
    const { value: limitedBusinessName, counter: businessNameCounter, isAtLimit: businessNameAtLimit } = applyMaxLength(businessName, INPUT_LIMITS.businessName)
    const { value: limitedBusinessEmail, counter: businessEmailCounter, isAtLimit: businessEmailAtLimit } = applyMaxLength(businessEmail, INPUT_LIMITS.businessEmail)
    
    setBusinessInfo({
      businessName: limitedBusinessName,
      businessEmail: limitedBusinessEmail
    })
    
    setLimitCounters(prev => ({
      ...prev,
      businessName: { counter: businessNameCounter, isAtLimit: businessNameAtLimit },
      businessEmail: { counter: businessEmailCounter, isAtLimit: businessEmailAtLimit }
    }))
  }, [data.storeName, data.email])

  const paymentMethods = [
    {
      id: 'credit-card',
      name: 'Credit Card',
      logo: '💳',
      color: 'bg-red-500',
      popular: true
    },
    {
      id: 'gcash',
      name: 'GCash',
      logo: '💰',
      color: 'bg-blue-600',
      popular: true
    }
  ]

  const selectPaymentMethod = (methodId: string) => {
    setSelectedMethod(methodId)
    onUpdate({ ...data, paymentMethod: methodId })
  }

  const handleBusinessInfoChange = (field: string, value: string) => {
    const limitsMap: Record<string, number | undefined> = {
      businessName: INPUT_LIMITS.businessName,
      businessEmail: INPUT_LIMITS.businessEmail,
    }
    const max = limitsMap[field]
    const { value: truncated, counter, isAtLimit } = max ? applyMaxLength(value, max) : { value, counter: '', isAtLimit: false }
    setLimitCounters(prev => ({ ...prev, [field]: { counter, isAtLimit } }))
    setBusinessInfo(prev => ({
      ...prev,
      [field]: truncated
    }))
  }

  const handleCardDetailsChange = (field: string, value: string | boolean) => {
    let finalValue: string | boolean = value
    
    if (typeof value === 'string') {
      const limitsMap: Record<string, number | undefined> = {
        fullName: INPUT_LIMITS.fullName,
        cardNumber: INPUT_LIMITS.cardNumber,
        expDate: INPUT_LIMITS.expDate,
        cvv: INPUT_LIMITS.cvv,
      }
      const max = limitsMap[field]
      if (max) {
        const { value: truncated, counter, isAtLimit } = applyMaxLength(value, max)
        finalValue = truncated
        setLimitCounters(prev => ({ ...prev, [field]: { counter, isAtLimit } }))
      }
    }
    
    setCardDetails(prev => ({
      ...prev,
      [field]: finalValue
    }))
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-left mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Payment Setup</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Configure your payment processing options</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-4">
          {/* Business Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Business Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessName" className="text-sm">Business Name</Label>
                <Input
                  id="businessName"
                  placeholder="Enter your business name"
                  value={businessInfo.businessName}
                  onChange={(e) => handleBusinessInfoChange('businessName', e.target.value)}
                  className="mt-1 h-9 text-sm"
                />
                {limitCounters.businessName?.isAtLimit && (
                  <p className="text-xs mt-1 text-right text-red-600">
                    {limitCounters.businessName.counter}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="businessEmail" className="text-sm">Business Email</Label>
                <Input
                  id="businessEmail"
                  type="email"
                  placeholder="business@example.com"
                  value={businessInfo.businessEmail}
                  onChange={(e) => handleBusinessInfoChange('businessEmail', e.target.value)}
                  className="mt-1 h-9 text-sm"
                />
                {limitCounters.businessEmail?.isAtLimit && (
                  <p className="text-xs mt-1 text-right text-red-600">
                    {limitCounters.businessEmail.counter}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Selected Plan Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Selected Plan</h2>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {data.selectedPlan === 'starter' ? 'Bronze Package' :
                     data.selectedPlan === 'plus' ? 'Gold Package' :
                     data.selectedPlan === 'professional' ? 'Platinum Package' : 'Selected Plan'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {data.selectedPlan === 'starter' ? '$29/month' :
                     data.selectedPlan === 'plus' ? '$79/month' :
                     data.selectedPlan === 'professional' ? '$199/month' : 'Custom pricing'}
                  </p>
                  </div>
                <Button variant="outline" size="sm">Change Plan</Button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Setup Fee</span>
                <span className="text-gray-900 dark:text-gray-100">$0.00</span>
            </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Processing Fee</span>
                <span className="text-gray-900 dark:text-gray-100">2.9% + $0.30</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-900 dark:text-gray-100">Total</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {data.selectedPlan === 'starter' ? '$29.00' :
                     data.selectedPlan === 'plus' ? '$79.00' :
                     data.selectedPlan === 'professional' ? '$199.00' : '$0.00'}
                </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Payment Methods</h2>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
        {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => selectPaymentMethod(method.id)}
                  className={`
                    relative p-4 rounded-lg border-2 transition-all duration-200 flex items-center justify-center
                    ${selectedMethod === method.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <div className={`w-8 h-8 ${method.color} rounded flex items-center justify-center text-white font-bold text-sm mr-2`}>
                    {method.logo}
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {method.name}
                  </span>
                  {selectedMethod === method.id && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Payment Details */}
            {selectedMethod && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  {selectedMethod === 'credit-card' ? 'Card Details' : 'GCash Payment'}
                </h3>
                
                {selectedMethod === 'credit-card' ? (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="fullName" className="text-sm">Full Name</Label>
                      <Input
                        id="fullName"
                        placeholder="John Doe"
                        value={cardDetails.fullName}
                        onChange={(e) => handleCardDetailsChange('fullName', e.target.value)}
                        className="mt-1 h-9 text-sm"
                      />
                      {limitCounters.fullName?.isAtLimit && (
                        <p className="text-xs mt-1 text-right text-red-600">{limitCounters.fullName.counter}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="cardNumber" className="text-sm">Card Number</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 1011"
                        value={cardDetails.cardNumber}
                        onChange={(e) => handleCardDetailsChange('cardNumber', e.target.value)}
                        className="mt-1 h-9 text-sm"
                      />
                      {limitCounters.cardNumber?.isAtLimit && (
                        <p className="text-xs mt-1 text-right text-red-600">{limitCounters.cardNumber.counter}</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expDate" className="text-sm">Exp Date</Label>
                        <Input
                          id="expDate"
                          placeholder="MAY"
                          value={cardDetails.expDate}
                          onChange={(e) => handleCardDetailsChange('expDate', e.target.value)}
                          className="mt-1 h-9 text-sm"
                        />
                        {limitCounters.expDate?.isAtLimit && (
                          <p className="text-xs mt-1 text-right text-red-600">{limitCounters.expDate.counter}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="cvv" className="text-sm">CVV</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          value={cardDetails.cvv}
                          onChange={(e) => handleCardDetailsChange('cvv', e.target.value)}
                          className="mt-1 h-9 text-sm"
                        />
                        {limitCounters.cvv?.isAtLimit && (
                          <p className="text-xs mt-1 text-right text-red-600">{limitCounters.cvv.counter}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="saveCard"
                        checked={cardDetails.saveCard}
                        onChange={(e) => handleCardDetailsChange('saveCard', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <Label htmlFor="saveCard" className="text-sm text-gray-700 dark:text-gray-300">
                        Save My Card Details
                      </Label>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="bg-white dark:bg-gray-100 p-8 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 inline-block mb-4">
                      <div className="w-48 h-48 bg-gray-100 dark:bg-gray-200 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-32 h-32 bg-black dark:bg-gray-800 rounded-lg mb-2 mx-auto flex items-center justify-center">
                            <div className="w-24 h-24 bg-white rounded grid grid-cols-3 gap-1 p-2">
                              <div className="bg-black rounded-sm"></div>
                              <div className="bg-black rounded-sm"></div>
                              <div className="bg-black rounded-sm"></div>
                              <div className="bg-black rounded-sm"></div>
                              <div className="bg-black rounded-sm"></div>
                              <div className="bg-black rounded-sm"></div>
                              <div className="bg-black rounded-sm"></div>
                              <div className="bg-black rounded-sm"></div>
                              <div className="bg-black rounded-sm"></div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">QR Code</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Scan this QR code with your GCash app to complete payment
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Amount: {data.selectedPlan === 'starter' ? '$29.00' :
                               data.selectedPlan === 'plus' ? '$79.00' :
                               data.selectedPlan === 'professional' ? '$199.00' : '$0.00'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Payment Features */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Payment Features</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Secure Payment Processing</span>
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">PCI DSS Compliant</span>
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">24/7 Customer Support</span>
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Fraud Protection</span>
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  )
}
