'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { OnboardingProgress } from './components/onboarding-progress'
import { WelcomeStep } from './components/welcome-step'
import { StoreDetailsStep } from './components/company-details-step'
import { BrandingStep } from './components/branding-step'
import { SelectPlanStep } from './components/select-plan-step'
import { PaymentsStep } from './components/payments-step'
import { CreateAccountStep, CreateAccountStepRef } from './components/create-account-step'
import { CompleteStep } from './components/complete-step'
import { BgTheme } from '@/components/ui/bg-theme'
import { Button } from '@/components/ui/button'
import { ArrowRight, ArrowLeft, CheckCircle, Mail } from 'lucide-react'
import { onboardingService } from '@/services/onboarding/onboardingService'
import { Loader } from '@/components/ui/loader'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { setToken } from '@/services/api'
import { authService } from '@/services'
import { settingsService } from '@/services/settings/settingsService'
import { isValidEmail, isValidPhone, isValidPassword, doPasswordsMatch } from './utils/form-validation'
import { useToast } from '@/hooks/use-toast'

// Temporary state management (replaces persistence hook)
const initialOnboardingData = {
  currentStep: 1,
  viewingStep: 1,
  storeName: '',
  blockLot: '',
  street: '',
  brgy: '',
  city: '',
  province: '',
  region: '',
  country: '',
  zipcode: '',
  primaryColor: '#3B82F6',
  logo: null,
  logoFile: null,
  receiptHeaderMessage: 'Sale Complete',
  receiptFooterMessage: 'Thank you for your purchase!',
  paymentMethods: [],
  paymentMethod: '',
  contactEmail: '',
  contactPhone: '',
  selectedPlan: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeToTerms: false,
  agreeToMarketing: false,
  emailVerified: false,
  branchName: ''
}

const STORAGE_KEY = 'onboarding_data'
const SESSION_KEY = 'onboarding_session'

