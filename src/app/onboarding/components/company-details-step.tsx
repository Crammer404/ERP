
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RequiredIndicator } from '@/components/ui/required-indicator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState, useEffect, useRef } from 'react'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import '../styles/phone-input-styles.css'
import { isValidEmail, isValidPhone, checkTenantNameAvailability } from '../utils/form-validation'
import { PhilippineAddressForm } from '@/components/forms/address/philippine-address-form'
import { AddressData } from '@/services/address/psgc.service'
import { applyMaxLength, INPUT_LIMITS } from '../utils/input-limits'

interface StoreDetailsStepProps {
  data: any
  onUpdate: (data: any) => void
  onStoreNameValidationChange?: (error: string) => void
}

export function StoreDetailsStep({ data, onUpdate, onStoreNameValidationChange }: StoreDetailsStepProps) {
  const [formData, setFormData] = useState({
    storeName: data.storeName || '',
    address: {
      blockLot: data.blockLot || '',
      street: data.street || '',
      barangay: data.barangay || null, // Full object preserved
      city: data.cityObj || data.city || null, // Use full object if available
      province: data.provinceObj || data.province || null, // Use full object if available
      region: data.regionObj || data.region || null, // Use full object if available
      country: data.country || 'Philippines',
      zipcode: data.zipcode || ''
    } as AddressData,
    contactEmail: data.contactEmail || data.email || '',
    contactPhone: data.contactPhone || ''
  })

  const [emailError, setEmailError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [phoneValue, setPhoneValue] = useState(data.contactPhone || '')
  const [storeNameError, setStoreNameError] = useState('')
  const storeNameTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [limitCounters, setLimitCounters] = useState<Record<string, { counter: string, isAtLimit: boolean }>>({})
  
  // Phone dropdown smart positioning
  const phoneContainerRef = useRef<HTMLDivElement | null>(null)
  const [phoneDropdownUp, setPhoneDropdownUp] = useState(false)
  const PHONE_DROPDOWN_TARGET_PX = 256 // desired dropdown height similar to address selects

  const updatePhoneDropdownDirection = () => {
    const container = phoneContainerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    // Flip up if not enough space below but enough space above
    const shouldFlipUp = spaceBelow < PHONE_DROPDOWN_TARGET_PX && spaceAbove > spaceBelow
    setPhoneDropdownUp(shouldFlipUp)
  }

  useEffect(() => {
    if (storeNameTimeoutRef.current) clearTimeout(storeNameTimeoutRef.current)
    if (formData.storeName) {
      storeNameTimeoutRef.current = setTimeout(async () => {
        const res = await checkTenantNameAvailability(formData.storeName)
        const errorMsg = res.available ? '' : res.message
        setStoreNameError(errorMsg)
        onStoreNameValidationChange?.(errorMsg)
      }, 500)
    } else {
      setStoreNameError('')
      onStoreNameValidationChange?.('')
    }
    return () => {
      if (storeNameTimeoutRef.current) clearTimeout(storeNameTimeoutRef.current)
    }
  }, [formData.storeName, onStoreNameValidationChange])

  // Handle address updates and flatten for backward compatibility
  const handleAddressUpdate = (addressData: AddressData) => {
    const blockLotMax = INPUT_LIMITS.blockLot
    const streetMax = INPUT_LIMITS.street
    const zipcodeMax = INPUT_LIMITS.zipcode
    const { value: blockLot, counter: blockLotCounter, isAtLimit: blockLotAtLimit } = applyMaxLength(addressData.blockLot || '', blockLotMax)
    const { value: street, counter: streetCounter, isAtLimit: streetAtLimit } = applyMaxLength(addressData.street || '', streetMax)
    const { value: zipcode, counter: zipcodeCounter, isAtLimit: zipcodeAtLimit } = applyMaxLength(addressData.zipcode || '', zipcodeMax)
    setLimitCounters(prev => ({ 
      ...prev, 
      blockLot: { counter: blockLotCounter, isAtLimit: blockLotAtLimit },
      street: { counter: streetCounter, isAtLimit: streetAtLimit },
      zipcode: { counter: zipcodeCounter, isAtLimit: zipcodeAtLimit }
    }))

    const limitedAddress = { ...addressData, blockLot, street, zipcode }
    const newFormData = { ...formData, address: limitedAddress }
    setFormData(newFormData)
    
    // Flatten address data for backward compatibility with existing API
    // Also preserve full objects for form state persistence
    const flattenedData = {
      storeName: newFormData.storeName,
      blockLot: blockLot,
      street: street,
      brgy: addressData.barangay?.name || '',
      city: addressData.city?.name || '',
      province: addressData.province?.name || '',
      region: addressData.region?.name || '',
      country: addressData.country,
      zipcode: zipcode,
      contactEmail: newFormData.contactEmail,
      contactPhone: newFormData.contactPhone,
      // Preserve full objects for form state
      barangay: addressData.barangay,
      cityObj: addressData.city,
      provinceObj: addressData.province,
      regionObj: addressData.region
    }
    
    onUpdate(flattenedData)
  }

  useEffect(() => {
    if (formData.contactEmail) {
      const isValid = isValidEmail(formData.contactEmail)
      setEmailError(isValid ? '' : 'Please enter a valid email address')
    } else {
      setEmailError('')
    }
  }, [formData.contactEmail])

  useEffect(() => {
    if (phoneValue) {
      const isValid = isValidPhone(phoneValue)
      setPhoneError(isValid ? '' : 'Please enter a valid phone number')
    } else {
      setPhoneError('')
    }
  }, [phoneValue])

  const handlePhoneChange = (value: string) => {
    const { value: limitedPhone, counter, isAtLimit } = applyMaxLength(value || '', INPUT_LIMITS.phone)
    setPhoneValue(limitedPhone)
    setLimitCounters(prev => ({ ...prev, contactPhone: { counter, isAtLimit } }))
    const newData = { ...formData, contactPhone: limitedPhone }
    setFormData(newData)
    
    // Flatten data for backward compatibility
    const flattenedData = {
      storeName: newData.storeName,
      blockLot: newData.address.blockLot,
      street: newData.address.street,
      brgy: newData.address.barangay?.name || '',
      city: newData.address.city?.name || '',
      province: newData.address.province?.name || '',
      region: newData.address.region?.name || '',
      country: newData.address.country,
      zipcode: newData.address.zipcode,
      contactEmail: newData.contactEmail,
      contactPhone: newData.contactPhone,
      // Preserve full objects for form state
      barangay: newData.address.barangay,
      cityObj: newData.address.city,
      provinceObj: newData.address.province,
      regionObj: newData.address.region
    }
    
    onUpdate(flattenedData)
  }

  const handleInputChange = (field: string, value: string) => {
    let finalValue = value
    const limitsMap: Record<string, number | undefined> = {
      storeName: INPUT_LIMITS.storeName,
      contactEmail: INPUT_LIMITS.contactEmail,
    }
    const max = limitsMap[field]
    if (max) {
      const { value: truncated, counter, isAtLimit } = applyMaxLength(value, max)
      finalValue = truncated
      setLimitCounters(prev => ({ ...prev, [field]: { counter, isAtLimit } }))
    }
    const newData = { ...formData, [field]: finalValue }
    setFormData(newData)
    
    // Flatten data for backward compatibility
    const flattenedData = {
      storeName: newData.storeName,
      blockLot: newData.address.blockLot,
      street: newData.address.street,
      brgy: newData.address.barangay?.name || '',
      city: newData.address.city?.name || '',
      province: newData.address.province?.name || '',
      region: newData.address.region?.name || '',
      country: newData.address.country,
      zipcode: newData.address.zipcode,
      contactEmail: newData.contactEmail,
      contactPhone: newData.contactPhone,
      // Preserve full objects for form state
      barangay: newData.address.barangay,
      cityObj: newData.address.city,
      provinceObj: newData.address.province,
      regionObj: newData.address.region
    }
    
    onUpdate(flattenedData)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-left mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Business Information</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Tell us about your business</p>
      </div>

      <div className="space-y-4">
        {/* Company Information */}
        <div>
          <Label className="text-sm text-gray-900 dark:text-gray-100 font-medium mb-3 block">
            Store Name <RequiredIndicator />
          </Label>
          <div className="space-y-3">
         {/* Store Name - Full Width */}
         <div>
           <Input
             id="storeName"
             type="text"
             placeholder="Enter Your Store Name"
             value={formData.storeName}
             onChange={(e) => handleInputChange('storeName', e.target.value)}
             className="h-9 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
           />
           <div className="flex justify-between items-center mt-1">
             <div className="flex-1">
               {storeNameError && (
                 <p className="text-xs text-red-600">{storeNameError}</p>
               )}
             </div>
             {limitCounters.storeName?.isAtLimit && (
               <p className="text-xs text-red-600">
                 {limitCounters.storeName.counter}
               </p>
             )}
           </div>
         </div>

          </div>
        </div>

        {/* Business Address - Using PSGC API */}
        <div>
          <Label className="text-sm text-gray-900 dark:text-gray-100 font-medium mb-3 block">
            Business Address <RequiredIndicator />
          </Label>
          <PhilippineAddressForm
            data={formData.address}
            onUpdate={handleAddressUpdate}
          />
        </div>

        {/* Contact Info - Two Column */}
        <div>
          <Label className="text-sm text-gray-900 dark:text-gray-100 font-medium mb-3 block">
            Contact Information <RequiredIndicator />
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                id="contactEmail"
                type="email"
                placeholder="Contact Email"
                value={formData.contactEmail}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                className="h-9 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
              />
              <div className="flex justify-between items-center mt-1">
                <div className="flex-1">
                  {emailError && (
                    <p className="text-xs text-red-600">{emailError}</p>
                  )}
                </div>
                {limitCounters.contactEmail?.isAtLimit && (
                  <p className="text-xs text-red-600">
                    {limitCounters.contactEmail.counter}
                  </p>
                )}
              </div>
            </div>

            <div className="phone-input-wrapper" ref={phoneContainerRef}>
              <PhoneInput
                country={'ph'}
                value={phoneValue}
                onChange={handlePhoneChange}
                placeholder="Contact Phone"
                enableSearch={true}
                searchPlaceholder="Search country..."
                containerClass="phone-input-container"
                dropdownStyle={{
                  maxHeight: 256,
                  overflowY: 'auto',
                  // Use fixed positioning flip via top/bottom based on available space
                  position: 'absolute',
                  top: phoneDropdownUp ? 'auto' : '100%',
                  bottom: phoneDropdownUp ? '100%' : 'auto',
                  zIndex: 50
                }}
                onFocus={updatePhoneDropdownDirection}
                onClick={updatePhoneDropdownDirection}
              />
              <div className="flex justify-between items-center mt-1">
                <div className="flex-1">
                  {phoneError && (
                    <p className="text-xs text-red-600">{phoneError}</p>
                  )}
                </div>
                {limitCounters.contactPhone?.isAtLimit && (
                  <p className="text-xs text-red-600">
                    {limitCounters.contactPhone.counter}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
