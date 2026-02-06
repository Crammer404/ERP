'use client'

import { CheckCircle, FileText, Store, Palette, CreditCard } from 'lucide-react'

interface Step {
  id: number
  title: string
  subtitle: string
  icon: string
}

interface OnboardingProgressProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (stepId: number) => void
}

// Icon mapping for Lucide icons
const getStepIcon = (stepId: number, isCompleted: boolean, isMobile: boolean = false) => {
  const iconSize = isMobile ? "w-4 h-4" : "w-6 h-6"
  
  if (isCompleted) {
    return <CheckCircle className={iconSize} />
  }
  
  switch (stepId) {
    case 1:
      return <FileText className={iconSize} />
    case 2:
      return <Store className={iconSize} />
    case 3:
      return <Palette className={iconSize} />
    case 4:
      return <FileText className={iconSize} />
    case 5:
      return <CreditCard className={iconSize} />
    case 6:
      return <Store className={iconSize} />
    case 7:
      return <CheckCircle className={iconSize} />
    default:
      return <FileText className={iconSize} />
  }
}

export function OnboardingProgress({ steps, currentStep, onStepClick }: OnboardingProgressProps) {
  return (
    <>
      {/* Desktop Vertical Layout */}
      <div className="hidden md:block">
        <div className="relative">
           {/* Connecting lines - positioned relative to the container, stops at last step */}
           <div className="absolute left-5 top-5 w-0.5 bg-gray-300 dark:bg-gray-600 z-0" 
                style={{ height: `${(steps.length - 1) * 64}px` }} />
           
           {/* Progress line - shows completed steps (including current step) */}
           <div className="absolute left-5 top-5 w-0.5 bg-blue-500 dark:bg-blue-400 z-10" 
                style={{ height: `${Math.max(0, (currentStep - 1) * 64)}px` }} />

          {/* Steps */}
          <div className="space-y-6 relative z-20">
            {steps.map((step, index) => {
              const isCompleted = step.id < currentStep
              const isCurrent = step.id === currentStep
              const isUpcoming = step.id > currentStep

              return (
                <div 
                  key={step.id} 
                  className="flex items-center cursor-pointer transition-all duration-200"
                  onClick={() => isCompleted && onStepClick?.(step.id)}
                >
                  {/* Step Circle */}
                  <div 
                    className={`
                      relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 flex-shrink-0 z-30
                      ${isCompleted 
                        ? 'bg-blue-500 dark:bg-blue-600 border-blue-500 dark:border-blue-600 text-white' 
                        : isCurrent 
                          ? 'bg-blue-500 dark:bg-blue-600 border-blue-500 dark:border-blue-600 text-white' 
                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                      }
                    `}
                  >
                    {getStepIcon(step.id, isCompleted)}
                  </div>

                  {/* Step Text */}
                  <div className="ml-4 flex-1">
                    <div 
                      className={`text-xs font-medium transition-colors ${
                        isCompleted 
                          ? 'text-gray-900 dark:text-gray-100' 
                          : isCurrent 
                            ? 'text-gray-900 dark:text-gray-100 font-bold' 
                            : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {step.title}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Mobile Horizontal Layout - Sticky */}
      <div className="md:hidden w-full px-4 py-8 fixed top-0 left-0 right-0 z-50">
        <div className="relative flex items-end w-full">
          {/* Connecting lines - horizontal - positioned at center of circles */}
          {steps.length > 1 && (
            <>
              <div className="absolute h-0.5 bg-gray-300 dark:bg-gray-600 z-0" 
                   style={{ 
                     top: 'calc(100% - 12px)',
                     left: '12px',
                     right: '12px'
                   }} />
              
              {/* Progress line - horizontal - shows completed steps */}
              <div className="absolute h-0.5 bg-blue-500 dark:bg-blue-400 z-10 transition-all duration-300" 
                   style={{ 
                     top: 'calc(100% - 12px)',
                     left: '12px',
                     width: `calc((100% - 24px) * ${Math.max(0, (currentStep - 1) / (steps.length - 1))})`
                   }} />
            </>
          )}

          {/* Steps */}
          <div className="flex justify-between relative z-20 w-full px-2">
            {steps.map((step, index) => {
              const isCompleted = step.id < currentStep
              const isCurrent = step.id === currentStep
              const isUpcoming = step.id > currentStep

              return (
                <div 
                  key={step.id} 
                  className="flex items-center justify-center cursor-pointer transition-all duration-200 group relative"
                  onClick={() => isCompleted && onStepClick?.(step.id)}
                >

                  {/* Step Circle */}
                  <div 
                    className={`
                      relative w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 border-2 flex-shrink-0 z-30
                      ${isCompleted 
                        ? 'bg-blue-500 dark:bg-blue-600 border-blue-500 dark:border-blue-600 text-white' 
                        : isCurrent 
                          ? 'bg-blue-500 dark:bg-blue-600 border-blue-500 dark:border-blue-600 text-white' 
                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                      }
                    `}
                  >
                    {getStepIcon(step.id, isCompleted, true)}
                  </div>

                  {/* Tooltip */}
                  <div className="absolute top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-40">
                    <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-2 py-1 rounded whitespace-nowrap">
                      {step.title}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-b-2 border-transparent border-b-gray-900 dark:border-b-gray-100"></div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
