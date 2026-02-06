export const BRANDING_CONFIG = {
  // Brand Name
  name: 'SalesStox',
  
  // Logo Configuration
  logo: {
    // Default logo SVG (warehouse with lock)
    default: {
      viewBox: "0 0 256 256",
      paths: [
        {
          d: "M48,216a23.9,23.9,0,0,1-24-24V88A23.9,23.9,0,0,1,48,64H208a23.9,23.9,0,0,1,24,24v16",
          fill: "none",
          stroke: "currentColor",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: "16"
        },
        {
          d: "M24,144H224a8,8,0,0,1,8,8v40a8,8,0,0,1-8,8H24a8,8,0,0,1,0-16Z",
          fill: "none",
          stroke: "currentColor",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: "16"
        },
        {
          d: "M168,104V64",
          fill: "none",
          stroke: "currentColor",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: "16"
        },
        {
          d: "M128,104V64a40,40,0,0,1,80,0v40",
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
    entity: 'SalesStox',
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
