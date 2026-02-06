'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload } from 'lucide-react'
import { useState } from 'react'
import { settingsService } from '@/services/settings/settingsService'
import { DEFAULT_BRANDING_DATA, PRESET_COLORS, SAMPLE_RECEIPT_DATA } from '../data/branding-data'
import { ReceiptTemplate } from '@/components/forms/receipt/receipt-template'
import { applyMaxLength, INPUT_LIMITS } from '../utils/input-limits'

interface BrandingStepProps {
  data: any
  onUpdate: (data: any) => void
}

export function BrandingStep({ data, onUpdate }: BrandingStepProps) {
  const [formData, setFormData] = useState({
    primaryColor: data.primaryColor || DEFAULT_BRANDING_DATA.primaryColor,
    logo: data.logo || DEFAULT_BRANDING_DATA.logo,
    logoFile: data.logoFile || null,
    receiptHeaderMessage: data.receiptHeaderMessage || DEFAULT_BRANDING_DATA.receiptHeaderMessage,
    receiptFooterMessage: data.receiptFooterMessage || DEFAULT_BRANDING_DATA.receiptFooterMessage
  })
  const [limitCounters, setLimitCounters] = useState<Record<string, { counter: string, isAtLimit: boolean }>>({})
  const [logoPreview, setLogoPreview] = useState<string | null>(
    data.logo && typeof data.logo === 'string' ? data.logo : null
  )

  const handleInputChange = (field: string, value: string) => {
    let nextValue = value

    if (field === 'receiptHeaderMessage' || field === 'receiptFooterMessage') {
      const max = field === 'receiptHeaderMessage' ? INPUT_LIMITS.receiptHeaderMessage : INPUT_LIMITS.receiptFooterMessage
      const { value: truncated, counter, isAtLimit } = applyMaxLength(value || '', max)
      nextValue = truncated
      setLimitCounters(prev => ({ ...prev, [field]: { counter, isAtLimit } }))
    }

    const newData = { ...formData, [field]: nextValue }
    setFormData(newData)
    onUpdate(newData)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Store the actual File object
      const newData = { ...formData, logoFile: file, logo: file.name }
      setFormData(newData)
      onUpdate(newData)
      
      // Create preview URL for display
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    const payload = {
      brand_color: formData.primaryColor,
      brand_logo: typeof formData.logo === 'string' ? formData.logo : null,
      brand_banner: null,
      receipt_header: formData.receiptHeaderMessage,
      receipt_footer: formData.receiptFooterMessage,
    }
    try {
      await settingsService.saveBranding(payload)
      // Optional: toast/success UI can be added later
    } catch (err) {
      console.error('Failed to save branding', err)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-left mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Branding</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Customize your brand colors and receipt settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Branding Settings */}
      <div className="space-y-4">
        {/* Logo Upload */}
        <div>
            <Label className="text-sm text-gray-900 dark:text-gray-100 font-medium mb-3 block">
            Logo (Optional)
          </Label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors bg-white dark:bg-gray-800/50">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="logo-upload"
            />
            <label htmlFor="logo-upload" className="cursor-pointer flex flex-col items-center">
              <div className="mb-2 flex items-center justify-center w-full">
                {logoPreview ? (
                  <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <Upload className="w-8 h-8 text-gray-400 dark:text-gray-400" />
                )}
              </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                {logoPreview ? 'Logo uploaded!' : 'Click to upload logo'}
              </p>
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">PNG, JPG, WebP up to 2MB</p>
            </label>
          </div>
          {/* Save Button Removed - auto preview logo */}
        </div>

        {/* Primary Color */}
        <div>
            <Label className="text-sm text-gray-900 dark:text-gray-100 font-medium mb-3 block">
            Primary Color
          </Label>
            <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Input
              id="primaryColor"
              type="color"
              value={formData.primaryColor}
              onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                  className="w-12 h-9 p-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded"
            />
            <Input
              type="text"
              value={formData.primaryColor}
              onChange={(e) => handleInputChange('primaryColor', e.target.value)}
              placeholder="#3B82F6"
                  className="flex-1 h-9 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          {/* Color Presets */}
              <div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">Quick picks:</p>
            <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => handleInputChange('primaryColor', color.value)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    formData.primaryColor === color.value 
                      ? 'border-blue-500 dark:border-white scale-110' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
                </div>
            </div>
          </div>
        </div>

          {/* Receipt Header Message */}
        <div>
            <Label className="text-sm text-gray-900 dark:text-gray-100 font-medium mb-3 block">
              Receipt Header Message
          </Label>
            <Input
              id="receiptHeaderMessage"
              type="text"
              placeholder="Enter header message for receipts"
              value={formData.receiptHeaderMessage}
              onChange={(e) => handleInputChange('receiptHeaderMessage', e.target.value)}
              className="h-9 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
            />
          {limitCounters.receiptHeaderMessage?.isAtLimit && (
            <p className="text-xs mt-1 text-right text-red-600">{limitCounters.receiptHeaderMessage.counter}</p>
          )}
          </div>

          {/* Receipt Footer Message */}
          <div>
            <Label className="text-sm text-gray-900 dark:text-gray-100 font-medium mb-3 block">
              Receipt Footer Message
            </Label>
            <Input
              id="receiptFooterMessage"
              type="text"
              placeholder="Enter footer message for receipts"
              value={formData.receiptFooterMessage}
              onChange={(e) => handleInputChange('receiptFooterMessage', e.target.value)}
              className="h-9 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
            />
          {limitCounters.receiptFooterMessage?.isAtLimit && (
            <p className="text-xs mt-1 text-right text-red-600">{limitCounters.receiptFooterMessage.counter}</p>
          )}
          </div>
        </div>

        {/* Right Column - Receipt Preview */}
        <div>
          <Label className="text-sm text-gray-900 dark:text-gray-100 font-medium mb-3 block">
            Receipt Preview
          </Label>
          {/* Receipt Preview - Using reusable template */}
          <ReceiptTemplate 
            data={{
              ...SAMPLE_RECEIPT_DATA,
              storeName: data.storeName || SAMPLE_RECEIPT_DATA.storeName,
              address: [data.street, data.brgy, data.city, data.province].filter(Boolean).join(', ') || SAMPLE_RECEIPT_DATA.address,
              primaryColor: formData.primaryColor,
              logoUrl: logoPreview || undefined,
              headerMessage: formData.receiptHeaderMessage,
              footerMessages: [formData.receiptFooterMessage || 'Thank you for your purchase!']
            }}
          />
        </div>
      </div>
    </div>
  )
}
