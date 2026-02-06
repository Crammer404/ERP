'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/services';

interface ForgotPasswordDialogProps {
  children: React.ReactNode;
}

export const ForgotPasswordDialog = ({ children }: ForgotPasswordDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const { toast } = useToast();

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent form submission bubbling

    setEmailError('');

    if (!email) {
      setEmailError('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      await authService.sendOtp({ email });
      toast({
        title: 'OTP Sent',
        description: 'Please check your email for the OTP code',
        variant: 'success',
      });
      setIsOpen(false);
      setEmail('');
      // Open OTP verification modal
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent('openOtpModal', { detail: { email } }));
      }, 100);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Failed to send OTP';
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset Your Password</DialogTitle>
          <DialogDescription>
            Enter your email address and we'll send you an OTP to get back into your account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleResetRequest} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="reset-email"
                type="email"
                placeholder="Enter your email"
                className="pl-10"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                }}
              />
            </div>
            {emailError && <p className="text-red-600 dark:text-red-400 text-xs">{emailError}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                <span className="ml-2">Sending...</span>
              </>
            ) : (
              'Send OTP'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};