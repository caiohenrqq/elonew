import { CtaSection } from './sections/cta-section';
import { HeroSection } from './sections/hero-section';
import { ProcessSection } from './sections/process-section';
import { ServicesSection } from './sections/services-section';

export function LandingPage() {
	return (
		<main className="min-h-screen bg-background">
			<HeroSection />
			<ServicesSection />
			<ProcessSection />
			<CtaSection />
		</main>
	);
}
