'use client'

import { useState } from 'react';
import { Users, Package, ShoppingCart, BarChart3, Building2, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { features } from '../../data/features';
import { BRANDING_CONFIG } from '../../config/brand.config';

const iconMap = {
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  Building2,
  Zap
};

const colorMap = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'group-hover:border-blue-200 dark:group-hover:border-blue-800'
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/30',
    text: 'text-green-600 dark:text-green-400',
    border: 'group-hover:border-green-200 dark:group-hover:border-green-800'
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/30',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'group-hover:border-purple-200 dark:group-hover:border-purple-800'
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/30',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'group-hover:border-orange-200 dark:group-hover:border-orange-800'
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/30',
    text: 'text-red-600 dark:text-red-400',
    border: 'group-hover:border-red-200 dark:group-hover:border-red-800'
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/30',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'group-hover:border-indigo-200 dark:group-hover:border-indigo-800'
  }
};

export function FeaturesSection() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <section className="py-20 relative">
      {/* Section header */}
      <div className="text-center mb-12">
        <div 
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-3 shadow-xl"
          style={{ color: BRANDING_CONFIG.colors.primary }}
        >
          <Sparkles className="h-3 w-3 animate-pulse" />
          Features
        </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 tracking-tight">
            Everything you need
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Powerful tools designed for modern businesses
          </p>
        </div>
        
        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => {
            const IconComponent = iconMap[feature.icon as keyof typeof iconMap];
            const colors = colorMap[feature.color as keyof typeof colorMap];
            const isHovered = hoveredCard === feature.id;
            
            return (
              <div 
                key={feature.id}
                onMouseEnter={() => setHoveredCard(feature.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`group relative p-5 rounded-2xl border-2 bg-card/80 backdrop-blur-sm transition-all duration-500 cursor-pointer overflow-hidden
                  ${isHovered ? 'shadow-2xl -translate-y-2 scale-105' : 'border-border hover:border-border/60 shadow-md'}
                `}
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.6s ease-out forwards',
                  ...(isHovered ? {
                    borderColor: `${BRANDING_CONFIG.colors.primary}66`,
                    boxShadow: `0 25px 50px -12px ${BRANDING_CONFIG.colors.primary}33`
                  } : {})
                }}
              >
                {/* Gradient shine effect on hover */}
                <div 
                  className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  style={{
                    background: `linear-gradient(to bottom right, ${BRANDING_CONFIG.colors.primary}0D, rgba(168, 85, 247, 0.05), rgba(236, 72, 153, 0.05))`
                  }}
                ></div>
                
                {/* Animated border glow */}
                {isHovered && (
                  <div 
                    className="absolute inset-0 rounded-2xl blur-xl -z-10"
                    style={{
                      background: `linear-gradient(to right, ${BRANDING_CONFIG.colors.primary}33, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))`
                    }}
                  ></div>
                )}
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Icon with rotation on hover */}
                  <div className={`${colors.bg} h-10 w-10 rounded-xl flex items-center justify-center mb-3 transition-all duration-500 ${isHovered ? 'scale-110 rotate-6' : ''}`}>
                    <IconComponent className={`h-5 w-5 ${colors.text} transition-all duration-300 ${isHovered ? 'scale-110' : ''}`} />
                  </div>
                  
                  {/* Title with slide animation */}
                  <h3 
                    className={`text-base font-semibold mb-2 transition-all duration-300 text-card-foreground`}
                    style={{ color: isHovered ? BRANDING_CONFIG.colors.primary : undefined }}
                  >
                    {feature.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                    {feature.description}
                  </p>
                  
                  {/* Animated arrow with slide effect */}
                  <div 
                    className={`flex items-center transition-all duration-300 ${isHovered ? 'opacity-100 translate-x-2' : 'opacity-0 translate-x-0'}`}
                    style={{ color: BRANDING_CONFIG.colors.primary }}
                  >
                    <span className="text-xs font-medium mr-1">Learn more</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
                
                {/* Corner accent */}
                <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${colors.bg} rounded-bl-full opacity-0 group-hover:opacity-30 transition-opacity duration-500 -z-0`}></div>
              </div>
            );
          })}
      </div>
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
