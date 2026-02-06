'use client'

import { Button } from '@/components/ui/button';
import { Check, ArrowRight, Sparkles, Star } from 'lucide-react';
import { pricingPlans } from '../../data/pricing';
import Link from 'next/link';
import { useState } from 'react';
import { BRANDING_CONFIG } from '../../config/brand.config';

export function PricingSection() {
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  return (
    <section className="py-12 lg:py-12 relative pt-20 lg:pt-24">
      {/* Section header */}
          <div className="text-center mb-14">
            <div 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-3 shadow-xl"
              style={{ color: BRANDING_CONFIG.colors.primary }}
            >
              <Sparkles className="h-3 w-3 animate-pulse" />
              Pricing
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Choose the plan that's right for your business. All plans include our core features.
            </p>
          </div>
          
          {/* Pricing cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {pricingPlans.map((plan) => {
            const isHovered = hoveredPlan === plan.id;
            
            return (
              <div 
                key={plan.id}
                onMouseEnter={() => setHoveredPlan(plan.id)}
                onMouseLeave={() => setHoveredPlan(null)}
                className={`
                  relative p-5 rounded-2xl border-2 transition-all duration-500 bg-card/90 backdrop-blur-sm
                  flex flex-col
                  ${plan.popular 
                    ? 'shadow-2xl scale-105 z-10' 
                    : 'border-border shadow-lg hover:shadow-xl'
                  }
                  ${isHovered && !plan.popular ? 'scale-105 -translate-y-2' : ''}
                `}
                style={plan.popular ? {
                  borderColor: BRANDING_CONFIG.colors.primary,
                  boxShadow: `0 25px 50px -12px ${BRANDING_CONFIG.colors.primary}33`
                } : isHovered ? {
                  borderColor: `${BRANDING_CONFIG.colors.primary}4D`
                } : {}}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2">
                    <div 
                      className="flex items-center gap-1 px-2.5 py-0.5 text-white text-xs font-bold rounded-full shadow-lg"
                      style={{ 
                        background: `linear-gradient(to right, ${BRANDING_CONFIG.colors.primary}, ${BRANDING_CONFIG.colors.primaryHover})`
                      }}
                    >
                      <Star className="h-3 w-3 fill-current" />
                      Most Popular
                    </div>
                  </div>
                )}
                
                {/* Plan header */}
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-card-foreground mb-1.5">{plan.name}</h3>
                  <p className="text-muted-foreground text-xs mb-3">{plan.description}</p>
                  
                  {plan.isCustom ? (
                    <div className="text-2xl font-bold text-card-foreground">Custom</div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-card-foreground">${plan.price}</span>
                      <span className="text-muted-foreground text-xs">/{plan.period}</span>
                    </div>
                  )}
                </div>
                
                {/* Divider */}
                <div className="border-t border-border my-3"></div>
                
                {/* Features list - flex-grow pushes button to bottom */}
                <ul className="space-y-2 mb-5 flex-grow">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground text-xs leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {/* CTA Button - stays at bottom */}
                <div className="mt-auto">
                  <Link href={plan.isCustom ? '/contact' : '/signup'}>
                    <Button 
                      className="w-full h-9 text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg"
                      style={{ 
                        backgroundColor: BRANDING_CONFIG.colors.primary
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = BRANDING_CONFIG.colors.primaryHover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = BRANDING_CONFIG.colors.primary;
                      }}
                    >
                      {plan.isCustom ? 'Contact Sales' : plan.id === 'starter' ? 'Get Started Free' : `Start ${plan.name} Plan`}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        
    </section>
  );
}
