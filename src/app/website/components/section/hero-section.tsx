'use client'

import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { BRANDING_CONFIG } from '../../config/brand.config';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16 lg:pt-28 lg:pb-20">
      <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-center w-full">
          {/* Left: Content */}
          <div className="text-center lg:text-left flex flex-col items-center lg:items-start">
            {/* Badge */}
            <div 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-3 transition-colors"
              style={{ 
                backgroundColor: `${BRANDING_CONFIG.colors.primary}15`,
                color: BRANDING_CONFIG.colors.primary
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${BRANDING_CONFIG.colors.primary}25`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = `${BRANDING_CONFIG.colors.primary}15`;
              }}
            >
              <CheckCircle2 className="h-4 w-4" />
              Modern ERP Solution
            </div>
            
            {/* Headline */}
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground mb-3 leading-[1.1] tracking-tight">
              Manage Your Business
              <span style={{ color: BRANDING_CONFIG.colors.primary }}> in One Place</span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-base lg:text-lg text-muted-foreground mb-5 leading-relaxed max-w-2xl">
              {BRANDING_CONFIG.tagline}
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5 w-full sm:w-auto justify-center lg:justify-start">
              <Link href="/onboarding">
                <Button 
                  className="text-white px-6 py-2 transition-all w-full sm:w-auto"
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
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span>14-days free trial</span>
              </div>
            </div>
          </div>
          
          {/* Right: Product Visual/Dashboard Mockup */}
          <div className="flex items-center justify-center lg:ml-4">
            <div className="relative w-full max-w-2xl">
              {/* Gradient background glow */}
              <div 
                className="absolute -inset-4 rounded-3xl blur-3xl"
                style={{ 
                  background: `linear-gradient(to right, ${BRANDING_CONFIG.colors.primary}33, rgba(168, 85, 247, 0.2))`
                }}
              ></div>
              
              {/* Dashboard mockup container */}
              <div className="relative rounded-2xl border-2 border-border shadow-2xl overflow-hidden bg-card p-1">
                <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 min-h-[320px] lg:min-h-[380px] flex items-center justify-center">
                  {/* Placeholder for dashboard screenshot */}
                  <div className="text-center">
                    <div className="mb-4">
                      <div 
                        className="h-16 w-16 rounded-2xl backdrop-blur-sm flex items-center justify-center mx-auto mb-3"
                        style={{ backgroundColor: `${BRANDING_CONFIG.colors.primary}33` }}
                      >
                        <div 
                          className="h-8 w-8 rounded-lg"
                          style={{ backgroundColor: BRANDING_CONFIG.colors.primary }}
                        ></div>
                      </div>
                    </div>
                    <p className="text-slate-400 dark:text-slate-300 text-base mb-2">Dashboard Preview</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">Real-time business insights at your fingertips</p>
                  </div>
                </div>
              </div>
            
            {/* Floating stats cards */}
            <div className="absolute -bottom-3 -left-3 bg-card rounded-lg shadow-lg p-2.5 border border-border hidden lg:block">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-base font-bold text-card-foreground">10K+</p>
                  <p className="text-xs text-muted-foreground">Active Users</p>
                </div>
              </div>
            </div>
            
            <div className="absolute -top-3 -right-3 bg-card rounded-lg shadow-lg p-2.5 border border-border hidden lg:block">
              <div className="flex items-center gap-2">
                <div 
                  className="h-8 w-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${BRANDING_CONFIG.colors.primary}1A` }}
                >
                  <ArrowRight className="h-4 w-4" style={{ color: BRANDING_CONFIG.colors.primary }} />
                </div>
                <div>
                  <p className="text-base font-bold text-card-foreground">99.9%</p>
                  <p className="text-xs text-muted-foreground">Uptime</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
