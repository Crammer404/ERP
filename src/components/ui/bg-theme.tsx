'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

interface BgThemeProps {
  variant?: 'gradient' | 'dark' | 'light' | 'auto';
  showGrid?: boolean;
  showBlobs?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function BgTheme({ 
  variant = 'auto', 
  showGrid = true, 
  showBlobs = true,
  children,
  className = ''
}: BgThemeProps) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Determine effective variant based on theme
  const getEffectiveVariant = () => {
    if (variant === 'auto') {
      const currentTheme = resolvedTheme || theme
      return currentTheme === 'dark' ? 'dark' : 'gradient'
    }
    return variant
  }

  const effectiveVariant = mounted ? getEffectiveVariant() : variant
  
  // If children are provided, wrap them with the background
  if (children) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        {/* Gradient variant - adapts to dark mode */}
        {effectiveVariant === 'gradient' && (
          <>
            {/* Light mode gradient */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900"></div>
            {showGrid && (
              <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            )}
            {showBlobs && (
              <>
                <div className="absolute top-0 left-1/4 w-96 h-96 z-0 bg-blue-300/30 dark:bg-blue-500/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob"></div>
                <div className="absolute top-1/3 right-1/4 w-96 h-96 z-0 bg-purple-300/30 dark:bg-purple-500/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-0 left-1/2 w-96 h-96 z-0 bg-pink-300/30 dark:bg-pink-500/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
                <style jsx>{`
                  @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(20px, -20px) scale(1.1); }
                    50% { transform: translate(-20px, 20px) scale(0.9); }
                    75% { transform: translate(10px, 10px) scale(1.05); }
                  }
                  .animate-blob { animation: blob 20s ease-in-out infinite; }
                  .animation-delay-2000 { animation-delay: 2s; }
                  .animation-delay-4000 { animation-delay: 4s; }
                `}</style>
              </>
            )}
          </>
        )}
        {/* Dark variant */}
        {effectiveVariant === 'dark' && (
          <>
            <div className="absolute inset-0 z-0 bg-slate-900 dark:bg-slate-950"></div>
            {showGrid && (
              <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            )}
          </>
        )}
        {/* Light variant */}
        {effectiveVariant === 'light' && (
          <>
            <div className="absolute inset-0 z-0 bg-white dark:bg-slate-900"></div>
            {showGrid && (
              <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            )}
          </>
        )}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  }
  
  // Original behavior when no children (for backward compatibility)
  
  // Gradient variant - adapts to dark mode
  if (effectiveVariant === 'gradient') {
    return (
      <>
        {/* Gradient mesh background - adapts to theme */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900"></div>
        
        {/* Optional: Grid pattern overlay - adapts to theme */}
        {showGrid && (
          <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        )}
        
        {/* Optional: Animated gradient orbs - adapts to theme */}
        {showBlobs && (
          <>
            <div className="absolute top-0 left-1/4 w-96 h-96 z-0 bg-blue-300/30 dark:bg-blue-500/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob"></div>
            <div className="absolute top-0 right-1/4 w-96 h-96 z-0 bg-purple-300/30 dark:bg-purple-500/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-1/3 w-96 h-96 z-0 bg-pink-300/30 dark:bg-pink-500/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
            
            {/* CSS Animations */}
            <style jsx>{`
              @keyframes blob {
                0%, 100% {
                  transform: translate(0, 0) scale(1);
                }
                25% {
                  transform: translate(20px, -20px) scale(1.1);
                }
                50% {
                  transform: translate(-20px, 20px) scale(0.9);
                }
                75% {
                  transform: translate(10px, 10px) scale(1.05);
                }
              }
              
              .animate-blob {
                animation: blob 20s ease-in-out infinite;
              }
              
              .animation-delay-2000 {
                animation-delay: 2s;
              }
              
              .animation-delay-4000 {
                animation-delay: 4s;
              }
            `}</style>
          </>
        )}
      </>
    );
  }
  
  // Dark variant
  if (effectiveVariant === 'dark') {
    return (
      <>
        {/* Dark background */}
        <div className="absolute inset-0 z-0 bg-slate-900 dark:bg-slate-950"></div>
        
        {/* Grid pattern for dark mode */}
        {showGrid && (
          <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        )}
      </>
    );
  }
  
  // Light variant - adapts to dark mode
  return (
    <>
      {/* White background - adapts to theme */}
      <div className="absolute inset-0 z-0 bg-white dark:bg-slate-900"></div>
      
      {/* Grid pattern - adapts to theme */}
      {showGrid && (
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      )}
    </>
  );
}
