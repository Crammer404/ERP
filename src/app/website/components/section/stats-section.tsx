'use client'

import { TrendingUp, Users, Globe, Clock, Sparkles } from 'lucide-react';
import { useState } from 'react';

export function StatsSection() {
  const [hoveredStat, setHoveredStat] = useState<number | null>(null);

  const stats = [
    {
      icon: Users,
      value: '10,000+',
      label: 'Active Users',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: TrendingUp,
      value: '99.9%',
      label: 'Uptime SLA',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: Globe,
      value: '50+',
      label: 'Countries',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: Clock,
      value: '24/7',
      label: 'Support',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      gradient: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <section className="py-12 relative">
      <div className="bg-card rounded-3xl p-6 md:p-10 border-2 border-border overflow-hidden relative">
        {/* Grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        <div className="relative z-10">
          {/* Section header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 shadow-xl text-cyan-600 dark:text-cyan-400">
              <Sparkles className="h-3 w-3 animate-pulse" />
              Our Impact
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-card-foreground mb-2">
              Powering the world's best
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Join thousands of companies that rely on SalesStox every day
            </p>
          </div>
        
        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 max-w-5xl mx-auto px-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const isHovered = hoveredStat === index;
            
            return (
              <div 
                key={index}
                className="text-center group relative"
                onMouseEnter={() => setHoveredStat(index)}
                onMouseLeave={() => setHoveredStat(null)}
              >
                {/* Icon container with super rounded corners */}
                <div className="relative mb-2 flex justify-center">
                  {/* Animated gradient glow on hover */}
                  {isHovered && (
                    <div className={`absolute -inset-2 bg-gradient-to-r ${stat.gradient} opacity-50 blur-xl rounded-full animate-pulse`}></div>
                  )}
                  
                  <div className={`
                    ${stat.bgColor} backdrop-blur-sm h-12 w-12 rounded-3xl flex items-center justify-center
                    transition-all duration-500 border-2 relative
                    ${isHovered 
                      ? 'scale-125 border-border/40 shadow-2xl rotate-12 bg-background/20' 
                      : 'border-border/10 shadow-lg group-hover:scale-110 group-hover:border-border/20'
                    }
                  `}>
                    <Icon className={`h-5 w-5 ${stat.color} transition-all duration-300 ${isHovered ? 'scale-110 rotate-12' : ''}`} />
                    
                    {/* Subtle shine effect */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-transparent via-foreground/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                </div>
                
                {/* Value with glow effect on hover */}
                <div className={`
                  text-lg md:text-xl font-bold mb-1 transition-all duration-300
                  ${isHovered ? 'text-card-foreground scale-105 drop-shadow-[0_0_12px_rgba(128,128,128,0.3)]' : 'text-card-foreground/90'}
                `}>
                  {stat.value}
                </div>
                
                {/* Label */}
                <div className={`
                  text-xs font-medium uppercase tracking-wide transition-all duration-300
                  ${isHovered ? 'text-muted-foreground' : 'text-muted-foreground/70'}
                `}>
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </div>
    </section>
  );
}