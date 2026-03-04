import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { ClientRoot } from './client-root';
import { BRAND_CONFIG } from '@/config/brand.config';

export const metadata: Metadata = {
  title: {
    default: BRAND_CONFIG.name,
    template: `%s | ${BRAND_CONFIG.name}`,
  },
  description: BRAND_CONFIG.tagline,
  applicationName: BRAND_CONFIG.name,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('min-h-screen bg-background font-sans antialiased')}>
        {/* 👇 delegate client-side logic */}
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  );
}
