'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { getBrandName, getBrandColors } from '@/config/brand.config';
import { BrandLogo } from './brand-logo';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  overlay?: boolean;
  className?: string;
}

export function Loader({ 
  size = 'md', 
  overlay = false, 
  className
}: LoaderProps) {
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl', 
    xl: 'text-2xl'
  };

  const iconSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12'
  };

  const dotSizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2',
    xl: 'w-2.5 h-2.5'
  };

  const loaderContent = (
    <div className={cn(
      "flex items-center justify-center space-x-2",
      className
    )}>
      {/* Brand Logo */}
      <BrandLogo size={size} />

      {/* Company Name */}
      <h2 className={cn(
        "font-bold",
        getBrandColors().primary,
        textSizeClasses[size]
      )}>
        {getBrandName()}
      </h2>

      {/* Loading Dots */}
      <div className="flex space-x-1">
        <div className={cn(
          "rounded-full animate-bounce-delay-1",
          getBrandColors().primary.replace('text-', 'bg-'),
          dotSizeClasses[size]
        )}></div>
        <div className={cn(
          "rounded-full animate-bounce-delay-2",
          getBrandColors().primary.replace('text-', 'bg-'),
          dotSizeClasses[size]
        )}></div>
        <div className={cn(
          "rounded-full animate-bounce-delay-3",
          getBrandColors().primary.replace('text-', 'bg-'),
          dotSizeClasses[size]
        )}></div>
      </div>
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
}

// Add custom animations to your globals.css or create a separate CSS file
export const loaderStyles = `
@keyframes bounce-delay-1 {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

@keyframes bounce-delay-2 {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

@keyframes bounce-delay-3 {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

.animate-bounce-delay-1 {
  animation: bounce-delay-1 1.4s ease-in-out infinite;
}

.animate-bounce-delay-2 {
  animation: bounce-delay-2 1.4s ease-in-out infinite 0.2s;
}

.animate-bounce-delay-3 {
  animation: bounce-delay-3 1.4s ease-in-out infinite 0.4s;
}
`;
