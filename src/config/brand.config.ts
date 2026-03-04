// Centralized brand configuration
// Change these values to update branding across the entire application

export const BRAND_CONFIG = {
  name: 'TimeWorx',
  tagline: 'Smart Time and Workforce Management',
  
  // Brand colors - used throughout the application
  colors: {
    primary: 'text-primary',
    // Secondary brand color for subtitles and secondary text
    secondary: 'text-muted-foreground',
    // Accent color for highlights
    accent: 'text-accent-foreground'
  },
  
  // Brand logo - SVG component or path
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
