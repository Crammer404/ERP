import { useState, useEffect } from 'react'

interface OnboardingData {
  currentStep: number
  viewingStep: number
  storeName: string
  storeType: string
  industry: string
  street: string
  brgy: string
  city: string
  province: string
  country: string
  zipcode: string
  primaryColor: string
  logo: string | null
  receiptHeaderMessage: string
  receiptFooterMessage: string
  paymentMethods: string[]
  selectedPlan: string
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  agreeToTerms: boolean
  agreeToMarketing: boolean
}

const ONBOARDING_STORAGE_KEY = 'onboarding-data'

const defaultData: OnboardingData = {
  currentStep: 1,
  viewingStep: 1,
  storeName: '',
  storeType: '',
  industry: '',
  street: '',
  brgy: '',
  city: '',
  province: '',
  country: '',
  zipcode: '',
  primaryColor: '#3B82F6',
  logo: null,
  receiptHeaderMessage: '',
  receiptFooterMessage: '',
  paymentMethods: [],
  selectedPlan: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeToTerms: false,
  agreeToMarketing: false
}

export function useOnboardingPersistence() {
  const [data, setData] = useState<OnboardingData>(defaultData)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY)
      if (stored) {
        const parsedData = JSON.parse(stored)
        setData({ ...defaultData, ...parsedData })
      }
    } catch (error) {
      console.error('Failed to load onboarding data from localStorage:', error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(data))
      } catch (error) {
        console.error('Failed to save onboarding data to localStorage:', error)
      }
    }
  }, [data, isLoaded])

  const updateCurrentStep = (step: number) => {
    setData(prev => ({ ...prev, currentStep: step, viewingStep: step }))
  }

  const updateViewingStep = (step: number) => {
    setData(prev => ({ ...prev, viewingStep: step }))
  }

  const updateOnboardingData = (updates: Partial<Omit<OnboardingData, 'currentStep' | 'viewingStep'>>) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  const clearOnboardingData = () => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY)
    setData(defaultData)
  }

  return {
    data,
    isLoaded,
    updateCurrentStep,
    updateViewingStep,
    updateOnboardingData,
    clearOnboardingData
  }
}
