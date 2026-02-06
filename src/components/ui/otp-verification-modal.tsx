'use client'

import { useState, useEffect, useRef } from 'react'
import { Mail } from 'lucide-react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface OtpVerificationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  email: string
  onVerify: (otp: string) => Promise<void>
  onResend: () => Promise<void>
  isVerifying?: boolean
  isResending?: boolean
  error?: string
  resendCountdown?: number
  otpLength?: number
  dismissible?: boolean
}

export function OtpVerificationModal({
  open,
  onOpenChange,
  email,
  onVerify,
  onResend,
  isVerifying = false,
  isResending = false,
  error: externalError,
  resendCountdown = 0,
  otpLength = 6,
  dismissible = true,
}: OtpVerificationModalProps) {
  const [otp, setOtp] = useState<string[]>(Array(otpLength).fill(''))
  const [error, setError] = useState('')
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Reset OTP when modal opens/closes
  useEffect(() => {
    if (open) {
      setOtp(Array(otpLength).fill(''))
      setError('')
      // Focus first input when modal opens
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100)
    }
  }, [open, otpLength])

  // Update error from external prop
  useEffect(() => {
    if (externalError) {
      setError(externalError)
    }
  }, [externalError])

  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/\D/g, '')
    if (numericValue.length > 1) return

    const newOtp = [...otp]
    newOtp[index] = numericValue
    setOtp(newOtp)
    setError('')

    // Auto-focus next input
    if (numericValue && index < otpLength - 1) {
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, otpLength)
    const newOtp = [...otp]
    for (let i = 0; i < otpLength; i++) {
      newOtp[i] = pastedData[i] || ''
    }
    setOtp(newOtp)
    setError('')
    // Focus the last filled input or the last input
    const lastFilledIndex = Math.min(pastedData.length - 1, otpLength - 1)
    otpInputRefs.current[lastFilledIndex]?.focus()
  }

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault()
    const otpString = otp.join('')
    if (!otpString || otpString.length !== otpLength) {
      setError(`Enter the ${otpLength}-digit code sent to your email.`)
      return
    }

    try {
      await onVerify(otpString)
      // Reset on success
      setOtp(Array(otpLength).fill(''))
      setError('')
    } catch (err) {
      // Error handling is done by parent component
    }
  }

  const handleResend = async () => {
    if (isResending || resendCountdown > 0) return
    try {
      await onResend()
      setOtp(Array(otpLength).fill(''))
      setError('')
    } catch (err) {
      // Error handling is done by parent component
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`sm:max-w-md ${!dismissible ? '[&>button]:hidden' : ''}`}
        onInteractOutside={(e) => {
          if (!dismissible) {
            e.preventDefault()
          }
        }}
        onEscapeKeyDown={(e) => {
          if (!dismissible) {
            e.preventDefault()
          }
        }}
      >
        <div className="flex flex-col items-center text-center space-y-6 py-4">
          {/* Envelope Icon */}
          <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Check your email</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enter the verification code sent to <span className="font-medium text-gray-900 dark:text-gray-100">{email}</span>
            </p>
          </div>

          {/* OTP Input Fields */}
          <form onSubmit={handleVerify} className="w-full space-y-6">
            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => {
                    if (el) {
                      otpInputRefs.current[index] = el
                    }
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={index === 0 ? handleOtpPaste : undefined}
                  className="w-12 h-14 text-center text-2xl font-semibold border-2 focus:border-blue-500 focus:ring-blue-500"
                  autoComplete="off"
                />
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            {/* Resend Link */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Didn't get a code?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending || resendCountdown > 0}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? (
                  <span className="inline-flex items-center">
                    Sending...
                  </span>
                ) : resendCountdown > 0 ? (
                  `Resend in ${Math.floor(resendCountdown / 60).toString().padStart(2, '0')}:${(resendCountdown % 60).toString().padStart(2, '0')}`
                ) : (
                  'resend'
                )}
              </button>
            </div>

            {/* Verify Button */}
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
              disabled={isVerifying || otp.join('').length !== otpLength}
            >
              {isVerifying ? 'Verifying...' : 'Verify email'}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

