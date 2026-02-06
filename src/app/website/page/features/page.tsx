import { FeaturesSection } from '../../components/section/features-section';
import { WebsiteHeader } from '../../components/layout/website-header';
import { WebsiteFooter } from '../../components/layout/website-footer';

export default function FeaturesPage() {
  return (
    <div className="website">
      <WebsiteHeader />
      <FeaturesSection />
      <WebsiteFooter />
    </div>
  );
}
