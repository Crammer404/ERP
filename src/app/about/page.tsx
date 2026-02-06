import { AboutSection } from '../website/components/section/about-section';
import { WebsiteHeader } from '../website/components/layout/website-header';
import { WebsiteFooter } from '../website/components/layout/website-footer';

export default function AboutPage() {
  return (
    <div className="website">
      <WebsiteHeader />
      <AboutSection />
      <WebsiteFooter />
    </div>
  );
}

