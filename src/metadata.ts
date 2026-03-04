import type { Metadata } from 'next';
import { BRAND_CONFIG } from '@/config/brand.config';

export const metadata: Metadata = {
  title: BRAND_CONFIG.name,
  description: BRAND_CONFIG.tagline,
  applicationName: BRAND_CONFIG.name,
};
