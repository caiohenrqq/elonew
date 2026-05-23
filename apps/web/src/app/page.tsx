import { LandingPage } from '@/modules/landing/presentation/landing-page';
import { LandingScrollShell } from '@/modules/landing/presentation/landing-scroll-shell';
import { getAuthSession } from '@/shared/auth/session';

export default async function Home() {
	const session = await getAuthSession();

	return (
		<LandingScrollShell>
			<LandingPage isAuthenticated={Boolean(session)} />
		</LandingScrollShell>
	);
}
