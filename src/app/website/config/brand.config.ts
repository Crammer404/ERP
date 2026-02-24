export const BRANDING_CONFIG = {
  // Brand Name
  name: 'ActiveWear',
  
  // Logo Configuration
  logo: {
    // Default logo SVG (minimal apparel-inspired mark)
    default: {
      viewBox: "0 0 256 256",
      paths: [
        {
          // Outer shirt / hanger silhouette
          d: "M88,64a24,24,0,0,1,48,0v8h-8V64a16,16,0,0,0-32,0v4a8,8,0,0,1-4.3,7.1L67,89.4A16,16,0,0,0,58,103.3L48,200a12,12,0,0,0,12,12H196a12,12,0,0,0,12-12l-10-96.7A16,16,0,0,0,189,89.4L164.3,75.1A8,8,0,0,1,160,68V64",
          fill: "none",
          stroke: "currentColor",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: "16"
        },
        {
          // Bottom hem line
          d: "M64,184H192",
          fill: "none",
          stroke: "currentColor",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: "16"
        }
      ]
    }
  },
  
  // Brand Tagline/Description
  tagline: 'Real-time inventory, seamless POS, and powerful analytics—all without juggling multiple systems.',
  subTagline: 'Manage your entire business operations from one unified dashboard.',
  
  // Modern Color Palette
  colors: {
    primary: '#166BC8',        // Primary brand blue
    primaryHover: '#125199',   // Darker blue for hover states
    accent: '#3B82F6',         // Bright blue
    accentHover: '#2563EB',    // Darker blue
    background: '#FFFFFF',     // Pure white
    muted: '#F8FAFC',          // Very light gray
    mutedDark: '#F1F5F9',      // Light gray
    border: '#E2E8F0',         // Subtle borders
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      muted: '#64748B',
    }
  },
  
  // Typography System
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  
  // Social Media (optional - add your actual handles)
  social: {
    twitter: '@erpsystem',
    facebook: 'erpsystem',
    linkedin: 'erpsystem',
  },
  
  // Copyright
  copyright: {
    startYear: 2025,
    entity: 'ActiveWear',
  }
} as const;

// Helper function to get copyright text
export const getCopyrightText = () => {
  const currentYear = new Date().getFullYear();
  const { startYear, entity } = BRANDING_CONFIG.copyright;
  
  const yearText = startYear === currentYear 
    ? `${currentYear}` 
    : `${startYear}-${currentYear}`;
  
  return `© ${yearText} ${entity}. All rights reserved.`;
};
