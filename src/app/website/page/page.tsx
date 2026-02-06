import { HeroSection } from '../components/section/hero-section';
import { TrustSection } from '../components/section/trust-section';
import { FeaturesSection } from '../components/section/features-section';
import { StatsSection } from '../components/section/stats-section';
import { AboutSection } from '../components/section/about-section';
import { PricingSection } from '../components/section/pricing-section';
import { TestimonialsSection } from '../components/section/testimonials-section';
import { ContactSection } from '../components/section/contact-section';
import { WebsiteHeader } from '../components/layout/website-header';
import { WebsiteFooter } from '../components/layout/website-footer';
import { BgTheme } from '../components/ui/bg-theme';
import { SectionWrapper } from '../components/layout/section-wrapper';

export default function HomePage() {
  return (
    <div className="website">
      <WebsiteHeader />
      <main>
        <BgTheme variant="auto" showGrid={true} showBlobs={true}>
          <SectionWrapper>
            <div id="hero">
              <HeroSection />
            </div>
          </SectionWrapper>
            <TrustSection />
          <SectionWrapper>
            <div id="about">
              <AboutSection />
            </div>
            <div id="features">
              <FeaturesSection />
            </div>
              <StatsSection />
            <div id="pricing">
              <PricingSection />
            </div>
              <TestimonialsSection />
            <div id="contact">
              <ContactSection />
            </div>
          </SectionWrapper>
        </BgTheme>
      </main>
      <WebsiteFooter />
    </div>
  );
}
