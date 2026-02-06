'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RequiredIndicator } from '@/components/ui/required-indicator'
import { Button } from '@/components/ui/button'
import { useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { OtpVerificationModal } from '@/components/ui/otp-verification-modal'
import { useToast } from '@/hooks/use-toast'
import { onboardingService } from '@/services/onboarding/onboardingService'
import { 
  isValidEmail, 
  isValidPassword, 
  doPasswordsMatch, 
  checkEmailAvailability as checkEmail 
} from '../utils/form-validation'
import { applyMaxLength, INPUT_LIMITS } from '../utils/input-limits'

interface CreateAccountStepProps {
  data: any
  onUpdate: (data: any) => void
  onEmailValidationChange?: (error: string) => void
}

export interface CreateAccountStepRef {
  requestOtpVerification: () => Promise<void>
  isRequestingOtp: boolean
}

export const CreateAccountStep = forwardRef<CreateAccountStepRef, CreateAccountStepProps>(
  ({ data, onUpdate, onEmailValidationChange }, ref) => {
  const [formData, setFormData] = useState({
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    email: data.email || '',
    password: data.password || '',
    confirmPassword: data.confirmPassword || '',
    agreeToTerms: data.agreeToTerms || false,
    agreeToMarketing: data.agreeToMarketing || false
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const emailCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [limitCounters, setLimitCounters] = useState<Record<string, { counter: string, isAtLimit: boolean }>>({})
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false)
  const [isRequestingOtp, setIsRequestingOtp] = useState(false)
  const [isResendingOtp, setIsResendingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [resendCountdown, setResendCountdown] = useState(0)
  const { toast } = useToast()
  const emailVerified = data.emailVerified ?? false
  const emailInputRef = useRef<HTMLInputElement>(null)

  const checkEmailAvailability = useCallback(async (email: string) => {
    if (!isValidEmail(email)) {
      setEmailError('')
      onEmailValidationChange?.('')
      return
    }

    setIsCheckingEmail(true)
    setEmailError('')
    onEmailValidationChange?.('')

    try {
      const result = await checkEmail(email)

      if (!result.available) {
        setEmailError(result.message)
        onEmailValidationChange?.(result.message)
      }
    } catch (error) {
      console.error('Error checking email:', error)
      const errorMsg = 'Unable to verify email availability'
      setEmailError(errorMsg)
      onEmailValidationChange?.(errorMsg)
    } finally {
      setIsCheckingEmail(false)
    }
  }, [onEmailValidationChange])

  // Sync formData with data prop when it changes (e.g., from sessionStorage restore)
  useEffect(() => {
    setFormData({
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      email: data.email || '',
      password: data.password || '',
      confirmPassword: data.confirmPassword || '',
      agreeToTerms: data.agreeToTerms || false,
      agreeToMarketing: data.agreeToMarketing || false
    })
  }, [data.firstName, data.lastName, data.email, data.password, data.confirmPassword, data.agreeToTerms, data.agreeToMarketing])

  useEffect(() => {
    if (emailCheckTimeoutRef.current) {
      clearTimeout(emailCheckTimeoutRef.current)
    }

    if (formData.email) {
      emailCheckTimeoutRef.current = setTimeout(() => {
        checkEmailAvailability(formData.email)
      }, 500)
    } else {
      setEmailError('')
      onEmailValidationChange?.('')
    }

    return () => {
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current)
      }
    }
  }, [formData.email, checkEmailAvailability, onEmailValidationChange])

  useEffect(() => {
    if (!isOtpModalOpen) return
    if (resendCountdown <= 0) return

    const timer = setInterval(() => {
      setResendCountdown(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [isOtpModalOpen, resendCountdown])

  const handleInputChange = (field: string, value: string | boolean) => {
    let finalValue: string | boolean = value
    if (typeof value === 'string') {
      const limitsMap: Record<string, number | undefined> = {
        firstName: INPUT_LIMITS.firstName,
        lastName: INPUT_LIMITS.lastName,
        email: INPUT_LIMITS.email,
        password: INPUT_LIMITS.password,
        confirmPassword: INPUT_LIMITS.confirmPassword,
      }
      const max = limitsMap[field]
      if (max) {
        const { value: truncated, counter, isAtLimit } = applyMaxLength(value, max)
        finalValue = truncated
        setLimitCounters(prev => ({ ...prev, [field]: { counter, isAtLimit } }))
      }
    }
    const newData = { ...formData, [field]: finalValue }
    setFormData(newData)
    const payload = field === 'email' ? { ...newData, emailVerified: false } : newData
    if (field === 'email') {
      setIsOtpModalOpen(false)
      setIsRequestingOtp(false)
      setOtpError('')
      setResendCountdown(0)
    }
    onUpdate(payload)
  }

  const handleRequestOtp = useCallback(async (isResend = false) => {
    // Get email from multiple sources to ensure we have the latest value
    // 1. Try formData.email (most up-to-date local state)
    // 2. Try data.email (from parent state)
    // 3. Try reading directly from input element (fallback for edge cases)
    // 4. Trim whitespace to handle any accidental spaces
    const emailFromInput = emailInputRef.current?.value || ''
    const email = (formData.email || data.email || emailFromInput || '').trim()
    
    // Debug logging to help identify the issue
    console.log('handleRequestOtp called:', {
      formDataEmail: formData.email,
      dataEmail: data.email,
      inputEmail: emailFromInput,
      finalEmail: email,
      emailLength: email.length
    })
    
    // Check if email is empty or invalid format
    if (!email || email.length === 0) {
      console.error('Email validation failed - email is empty:', {
        formDataEmail: formData.email,
        dataEmail: data.email,
        inputEmail: emailFromInput,
        formData: formData,
        data: data
      })
      toast({
        title: 'Email required',
        description: 'Please enter your email address.',
        variant: 'destructive',
      })
      return
    }
    
    if (!isValidEmail(email)) {
      toast({
        title: 'Invalid email format',
        description: 'Please enter a valid email address (e.g., name@example.com).',
        variant: 'destructive',
      })
      return
    }
    
    // Only block if email is already registered (from availability check)
    // Other errors (network issues, etc.) should not block OTP flow
    if (emailError && emailError.toLowerCase().includes('already registered')) {
      toast({
        title: 'Email already registered',
        description: emailError,
        variant: 'destructive',
      })
      return
    }
    
    // Email availability check is optional and runs in background
    // If it's still running or failed, we can still proceed with OTP
    // The backend will handle duplicate email checks during actual registration
    if (emailError && emailError.includes('Unable to verify')) {
      console.warn('Email availability check failed, but proceeding with OTP:', emailError)
    }

    if (isResend) {
      setIsResendingOtp(true)
    } else {
      setIsRequestingOtp(true)
    }

    try {
      await onboardingService.sendOtp(email)
      toast({
        title: 'OTP sent',
        description: `We sent a 6-digit code to ${email}.`,
        variant: 'success',
      })
      setIsOtpModalOpen(true)
      setResendCountdown(180)
      setOtpError('')
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to send OTP'
      toast({
        title: 'Unable to send OTP',
        description: message,
        variant: 'destructive',
      })
    } finally {
      if (isResend) {
        setIsResendingOtp(false)
      } else {
        setIsRequestingOtp(false)
      }
    }
  }, [formData.email, data.email, emailError, toast])

  // Expose method and state to parent component via ref
  useImperativeHandle(ref, () => ({
    requestOtpVerification: async () => {
      await handleRequestOtp(false)
    },
    isRequestingOtp
  }), [isRequestingOtp, handleRequestOtp])

  const handleVerifyOtp = async (otp: string) => {
    setIsVerifyingOtp(true)
    setOtpError('')
    // Use data.email as source of truth (from parent state), fallback to formData.email
    const email = data.email || formData.email
    try {
      await onboardingService.verifyOtp(email, otp)
      toast({
        title: 'Email verified',
        description: 'Thanks! Your email address is confirmed.',
        variant: 'success',
      })
      onUpdate({ ...formData, emailVerified: true })
      setIsOtpModalOpen(false)
      setOtpError('')
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Invalid or expired OTP'
      setOtpError(message)
      throw error // Re-throw so modal can handle it
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const handleResendOtp = async () => {
    setIsResendingOtp(true)
    setOtpError('')
    // Use data.email as source of truth (from parent state), fallback to formData.email
    const email = data.email || formData.email
    try {
      await onboardingService.sendOtp(email)
      toast({
        title: 'OTP sent',
        description: `We sent a 6-digit code to ${email}.`,
        variant: 'success',
      })
      setResendCountdown(180)
      setOtpError('')
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to send OTP'
      setOtpError(message)
      throw error // Re-throw so modal can handle it
    } finally {
      setIsResendingOtp(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-left mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Create Your Account</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Set up your account to get started</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName" className="text-sm text-gray-900 dark:text-gray-100 font-medium mb-1.5 block">
              First Name <RequiredIndicator />
            </Label>
            <Input
              id="firstName"
              type="text"
              placeholder="John"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className="h-9 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
            />
            {limitCounters.firstName?.isAtLimit && (
              <p className="text-xs mt-1 text-right text-red-600">
                {limitCounters.firstName.counter}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="lastName" className="text-sm text-gray-900 dark:text-gray-100 font-medium mb-1.5 block">
              Last Name <RequiredIndicator />
            </Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Doe"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className="h-9 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
            />
            {limitCounters.lastName?.isAtLimit && (
              <p className="text-xs mt-1 text-right text-red-600">
                {limitCounters.lastName.counter}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="email" className="text-sm text-gray-900 dark:text-gray-100 font-medium mb-1.5 block">
            Email Address <RequiredIndicator />
          </Label>
          <Input
            ref={emailInputRef}
            id="email"
            type="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`h-9 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 ${
              emailError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            }`}
          />
          <div className="flex justify-between items-center mt-1">
            <div className="flex-1">
              {isCheckingEmail && (
                <p className="text-xs text-gray-500">Checking email availability...</p>
              )}
              {emailError && !isCheckingEmail && (
                <p className="text-xs text-red-600">{emailError}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {limitCounters.email?.isAtLimit && (
                <p className="text-xs text-red-600">
                  {limitCounters.email.counter}
                </p>
              )}
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="password" className="text-sm text-gray-900 dark:text-gray-100 font-medium mb-1.5 block">
            Password <RequiredIndicator />
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="h-9 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex justify-between items-center mt-1">
            <div className="flex-1">
              {formData.password && (
                <p className={`text-xs ${isValidPassword(formData.password) ? 'text-green-600' : 'text-red-600'}`}>
                  Password must be at least 8 characters long
                </p>
              )}
            </div>
            {limitCounters.password?.isAtLimit && (
              <p className="text-xs text-red-600">
                {limitCounters.password.counter}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="confirmPassword" className="text-sm text-gray-900 dark:text-gray-100 font-medium mb-1.5 block">
            Confirm Password <RequiredIndicator />
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className="h-9 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex justify-between items-center mt-1">
            <div className="flex-1">
              {formData.confirmPassword && (
                <p className={`text-xs ${doPasswordsMatch(formData.password, formData.confirmPassword) ? 'text-green-600' : 'text-red-600'}`}>
                  {doPasswordsMatch(formData.password, formData.confirmPassword) ? 'Passwords match' : 'Passwords do not match'}
                </p>
              )}
            </div>
            {limitCounters.confirmPassword?.isAtLimit && (
              <p className="text-xs text-red-600">
                {limitCounters.confirmPassword.counter}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start">
            <input
              id="agreeToTerms"
              type="checkbox"
              checked={formData.agreeToTerms}
              onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="agreeToTerms" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              I agree to the{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
                Privacy Policy
              </a>{' '}
              <RequiredIndicator />
            </label>
          </div>

          <div className="flex items-start">
            <input
              id="agreeToMarketing"
              type="checkbox"
              checked={formData.agreeToMarketing}
              onChange={(e) => handleInputChange('agreeToMarketing', e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="agreeToMarketing" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              I would like to receive marketing emails and updates
            </label>
          </div>
        </div>
      </div>
      <OtpVerificationModal
        open={isOtpModalOpen}
        onOpenChange={(open) => {
          // Prevent closing the modal - only allow it to close after successful verification
          if (open) {
            setIsOtpModalOpen(open)
          }
          // Don't reset state when trying to close - modal should stay open
        }}
        email={data.email || formData.email}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
        isVerifying={isVerifyingOtp}
        isResending={isResendingOtp}
        error={otpError}
        resendCountdown={resendCountdown}
        otpLength={6}
        dismissible={false}
      />
    </div>
  )
})

CreateAccountStep.displayName = 'CreateAccountStep'
