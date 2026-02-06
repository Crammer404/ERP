import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Remove console logs in production (works with both Webpack and Turbopack)
  // compiler: {
  //   removeConsole: process.env.NODE_ENV === 'production',
  // },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.britannica.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/storage/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/storage/**",
      },
      {
        protocol: 'https',
        hostname: 'erp-staging.uptek.cloud',
        port: '',
        pathname: '/storage/**',
      },
    ],
  },
  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    output: 'export', // Enable static export only in production
    trailingSlash: false, // No trailing slashes to match Laravel's .htaccess behavior
    distDir: 'out', // Output directory for static export
  }),
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '', // CDN prefix if needed
  experimental: {
    // Enable optimizations
  }
};

export default nextConfig;
