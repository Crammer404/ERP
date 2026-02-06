import { PricingSection } from '../../components/section/pricing-section';
import { WebsiteHeader } from '../../components/layout/website-header';
import { WebsiteFooter } from '../../components/layout/website-footer';

export default function PricingPage() {
  return (
    <div className="website">
      <WebsiteHeader />
      <PricingSection />
      <WebsiteFooter />
    </div>
  );
}
