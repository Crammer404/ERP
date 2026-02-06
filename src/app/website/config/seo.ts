import { BRANDING_CONFIG } from './brand.config';

export const SEO_CONFIG = {
  DEFAULT_TITLE: `${BRANDING_CONFIG.name} - Complete Business Management Solution`,
  DEFAULT_DESCRIPTION: BRANDING_CONFIG.tagline,
  DEFAULT_KEYWORDS: 'ERP, business management, inventory, POS, enterprise software',
  SITE_NAME: BRANDING_CONFIG.name,
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  TWITTER_HANDLE: BRANDING_CONFIG.social.twitter,
  FACEBOOK_APP_ID: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
} as const;

export const PAGE_SEO = {
  HOME: {
    title: `${BRANDING_CONFIG.name} - Complete Business Management Solution`,
    description: BRANDING_CONFIG.tagline,
    keywords: 'ERP, business management, inventory, POS, enterprise software'
  },
  ABOUT: {
    title: `About Us - ${BRANDING_CONFIG.name}`,
    description: 'Learn about our mission to empower businesses with technology that simplifies complex operations and drives sustainable growth.',
    keywords: 'about, company, mission, values, ERP system'
  },
  FEATURES: {
    title: `Features - ${BRANDING_CONFIG.name}`,
    description: 'Discover all the powerful features of our ERP system including user management, inventory tracking, POS, analytics, and more.',
    keywords: 'features, ERP features, business management, inventory, POS, analytics'
  },
  PRICING: {
    title: `Pricing - ${BRANDING_CONFIG.name}`,
    description: 'Simple, transparent pricing for our ERP system. Choose the plan that\'s right for your business with no hidden fees.',
    keywords: 'pricing, plans, subscription, ERP cost, business software pricing'
  },
  CONTACT: {
    title: `Contact Us - ${BRANDING_CONFIG.name}`,
    description: 'Get in touch with our team. We\'d love to hear from you and help you get started with our ERP system.',
    keywords: 'contact, support, help, sales, ERP consultation'
  }
} as const;
