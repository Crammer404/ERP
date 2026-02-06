import { ContactSection } from '../website/components/section/contact-section';
import { WebsiteHeader } from '../website/components/layout/website-header';
import { WebsiteFooter } from '../website/components/layout/website-footer';

export default function ContactPage() {
  return (
    <div className="website">
      <WebsiteHeader />
      <ContactSection />
      <WebsiteFooter />
    </div>
  );
}

