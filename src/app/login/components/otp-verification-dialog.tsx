'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Lock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/providers/auth-provider';
import { authService } from '@/services';

interface OtpVerificationDialogProps {
  children: React.ReactNode;
}

export const OtpVerificationDialog = ({ children }: OtpVerificationDialogProps) => {
  const { login } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [otpToken, setOtpToken] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const router = useRouter();
  const { toast } = useToast();
  const [countdown, setCountdown] = useState(300);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Countdown timer effect
  useEffect(() => {
    if (!isOpen || countdown <= 0) return;

    const interval = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, countdown]);

  // Resend countdown timer effect
  useEffect(() => {
    if (!isOpen || resendCountdown <= 0) return;

    const interval = setInterval(() => {
      setResendCountdown(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, resendCountdown]);

  // Listen for custom event to open modal
  useEffect(() => {
    const handleOpenOtpModal = (event: CustomEvent) => {
      setEmail(event.detail.email);
      setResendCountdown(180); // Start resend countdown immediately when OTP is sent
      setIsOpen(true);
    };

    document.addEventListener('openOtpModal', handleOpenOtpModal as EventListener);

    return () => {
      document.removeEventListener('openOtpModal', handleOpenOtpModal as EventListener);
    };
  }, []);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset all states when modal is closed
      setEmail('');
      setOtp('');
      setOtpToken('');
      setUserId(null);
      setPassword('');
      setConfirmPassword('');
      setOtpError('');
      setPasswordError('');
      setConfirmPasswordError('');
      setCountdown(300); // Reset countdown
      setResendCountdown(0); // Reset resend countdown
      setResendLoading(false); // Reset resend loading
    } else {
      setCountdown(300); // Start countdown when modal opens
      setResendCountdown(180); // Start resend countdown when modal opens (OTP just sent)
    }
  };

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent form submission bubbling

    setOtpError('');

    if (!otp) {
      setOtpError('Please enter the OTP code');
      return;
    }

    setLoading(true);

    try {
      const data = await authService.verifyOtp({ email, otp });

      if (data?.token && data?.user) {
        setOtpToken(data.token);
        setUserId(Number(data.user.id));
        toast({
          title: 'OTP Verified',
          description: 'Please set your new password',
          variant: 'success',
        });
        // Don't close modal, switch to password reset mode
        setOtp('');
        setOtpError('');
      } else {
        toast({
          title: 'Error',
          description: 'OTP verification failed',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Invalid OTP';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setOtpError('');

    try {
      await authService.sendOtp({ email });

      toast({
        title: 'OTP Resent',
        description: 'A new OTP has been sent to your email',
        variant: 'success',
      });

      setCountdown(300); // Reset main countdown
      setResendCountdown(180); // Start 3-minute resend countdown
      setOtp(''); // Clear current OTP input

    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Failed to resend OTP';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setResendLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setPasswordError('');
    setConfirmPasswordError('');

    console.log('Password reset attempt:', { password, confirmPassword, passwordLength: password.length, confirmPasswordLength: confirmPassword.length });

    let hasError = false;

    if (!password) {
      setPasswordError('Please enter a new password');
      hasError = true;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your new password');
      hasError = true;
    }

    if (password && confirmPassword && password !== confirmPassword) {
      console.log('Password mismatch detected:', { password, confirmPassword });
      setConfirmPasswordError('Password confirmation does not match');
      hasError = true;
    }

    if (password && password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);

    try {
      await authService.resetPassword({
        userId: userId!,
        password,
        token: otpToken,
      });

      toast({
        title: 'Success',
        description: 'Password reset successfully! You can now log in with your new password.',
        variant: 'success',
      });

      setIsOpen(false);
      setEmail('');
      setOtp('');
      setOtpToken('');
      setUserId(null);
      setPassword('');
      setConfirmPassword('');
      setOtpError('');
      setPasswordError('');
      setConfirmPasswordError('');

      // Redirect to login page
      router.push('/login');

    } catch (err: any) {
      console.error('Password reset error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to reset password';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>
            {otpToken ? 'Reset Your Password' : 'Enter OTP Code'}
          </DialogTitle>
          <DialogDescription>
            {otpToken
              ? 'OTP verified! Please set your new password.'
              : `We've sent a 6-digit OTP code to ${email}. Please enter it below.`
            }
          </DialogDescription>
        </DialogHeader>

        {!otpToken ? (
          // OTP Input Form
          <form onSubmit={handleOtpVerification} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="otp-code">OTP Code</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="otp-code"
                  name="otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  className="pl-10 text-center tracking-widest text-lg"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                    if (otpError) setOtpError('');
                  }}
                  maxLength={6}
                />
              </div>
              {otpError && <p className="text-red-600 dark:text-red-400 text-xs">{otpError}</p>}
              <p className={`text-[11px] text-right ${countdown > 0 ? 'text-muted-foreground' : 'text-red-600'}`}>
                {countdown > 0 ? `Expires in ${Math.floor(countdown / 60).toString().padStart(2, '0')}:${(countdown % 60).toString().padStart(2, '0')}` : 'OTP Expired'}
              </p>
            </div>
            <div className="space-y-2">
              <Button type="submit" className="w-full" disabled={loading || resendLoading}>
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                    <span className="ml-2">Verifying...</span>
                  </>
                ) : (
                  'Verify OTP'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-xs -mt-1 text-muted-foreground"
                onClick={handleResendOtp}
                disabled={loading || resendLoading || resendCountdown > 0}
              >
                {resendLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                    <span className="ml-2">Sending...</span>
                  </>
                ) : resendCountdown > 0 ? (
                  `Resend OTP in ${Math.floor(resendCountdown / 60).toString().padStart(2, '0')}:${(resendCountdown % 60).toString().padStart(2, '0')}`
                ) : (
                  'Resend OTP'
                )}
              </Button>
            </div>
          </form>
        ) : (
          // Password Reset Form
          <form onSubmit={handlePasswordReset} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="new-password"
                    name="password"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    className="pl-10 pr-10"
                    minLength={8}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              {passwordError && <p className="text-red-600 dark:text-red-400 text-xs">{passwordError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    className="pl-10 pr-10"
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (confirmPasswordError) setConfirmPasswordError('');
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              {confirmPasswordError && <p className="text-red-600 dark:text-red-400 text-xs">{confirmPasswordError}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                  <span className="ml-2">Resetting...</span>
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};