import { FeaturesSection } from '../website/components/section/features-section';
import { WebsiteHeader } from '../website/components/layout/website-header';
import { WebsiteFooter } from '../website/components/layout/website-footer';

export default function FeaturesPage() {
  return (
    <div className="website">
      <WebsiteHeader />
      <FeaturesSection />
      <WebsiteFooter />
    </div>
  );
}

