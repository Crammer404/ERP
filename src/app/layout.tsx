import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { ClientRoot } from './client-root';
import { BRANDING_CONFIG } from './website/config/brand.config';

export const metadata: Metadata = {
  title: BRANDING_CONFIG.name,
  description: BRANDING_CONFIG.tagline,
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
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&display=swap"
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
