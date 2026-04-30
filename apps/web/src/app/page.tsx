import { SmoothScroll } from '@packages/ui/providers/smooth-scroll';
import { LandingPage } from '@/modules/landing/presentation/landing-page';

export default function Home() {
	return (
		<SmoothScroll>
			<LandingPage />
		</SmoothScroll>
	);
}