export default function OnboardingPage() {
  const router = useRouter()
  const pathname = usePathname()
  const { login } = useAuth()
  const { toast } = useToast()
  
  const [onboardingData, setOnboardingData] = useState(initialOnboardingData)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [emailValidationError, setEmailValidationError] = useState<string>('')
  const [storeNameValidationError, setStoreNameValidationError] = useState<string>('')
  const [isRequestingOtp, setIsRequestingOtp] = useState(false)
  const createAccountStepRef = useRef<CreateAccountStepRef>(null)

  // Verify we're on the onboarding page (for SPA reload scenarios)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const actualPath = window.location.pathname;
      const currentPath = pathname || actualPath;
      if (currentPath && !currentPath.startsWith('/onboarding')) {
        // If somehow we're not on onboarding page, don't render
        return;
      }
    }
  }, [pathname]);

  // Load data from sessionStorage on mount
  useEffect(() => {
    // Detect if page was refreshed (hard refresh)
    const navigationEntries = window.performance?.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    const isPageReload = window.performance && 
      (window.performance.navigation.type === 1 || 
       navigationEntries?.[0]?.type === 'reload')
    
    if (isPageReload) {
      // Hard refresh detected - clear all data and start fresh
      sessionStorage.removeItem(STORAGE_KEY)
      sessionStorage.removeItem(SESSION_KEY)
      setIsLoaded(true)
      return
    }
    
    // Not a refresh - check for saved session data
    const sessionFlag = sessionStorage.getItem(SESSION_KEY)
    
    if (sessionFlag === 'active') {
      // Session is active, load saved data
      const savedData = sessionStorage.getItem(STORAGE_KEY)
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData)
          setOnboardingData(parsed)
        } catch (error) {
          console.error('Error loading onboarding data:', error)
        }
      }
    } else {
      // First visit - set session as active
      sessionStorage.setItem(SESSION_KEY, 'active')
    }
    
    setIsLoaded(true)
  }, [])

  // Save data to sessionStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(onboardingData))
    }
  }, [onboardingData, isLoaded])

  const updateCurrentStep = (step: number) => {
    setOnboardingData(prev => ({ ...prev, currentStep: step, viewingStep: step }))
  }

  const updateViewingStep = (step: number) => {
    setOnboardingData(prev => ({ ...prev, viewingStep: step }))
  }

  const updateOnboardingData = (newData: any) => {
    setOnboardingData(prev => ({ ...prev, ...newData }))
  }

  const clearOnboardingData = () => {
    setOnboardingData(initialOnboardingData)
    sessionStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(SESSION_KEY)
  }

  const currentStep = onboardingData.currentStep
  const viewingStep = onboardingData.viewingStep

  const steps = [
    { id: 1, title: 'Welcome', subtitle: 'Get started', icon: '📋' },
    { id: 2, title: 'Create Account', subtitle: 'Account setup', icon: '👤' },
    { id: 3, title: 'Business Info', subtitle: 'Basic info', icon: '🏢' },
    { id: 4, title: 'Branding', subtitle: 'Customize', icon: '🎨' },
    { id: 5, title: 'Select Plan', subtitle: 'Choose plan', icon: '📋' },
    { id: 6, title: 'Payment', subtitle: 'Setup payment', icon: '💳' },
    { id: 7, title: 'Complete', subtitle: 'All done', icon: '✅' }
  ]

  const nextStep = () => {
    if (currentStep < steps.length) {
      updateCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      updateCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = (stepId: number) => {
    if (stepId <= currentStep) {
      updateCurrentStep(stepId)
    }
  }

  const renderStepContent = (stepId: number) => {
    switch (stepId) {
      case 1:
        return <WelcomeStep />
      case 2:
        return <CreateAccountStep 
          ref={createAccountStepRef}
          data={onboardingData} 
          onUpdate={updateOnboardingData}
          onEmailValidationChange={setEmailValidationError}
        />
      case 3:
        return <StoreDetailsStep 
          data={onboardingData} 
          onUpdate={updateOnboardingData}
          onStoreNameValidationChange={setStoreNameValidationError}
        />
      case 4:
        return <BrandingStep 
          data={onboardingData} 
          onUpdate={updateOnboardingData} 
        />
      case 5:
        return <SelectPlanStep 
          data={onboardingData} 
          onUpdate={updateOnboardingData} 
        />
      case 6:
        return <PaymentsStep 
          data={onboardingData} 
          onUpdate={updateOnboardingData} 
        />
      case 7:
        return <CompleteStep 
          data={onboardingData} 
        />
      default:
        return <WelcomeStep />
    }
  }

  const getButtonText = () => {
    if (currentStep === 1) return 'Get Started'
    if (currentStep === 2) {
      // Show "Verify" if email is not verified, "Create Account" if verified
      if (!onboardingData.emailVerified) {
        return 'Verify'
      }
      return 'Create Account'
    }
    if (currentStep === 6) {
      const price = onboardingData.selectedPlan === 'starter' ? '$29.00' :
                   onboardingData.selectedPlan === 'plus' ? '$79.00' :
                   onboardingData.selectedPlan === 'professional' ? '$199.00' : '$0.00'
      return `Complete Payment - ${price}`
    }
    if (currentStep === steps.length) return 'Complete'
    return 'Continue'
  }

  const isFormValid = () => {
    switch (currentStep) {
      case 2:
        // Only block form submission if email is already registered, not other validation errors
        const isEmailAlreadyRegistered = emailValidationError && 
          emailValidationError.toLowerCase().includes('already registered')
        
        return onboardingData.firstName && 
               onboardingData.lastName && 
               onboardingData.email && 
               isValidEmail(onboardingData.email) &&
               onboardingData.password && 
               onboardingData.confirmPassword &&
               isValidPassword(onboardingData.password) &&
               doPasswordsMatch(onboardingData.password, onboardingData.confirmPassword) &&
               onboardingData.agreeToTerms &&
               !isEmailAlreadyRegistered
      case 3:
        return onboardingData.storeName &&
               onboardingData.brgy &&
               onboardingData.city &&
               onboardingData.province &&
               onboardingData.country &&
               onboardingData.zipcode &&
               onboardingData.contactEmail &&
               isValidEmail(onboardingData.contactEmail) &&
               onboardingData.contactPhone &&
               isValidPhone(onboardingData.contactPhone) &&
               !storeNameValidationError
      case 5:
        return onboardingData.selectedPlan !== ''
      case 6:
        return onboardingData.paymentMethod && onboardingData.paymentMethod !== ''
      default:
        return true
    }
  }

  const handleButtonClick = async () => {
    // For step 2 (Create Account), check if email is verified
    // If not verified, trigger OTP modal instead of proceeding
    if (currentStep === 2) {
      if (!onboardingData.emailVerified) {
        // Only block if email is already registered (not other errors like network issues)
        // Let the child component handle email format validation
        if (emailValidationError && emailValidationError.toLowerCase().includes('already registered')) {
          toast({
            title: 'Email already registered',
            description: emailValidationError,
            variant: 'destructive',
          })
          return
        }
        // Check if already requesting OTP to prevent spam
        if (isRequestingOtp) {
          return
        }
        // Trigger OTP modal and send OTP - let child component handle all validation
        setIsRequestingOtp(true)
        try {
          if (createAccountStepRef.current) {
            await createAccountStepRef.current.requestOtpVerification()
          }
        } finally {
          setIsRequestingOtp(false)
        }
        return
      }
    }

    if (currentStep === steps.length) {
      // Handle completion - submit to API
      await handleCompleteOnboarding()
    } else {
      nextStep()
    }
  }

  const handleCompleteOnboarding = async () => {
    setIsSubmitting(true)
    setSubmissionError(null)

    try {
      // Prepare FormData for multipart/form-data submission
      const formData = new FormData()
      
      // User Account
      formData.append('first_name', onboardingData.firstName)
      formData.append('middle_name', '')
      formData.append('last_name', onboardingData.lastName)
      formData.append('email', onboardingData.email)
      formData.append('password', onboardingData.password)
      formData.append('password_confirmation', onboardingData.confirmPassword)
      
      // Tenant/Business Information
      formData.append('tenant_name', onboardingData.storeName)
      formData.append('tenant_email', onboardingData.contactEmail || onboardingData.email)
      formData.append('tenant_phone', onboardingData.contactPhone)
      
      // Tenant Address (Business Address) - Laravel accepts nested data with [key] notation
      formData.append('tenant_address[country]', onboardingData.country || 'Philippines')
      formData.append('tenant_address[postal_code]', onboardingData.zipcode)
      formData.append('tenant_address[region]', onboardingData.region || '')
      formData.append('tenant_address[province]', onboardingData.province)
      formData.append('tenant_address[city]', onboardingData.city)
      formData.append('tenant_address[barangay]', onboardingData.brgy || '')
      formData.append('tenant_address[block_lot]', onboardingData.blockLot || '')
      formData.append('tenant_address[street]', onboardingData.street || '')
      
      // Branch Name
      formData.append('branch_name', onboardingData.branchName || `${onboardingData.storeName} - Main Branch`)
      
      // Additional onboarding fields
      formData.append('primary_color', onboardingData.primaryColor)
      
      // Brand logo - append File object if exists
      if (onboardingData.logoFile && (onboardingData.logoFile as any) instanceof File) {
        formData.append('brand_logo', onboardingData.logoFile as File)
      }
      
      formData.append('receipt_header_message', onboardingData.receiptHeaderMessage)
      formData.append('receipt_footer_message', onboardingData.receiptFooterMessage)
      formData.append('selected_plan', onboardingData.selectedPlan)

      console.log('Submitting onboarding data with FormData')
      
      // Submit to API with FormData
      const response = await onboardingService.complete(formData as any)
      
      console.log('Onboarding completed successfully:', response)
      
      // Store the authentication token
      setToken(response.token)
      
      // Branding settings are now included in the main onboarding transaction

      // Fetch full user data with permissions from /me endpoint
      const userData = await authService.refreshUserData()
      
      if (!userData) {
        throw new Error('Failed to fetch user data after onboarding')
      }
      
      console.log('User data loaded with permissions:', userData)
      
      // Set user in auth context with full data including permissions
      login(userData)
      
      // Clear onboarding data
      clearOnboardingData()
      
    } catch (error: any) {
      console.error('Onboarding submission error:', error)
      
      // Extract error message
      let errorMessage = 'Failed to complete onboarding. Please try again.'
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        const errors = error.response.data.errors
        errorMessage = Object.values(errors).flat().join(', ')
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setSubmissionError(errorMessage)
      toast({
        title: 'Onboarding failed',
        description: errorMessage,
        variant: 'destructive',
      })
      setIsSubmitting(false)
    }
  }

  // Render only the current step with fade transition
  const renderCurrentStep = () => {
    return (
      <div 
        key={`step-${currentStep}`}
        className="animate-in fade-in duration-300"
      >
        {renderStepContent(currentStep)}
      </div>
    )
  }

  // Don't render until data is loaded
  if (!isLoaded) {
    return (
      <BgTheme variant="auto" showBlobs={false} className="min-h-screen">
        <div className="flex items-center justify-center h-screen">
          <Loader size="lg" />
        </div>
      </BgTheme>
    )
  }

  return (
    <BgTheme variant="auto" showBlobs={false} className="min-h-screen">
      {/* Mobile Progress - Top */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 py-4">
        <div className="flex justify-center">
          <OnboardingProgress 
            steps={steps} 
            currentStep={currentStep} 
            onStepClick={handleStepClick}
          />
        </div>
      </div>

      {/* Desktop: Container that keeps progress bar and content together */}
      <div className="min-h-screen flex items-center justify-center py-8 px-4 md:pt-8 pt-32">
        <div className="flex gap-8 items-center justify-center w-full max-w-7xl mx-auto">
          {/* Left Sidebar - Progress Indicator */}
          <div className="hidden md:flex flex-shrink-0">
            <OnboardingProgress 
              steps={steps} 
              currentStep={currentStep} 
              onStepClick={handleStepClick}
            />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col justify-center space-y-6 max-w-3xl">
            {/* Content */}
            <div className="w-full">
              {renderCurrentStep()}
            </div>

            {/* Navigation Buttons */}
            <div className={`flex gap-3 pt-4 ${currentStep === 1 ? 'justify-end' : 'justify-between'}`}>
              {currentStep > 1 && (
                <Button 
                  onClick={prevStep}
                  variant="outline"
                  size="sm"
                  className="px-4 py-2 text-sm font-medium"
                >
                  <ArrowLeft className="mr-2 w-3.5 h-3.5" />
                  Previous
                </Button>
              )}
              <Button 
                onClick={handleButtonClick}
                disabled={!isFormValid() || isSubmitting || isRequestingOtp}
                size="sm"
                className={`${
                  currentStep === 6 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white px-5 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {getButtonText()}
                {currentStep === steps.length ? (
                  <CheckCircle className="ml-2 w-3.5 h-3.5" />
                ) : currentStep === 2 && !onboardingData.emailVerified ? (
                  <Mail className="ml-2 w-3.5 h-3.5" />
                ) : (
                  <ArrowRight className="ml-2 w-3.5 h-3.5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </BgTheme>
  )
}