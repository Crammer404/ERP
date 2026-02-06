'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { getBrandLogo } from '@/config/brand.config';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animated?: boolean;
}

export function BrandLogo({ 
  size = 'md', 
  className,
  animated = false
}: BrandLogoProps) {
  const logo = getBrandLogo();
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-10 w-10'
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={logo.viewBox}
      className={cn(
        "text-primary shrink-0",
        sizeClasses[size],
        animated && "animate-pulse",
        className
      )}
    >
      <rect width="256" height="256" fill="none"/>
      {logo.paths.map((path, index) => (
        <path
          key={index}
          d={path.d}
          fill={path.fill}
          stroke={path.stroke}
          strokeLinecap={path.strokeLinecap}
          strokeLinejoin={path.strokeLinejoin}
          strokeWidth={path.strokeWidth}
        />
      ))}
    </svg>
  );
}
