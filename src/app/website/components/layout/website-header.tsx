'use client'

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronDown, Download, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { BRANDING_CONFIG } from '../../config/brand.config';
import { Logo } from '../ui/brand-logo';
import { SectionWrapper } from './section-wrapper';
import { BgTheme } from '../ui/bg-theme';

export function WebsiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const navigation = [
    { name: 'Home', href: '/', sectionId: 'hero' },
    { name: 'About', href: '/about', sectionId: 'about' },
    { name: 'Features', href: '/features', sectionId: 'features' },
    { name: 'Pricing', href: '/pricing', sectionId: 'pricing' },
    { name: 'Contact', href: '/contact', sectionId: 'contact' },
  ];

  // Handle scroll effect and active section tracking
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track active section using Intersection Observer
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          if (sectionId) {
            setActiveSection(sectionId);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all sections
    navigation.forEach(({ sectionId }) => {
      const element = document.getElementById(sectionId);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Smooth scroll function
  const scrollToSection = (sectionId: string) => {
    setIsMenuOpen(false); // Close mobile menu
    
    // If we're not on the homepage, navigate there first
    if (pathname !== '/') {
      router.push(`/#${sectionId}`);
      return;
    }

    // If we're on the homepage, scroll to the section
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  // Handle click events for navigation
  const handleNavClick = (e: React.MouseEvent, item: typeof navigation[0]) => {
    e.preventDefault();
    scrollToSection(item.sectionId);
  };

  // Handle hash navigation on page load
  useEffect(() => {
    const handleHashNavigation = () => {
      const hash = window.location.hash.substring(1);
      if (hash && pathname === '/') {
        setTimeout(() => {
          const element = document.getElementById(hash);
          if (element) {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          }
        }, 100);
      }
    };

    // Handle initial load
    handleHashNavigation();

    // Handle hash changes
    window.addEventListener('hashchange', handleHashNavigation);
    
    return () => {
      window.removeEventListener('hashchange', handleHashNavigation);
    };
  }, [pathname]);

  return (
    <header 
      className={`
        sticky top-0 z-50 transition-all duration-300 relative overflow-hidden
        ${scrolled 
          ? 'backdrop-blur-xl shadow-md' 
          : 'backdrop-blur-xl'
        }
      `}
    >
      {/* Background Theme Layer */}
      <div className="absolute inset-0 -z-10">
        <BgTheme variant="auto" showGrid={false} showBlobs={false} />
      </div>
      
      {/* Semi-transparent overlay for better text contrast */}
      <div 
        className={`
          absolute inset-0 -z-10 transition-all duration-300
          ${scrolled 
            ? 'bg-white/40 dark:bg-slate-900/40' 
            : 'bg-white/20 dark:bg-slate-900/20'
          }
        `}
      />
      
      <SectionWrapper className={`relative z-10 transition-all duration-300 ${scrolled ? 'py-2.5' : 'py-4'}`}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center space-x-2.5 group transition-transform hover:scale-105 duration-200"
          >
            <div 
              className="transform transition-transform group-hover:rotate-12 duration-300"
              style={{ color: BRANDING_CONFIG.colors.primary }}
            >
              <Logo size={28} />
            </div>
            <span 
              className="text-lg font-bold"
              style={{ color: BRANDING_CONFIG.colors.primary }}
            >
              {BRANDING_CONFIG.name}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={(e) => handleNavClick(e, item)}
                className={`
                  relative px-3 py-1.5 text-sm font-medium transition-all duration-200 cursor-pointer
                  ${activeSection === item.sectionId 
                    ? '' 
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }
                  before:absolute before:bottom-0 before:left-1/2 before:-translate-x-1/2
                  before:w-0 before:h-0.5 before:rounded-full
                  before:transition-all before:duration-300
                  ${activeSection === item.sectionId ? 'before:w-1/2' : ''}
                `}
                style={activeSection === item.sectionId ? { 
                  color: BRANDING_CONFIG.colors.primary,
                } : {}}
              >
                {item.name}
                {activeSection === item.sectionId && (
                  <span 
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 rounded-full"
                    style={{ backgroundColor: BRANDING_CONFIG.colors.primary }}
                  />
                )}
              </button>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
            >
              Login
            </Link>
            <Button 
              className="transition-all text-sm px-4 py-2 h-9 text-white"
              style={{ 
                backgroundColor: BRANDING_CONFIG.colors.primary,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = BRANDING_CONFIG.colors.primaryHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = BRANDING_CONFIG.colors.primary;
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            {/* Theme Toggle
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
            )} */}
          </div>

          {/* Mobile menu button */}
          <button
            className={`
              md:hidden p-1.5 rounded-lg transition-all duration-200
              ${isMenuOpen 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rotate-90' 
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              }
            `}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5 transition-transform" />
            ) : (
              <Menu className="h-5 w-5 transition-transform" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div 
          className={`
            md:hidden overflow-hidden transition-all duration-300 ease-in-out
            ${isMenuOpen ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0'}
          `}
        >
          <nav className="flex flex-col space-y-2 pb-4">
            {navigation.map((item, index) => (
              <button
                key={item.name}
                onClick={(e) => handleNavClick(e, item)}
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  ...(activeSection === item.sectionId ? { 
                    color: BRANDING_CONFIG.colors.primary,
                    borderLeftColor: BRANDING_CONFIG.colors.primary
                  } : {})
                }}
                className={`
                  text-left px-4 py-3 font-medium transition-all
                  ${activeSection === item.sectionId
                    ? 'border-l-4'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 border-l-4 border-transparent'
                  }
                  ${isMenuOpen ? 'animate-in slide-in-from-left' : ''}
                `}
              >
                {item.name}
              </button>
            ))}
            <div className="flex flex-col gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              {/* Mobile Theme Toggle */}
              {mounted && (
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="flex items-center justify-center gap-2 py-3 font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="h-5 w-5" />
                      <span>Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="h-5 w-5" />
                      <span>Dark Mode</span>
                    </>
                  )}
                </button>
              )}
              <Link 
                href="/login"
                className="text-center py-3 font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
              <Button 
                className="w-full text-sm text-white transition-all"
                style={{ 
                  backgroundColor: BRANDING_CONFIG.colors.primary,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = BRANDING_CONFIG.colors.primaryHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = BRANDING_CONFIG.colors.primary;
                }}
                onClick={() => setIsMenuOpen(false)}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </nav>
        </div>
      </SectionWrapper>
      
      {/* Global smooth scrolling styles */}
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        @keyframes slide-in-from-left {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-in {
          animation: slide-in-from-left 0.3s ease-out forwards;
        }
      `}</style>
    </header>
  );
}
