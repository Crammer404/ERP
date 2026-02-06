import { PricingSection } from '../website/components/section/pricing-section';
import { WebsiteHeader } from '../website/components/layout/website-header';
import { WebsiteFooter } from '../website/components/layout/website-footer';

export default function PricingPage() {
  return (
    <div className="website">
      <WebsiteHeader />
      <PricingSection />
      <WebsiteFooter />
    </div>
  );
}

