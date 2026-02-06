import { Users, Target, Award, CheckCircle2 } from 'lucide-react';
import { BRANDING_CONFIG } from '../../config/brand.config';
import { Sparkles } from 'lucide-react';

export function AboutSection() {
  const values = [
    {
      icon: Users,
      title: 'Our Mission',
      description: 'To empower businesses with technology that simplifies complex operations and drives sustainable growth.',
      color: 'blue'
    },
    {
      icon: Target,
      title: 'Our Vision',
      description: 'To be the leading provider of ERP solutions that transform how businesses manage their operations.',
      color: 'green'
    },
    {
      icon: Award,
      title: 'Our Values',
      description: 'Innovation, reliability, and customer success are at the core of everything we do.',
      color: 'purple'
    }
  ];

  const benefits = [
    'Proven track record with 10,000+ satisfied customers',
    '24/7 customer support and dedicated account managers',
    'Scalable solutions that grow with your business',
    'Advanced security and compliance features',
    'Regular updates and new feature releases',
    'Comprehensive training and onboarding'
  ];

  return (
    <section className="py-20 lg:py-24 relative">
      {/* Section header */}
        <div className="text-center mb-16">
          <div 
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-3 shadow-xl"
            style={{ color: BRANDING_CONFIG.colors.primary }}
          >
            <Sparkles className="h-3 w-3 animate-pulse" />
            About Us
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Built for modern businesses
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            We've built a comprehensive ERP solution that helps businesses of all sizes 
            streamline their operations and grow efficiently.
          </p>
        </div>
        
        {/* Values grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
            {values.map((value, index) => {
            const Icon = value.icon;
            const colorClasses = {
              blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
              green: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
              purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
            };
            
            return (
              <div key={index} className="text-center">
                <div className={`${colorClasses[value.color as keyof typeof colorClasses]} h-12 w-12 rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {value.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {value.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Why choose us section */}
        <div className="bg-card rounded-3xl p-6 md:p-10 border-2 border-border">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h3 className="text-2xl font-bold text-card-foreground mb-5">
                Why choose {BRANDING_CONFIG.name}?
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground leading-relaxed text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div 
              className="rounded-2xl p-6"
              style={{
                background: `linear-gradient(to bottom right, ${BRANDING_CONFIG.colors.primary}0D, rgba(168, 85, 247, 0.05))`
              }}
            >
              <h4 className="text-xl font-bold text-card-foreground mb-3">Our Story</h4>
              <p className="text-muted-foreground leading-relaxed mb-3 text-sm">
                Founded in 2020, we started with a simple mission: to make enterprise 
                software accessible and easy to use for businesses of all sizes.
              </p>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Today, we serve companies across various industries, helping them streamline 
                operations and achieve their business goals with cutting-edge technology.
              </p>
            </div>
          </div>
      </div>
    </section>
  );
}
