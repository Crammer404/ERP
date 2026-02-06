'use client'

import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import { SectionWrapper } from '../layout/section-wrapper';

// Import company logos
import jollibee from '../../assets/company/Jollibee-Logo.png';
import mcdonalds from '../../assets/company/McDonald\'s_logo.png';
import starbucks from '../../assets/company/Starbucks.png';
import cocacola from '../../assets/company/Coca-Cola-logo.png';
import mangInasal from '../../assets/company/Mang_Inasal.png';
import redRibbon from '../../assets/company/Red_Ribbon.png';
import macao from '../../assets/company/macao.png';

export function TrustSection() {
  const [hoveredCompany, setHoveredCompany] = useState<number | null>(null);

  // Company logo data with imported images
  const companies = [
    { id: 1, name: 'Jollibee', logo: jollibee, gradient: 'from-red-500 to-orange-500' },
    { id: 2, name: 'McDonald\'s', logo: mcdonalds, gradient: 'from-yellow-500 to-red-500' },
    { id: 3, name: 'Starbucks', logo: starbucks, gradient: 'from-green-600 to-green-500' },
    { id: 4, name: 'Coca-Cola', logo: cocacola, gradient: 'from-red-600 to-red-500' },
    { id: 5, name: 'Mang Inasal', logo: mangInasal, gradient: 'from-orange-500 to-yellow-500' },
    { id: 6, name: 'Red Ribbon', logo: redRibbon, gradient: 'from-red-500 to-pink-500' },
    { id: 7, name: 'Macao', logo: macao, gradient: 'from-blue-500 to-cyan-500' },
  ];


  return (
    <section className="py-20 relative bg-slate-900 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <SectionWrapper>
        <div className="text-center mb-12 px-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-full text-xs text-cyan-500 font-semibold uppercase tracking-wider mb-3 shadow-xl">
            <Sparkles className="h-3 w-3 text-blue-400 animate-pulse" />
            Trusted by leading companies
          </div>
          <p className="text-base text-slate-400 max-w-2xl mx-auto">
            Join thousands of businesses worldwide
          </p>
        </div>
        
        {/* Animated logo marquee - Full width */}
        <div className="relative z-10">
          {/* Gradient fade overlays - synced with dark background */}
          <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent z-20 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-slate-900 via-slate-900/80 to-transparent z-20 pointer-events-none"></div>
          
          {/* Scrolling container */}
          <div className="flex items-center py-4 overflow-hidden">
            <div className="flex items-center gap-12 animate-marquee-seamless hover:pause-animation">
              {companies.map((company, index) => {
                const isHovered = hoveredCompany === index;
                
                return (
                  <div 
                    key={`${company.id}-${index}`}
                    className="flex-shrink-0 relative flex items-center justify-center"
                    onMouseEnter={() => setHoveredCompany(index)}
                    onMouseLeave={() => setHoveredCompany(null)}
                  >
                    {/* Company Logo Image */}
                    <div className="relative h-16 flex items-center justify-center">
                      <Image 
                        src={company.logo}
                        alt={company.name}
                        width={140}
                        height={64}
                        className={`
                          object-contain transition-all duration-300 cursor-pointer h-full w-auto
                          ${isHovered 
                            ? 'scale-125 drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)]' 
                            : 'opacity-70 hover:opacity-90'
                          }
                        `}
                      />
                    </div>
                  </div>
                );
              })}
              {/* Duplicate set for seamless loop */}
              {companies.map((company, index) => {
                const isHovered = hoveredCompany === index + companies.length;
                
                return (
                  <div 
                    key={`duplicate-${company.id}-${index}`}
                    className="flex-shrink-0 relative flex items-center justify-center"
                    onMouseEnter={() => setHoveredCompany(index + companies.length)}
                    onMouseLeave={() => setHoveredCompany(null)}
                  >
                    {/* Company Logo Image */}
                    <div className="relative h-16 flex items-center justify-center">
                      <Image 
                        src={company.logo}
                        alt={company.name}
                        width={140}
                        height={64}
                        className={`
                          object-contain transition-all duration-300 cursor-pointer h-full w-auto
                          ${isHovered 
                            ? 'scale-125 drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)]' 
                            : 'opacity-70 hover:opacity-90'
                          }
                        `}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </SectionWrapper>
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes marquee-seamless {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-marquee-seamless {
          animation: marquee-seamless 60s linear infinite;
          display: flex;
          width: fit-content;
          will-change: transform;
          backface-visibility: hidden;
          perspective: 1000px;
        }
        
        .hover\\:pause-animation:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}