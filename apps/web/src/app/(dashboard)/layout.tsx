import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { DashboardShell } from '@/modules/client-dashboard/presentation/dashboard/dashboard-shell';
import { getAuthSession } from '@/shared/auth/session';

const getClientSession = async () => {
	try {
		const session = await getAuthSession();
		if (!session || session.userRole !== 'CLIENT') return null;
		return session;
	} catch {
		return null;
	}
};

const DashboardLayout = async ({ children }: { children: ReactNode }) => {
	const session = await getClientSession();
	if (!session) redirect('/login');

	return (
		<DashboardShell user={{ username: session.username ?? 'Cliente' }}>
			{children}
		</DashboardShell>
	);
};

export default DashboardLayout;
