export const BRANDING_CONFIG = {
  // Brand Name
  name: 'TimeWorx',
  
  // Logo Configuration
  logo: {
    // Default logo SVG (clock/workforce mark)
    default: {
      viewBox: "0 0 256 256",
      paths: [
        {
          // Clock face
          d: "M128 40a88 88 0 1 0 0 176a88 88 0 1 0 0 -176",
          fill: "none",
          stroke: "currentColor",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: "14"
        },
        {
          // Hour hand
          d: "M128 84v48",
          fill: "none",
          stroke: "currentColor",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: "14"
        },
        {
          // Minute hand
          d: "M128 132l34 20",
          fill: "none",
          stroke: "currentColor",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: "14"
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
    entity: 'TimeWorx',
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
