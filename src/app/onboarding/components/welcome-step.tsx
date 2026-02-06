'use client'

import { useState, useEffect } from 'react'
import { Sparkles } from 'lucide-react'
import { welcomeData, getAlertStyles } from '../data/welcome-data'

export function WelcomeStep() {
  const [isVisible, setIsVisible] = useState(false)
  const [sparkleAnimation, setSparkleAnimation] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    const timer = setTimeout(() => setSparkleAnimation(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="relative min-h-[400px] flex flex-col lg:flex-row lg:items-center w-full gap-8 lg:gap-12">
      {/* Left Section - Text */}
      <div className="w-full lg:flex-1 lg:pr-12">
        <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Welcome Badge */}
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            {welcomeData.badge.text}
          </div>
          
          {/* Main Heading */}
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
            {welcomeData.heading.before}{' '}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {welcomeData.heading.highlight}
            </span>
          </h1>
          
          {/* Sub-text */}
          <p className="text-base text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            {welcomeData.subtitle}
          </p>
        </div>
      </div>

      {/* Right Section - Compact Notification List */}
      <div className="w-full lg:flex-1 relative">
        <div className={`transition-all duration-1500 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
          {/* Compact Notification List */}
          <div className="relative z-10 space-y-2 w-full">
            {welcomeData.keyFeatures.map((feature, index) => {
              const styles = getAlertStyles(feature.type)

              return (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border ${styles.bg} ${styles.border} transition-all duration-300 hover:bg-opacity-80 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                  style={{ transitionDelay: `${300 + index * 100}ms` }}
                >
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className={`w-6 h-6 rounded-full ${styles.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <feature.icon className={`w-3 h-3 ${styles.iconColor}`} />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium text-sm ${styles.titleColor}`}>
                        {feature.title}
                      </h4>
                      <p className={`text-xs ${styles.descColor}`}>
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
