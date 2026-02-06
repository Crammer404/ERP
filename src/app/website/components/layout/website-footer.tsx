import Link from 'next/link';
import { BRANDING_CONFIG, getCopyrightText } from '../../config/brand.config';
import { Logo } from '../ui/brand-logo';
import { SectionWrapper } from './section-wrapper';
import { Facebook, Twitter, Linkedin, Github } from 'lucide-react';

export function WebsiteFooter() {

  return (
    <footer className="bg-slate-900 text-white">
      <SectionWrapper className="py-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8 max-w-6xl mx-auto">
            {/* Company Info */}
            <div className="space-y-3 md:col-span-2 lg:col-span-1">
              <Link href="/" className="flex items-center space-x-2">
                <div style={{ color: BRANDING_CONFIG.colors.primary }}>
                  <Logo size={28} />
                </div>
                <span 
                  className="text-lg font-bold"
                  style={{ color: BRANDING_CONFIG.colors.primary }}
                >
                  {BRANDING_CONFIG.name}
                </span>
              </Link>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                {BRANDING_CONFIG.tagline}
              </p>
              {/* Social Media Icons */}
              <div className="flex gap-3 pt-2">
                <a 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a 
                  href="https://linkedin.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* About Links */}
            <div className="space-y-3">
              <h3 className="font-semibold text-base">About</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/about" className="text-slate-400 hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/features" className="text-slate-400 hover:text-white transition-colors">
                    Our Features
                  </Link>
                </li>
                <li>
                  <Link href="/team" className="text-slate-400 hover:text-white transition-colors">
                    Our Team
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="text-slate-400 hover:text-white transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-slate-400 hover:text-white transition-colors">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Services Links */}
            <div className="space-y-3">
              <h3 className="font-semibold text-base">Services</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/pos" className="text-slate-400 hover:text-white transition-colors">
                    Point of Sale
                  </Link>
                </li>
                <li>
                  <Link href="/inventory" className="text-slate-400 hover:text-white transition-colors">
                    Inventory Management
                  </Link>
                </li>
                <li>
                  <Link href="/dtr" className="text-slate-400 hover:text-white transition-colors">
                    Time Tracking
                  </Link>
                </li>
                <li>
                  <Link href="/payroll" className="text-slate-400 hover:text-white transition-colors">
                    Payroll System
                  </Link>
                </li>
                <li>
                  <Link href="/reports" className="text-slate-400 hover:text-white transition-colors">
                    Reports & Analytics
                  </Link>
                </li>
                <li>
                  <Link href="/integrations" className="text-slate-400 hover:text-white transition-colors">
                    Integrations
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources Links */}
            <div className="space-y-3">
              <h3 className="font-semibold text-base">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/pricing" className="text-slate-400 hover:text-white transition-colors">
                    Pricing Plans
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="text-slate-400 hover:text-white transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="text-slate-400 hover:text-white transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/api" className="text-slate-400 hover:text-white transition-colors">
                    API Reference
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-slate-400 hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Transparency Section */}
          <div className="flex justify-center my-6">
            <div className="bg-slate-800 rounded-full px-32 py-2.5 inline-flex items-center gap-2 text-sm">
              <span className="text-slate-400">Made with</span>
              <span className="text-red-500">❤</span>
              <span className="text-slate-400">for businesses worldwide</span>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-slate-800 pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500 max-w-6xl mx-auto">
              <p>{getCopyrightText()}</p>
              <div className="flex gap-6">
                <Link href="/sitemap" className="hover:text-slate-300 transition-colors">
                  Sitemap
                </Link>
                <Link href="/accessibility" className="hover:text-slate-300 transition-colors">
                  Accessibility
                </Link>
              </div>
            </div>
          </div>
      </SectionWrapper>
    </footer>
  );
}
