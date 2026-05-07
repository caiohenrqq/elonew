import { LandingPage } from '@/modules/landing/presentation/landing-page';
import { LandingScrollShell } from '@/modules/landing/presentation/landing-scroll-shell';

export default function Home() {
	return (
		<LandingScrollShell>
			<LandingPage />
		</LandingScrollShell>
	);
}
