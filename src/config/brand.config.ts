// Centralized brand configuration
// Change these values to update branding across the entire application

export const BRAND_CONFIG = {
  // Brand name - used in sidebar, loader, login page, etc.
  name: 'SalesStox',
  
  // Brand tagline - used in login page and other marketing areas
  tagline: 'Your All-in-One Business Solution',
  
  // Brand colors - used throughout the application
  colors: {
    // Primary brand color for text and accents
    primary: 'text-primary',
    // Secondary brand color for subtitles and secondary text
    secondary: 'text-muted-foreground',
    // Accent color for highlights
    accent: 'text-accent-foreground'
  },
  
  // Brand logo - SVG component or path
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
  }
} as const;

// Helper function to get brand name
export const getBrandName = () => BRAND_CONFIG.name;

// Helper function to get brand tagline
export const getBrandTagline = () => BRAND_CONFIG.tagline;

// Helper function to get brand logo
export const getBrandLogo = () => BRAND_CONFIG.logo.default;

// Helper function to get brand colors
export const getBrandColors = () => BRAND_CONFIG.colors;
