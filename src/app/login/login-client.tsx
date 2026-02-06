'use client';

import { Card } from '@/components/ui/card';
import { BgTheme } from '@/components/ui/bg-theme';
import { BrandLogo } from './components/brand-logo';
import { LoginForm } from './components/login-form';
import { OtpVerificationDialog } from './components/otp-verification-dialog';
import { getBrandName, getBrandTagline, getBrandColors } from '@/config/brand.config';
import { cn } from '@/lib/utils';

export function LoginClient() {
  return (
    <BgTheme variant="auto" showGrid={true} showBlobs={false} className="min-h-screen">
      <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2">
        {/* Logo + tagline section */}
        <div className="flex flex-col items-center justify-center p-8 lg:p-16 text-center relative">
          <div className="max-w-md space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl"></div>
                  <BrandLogo />
                </div>
                <h1 className={cn("text-3xl lg:text-4xl font-bold font-headline tracking-tight", getBrandColors().primary)}>
                  {getBrandName()}
                </h1>
              </div>
              <p className={cn("text-base lg:text-lg max-w-sm mx-auto leading-relaxed", getBrandColors().secondary)}>
                {getBrandTagline()}
              </p>
            </div>

            {/* Decorative elements */}
            <div className="flex justify-center space-x-2 opacity-60">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
          </div>
        </div>

        {/* Form section */}
        <div className="flex items-center justify-center p-6 lg:p-16 relative">
          {/* Line divider (desktop only) */}
          <div className="hidden lg:block absolute left-0 h-full py-16">
            <div className="w-[2px] h-full bg-border"></div>
          </div>

          <Card className="w-full max-w-md z-10 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95 border border-blue-500/20 dark:border-blue-500/30 shadow-[0_0_50px_-12px] shadow-blue-500/30 dark:shadow-blue-500/40">
            <LoginForm />
          </Card>
        </div>
      </div>

      {/* OTP Verification Modal */}
      <OtpVerificationDialog>
        <div /> {/* Empty trigger element */}
      </OtpVerificationDialog>
    </BgTheme>
  );
}