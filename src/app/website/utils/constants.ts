import { BRANDING_CONFIG } from '../config/brand.config';

export const WEBSITE_CONFIG = {
  SITE_NAME: BRANDING_CONFIG.name,
  SITE_DESCRIPTION: BRANDING_CONFIG.tagline,
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  CONTACT_EMAIL: 'support@erpsystem.com',
  PHONE: '+1 (555) 123-4567',
  ADDRESS: '123 Business St, Suite 100, San Francisco, CA 94105'
} as const;

export const SOCIAL_LINKS = {
  TWITTER: `https://twitter.com/${BRANDING_CONFIG.social.twitter.replace('@', '')}`,
  LINKEDIN: `https://linkedin.com/company/${BRANDING_CONFIG.social.linkedin}`,
  FACEBOOK: `https://facebook.com/${BRANDING_CONFIG.social.facebook}`,
  GITHUB: 'https://github.com/erpsystem'
} as const;

export const NAVIGATION_ITEMS = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Features', href: '/features' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Contact', href: '/contact' }
] as const;
