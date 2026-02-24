// Centralized brand configuration
// Change these values to update branding across the entire application

export const BRAND_CONFIG = {
  // Brand name - used in sidebar, loader, login page, etc.
  name: 'ActiveWear',
  
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
