import { ContactSection } from '../../components/section/contact-section';
import { WebsiteHeader } from '../../components/layout/website-header';
import { WebsiteFooter } from '../../components/layout/website-footer';

export default function ContactPage() {
  return (
    <div className="website">
      <WebsiteHeader />
      <ContactSection />
      <WebsiteFooter />
    </div>
  );
}
