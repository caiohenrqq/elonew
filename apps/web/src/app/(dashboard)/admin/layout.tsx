import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { AdminDashboardShell } from '@/modules/admin-dashboard/presentation/dashboard/admin-dashboard-shell';
import { getAuthSession } from '@/shared/auth/session';

const getAdminSession = async () => {
	try {
		const session = await getAuthSession();
		if (!session || session.userRole !== 'ADMIN') return null;
		return session;
	} catch {
		return null;
	}
};

const AdminDashboardLayout = async ({ children }: { children: ReactNode }) => {
	const session = await getAdminSession();
	if (!session) redirect('/login');

	return (
		<AdminDashboardShell user={{ username: session.username ?? 'Admin' }}>
			{children}
		</AdminDashboardShell>
	);
};

export default AdminDashboardLayout;
