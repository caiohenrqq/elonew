import { CtaSection } from './sections/cta-section';
import { HeroSection } from './sections/hero-section';
import { ProcessSection } from './sections/process-section';
import { ServicesSection } from './sections/services-section';

type LandingPageProps = {
	isAuthenticated?: boolean;
};

export function LandingPage({ isAuthenticated = false }: LandingPageProps) {
	return (
		<main className="min-h-screen bg-background">
			<HeroSection isAuthenticated={isAuthenticated} />
			<ServicesSection />
			<ProcessSection />
			<CtaSection />
		</main>
	);
}
