import { AboutSection } from '../../components/section/about-section';
import { WebsiteHeader } from '../../components/layout/website-header';
import { WebsiteFooter } from '../../components/layout/website-footer';

export default function AboutPage() {
  return (
    <div className="website">
      <WebsiteHeader />
      <AboutSection />
      <WebsiteFooter />
    </div>
  );
}
