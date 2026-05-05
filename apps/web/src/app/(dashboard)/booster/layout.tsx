import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { BoosterDashboardShell } from '@/modules/booster-dashboard/presentation/dashboard/booster-dashboard-shell';
import { getAuthSession } from '@/shared/auth/session';

const getBoosterSession = async () => {
	try {
		const session = await getAuthSession();
		if (!session || session.userRole !== 'BOOSTER' || !session.userId)
			return null;
		return session;
	} catch {
		return null;
	}
};

const BoosterDashboardLayout = async ({
	children,
}: {
	children: ReactNode;
}) => {
	const session = await getBoosterSession();
	if (!session) redirect('/login');

	return (
		<BoosterDashboardShell user={{ username: session.username ?? 'Booster' }}>
			{children}
		</BoosterDashboardShell>
	);
};

export default BoosterDashboardLayout;
