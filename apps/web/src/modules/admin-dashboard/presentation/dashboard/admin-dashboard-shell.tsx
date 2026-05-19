import { Shield } from 'lucide-react';
import type { ReactNode } from 'react';
import { logoutAction } from '@/modules/auth/actions/auth-actions';
import { getDashboardNotifications } from '@/modules/notifications/actions/notification-actions';
import { NotificationPopover } from '@/modules/notifications/presentation/notification-popover';
import { DashboardShell as SharedDashboardShell } from '@/shared/dashboard/dashboard-shell';
import { AdminNavigation } from './admin-navigation';

type AdminDashboardShellProps = {
	children: ReactNode;
	user: {
		username: string;
	};
};

export const AdminDashboardShell = async ({
	children,
	user,
}: AdminDashboardShellProps) => {
	const notifications = await getDashboardNotifications();

	return (
		<SharedDashboardShell
			user={user}
			roleLabel="ADMIN"
			roleIcon={Shield}
			portalLabel="Painel Admin"
			navigation={<AdminNavigation />}
			logoutAction={logoutAction}
			headerAside={
				<div className="flex items-center gap-4">
					<NotificationPopover
						initialNotifications={notifications}
						viewerRole="ADMIN"
					/>
					<div className="text-right">
						<p className="text-[8px] font-medium uppercase tracking-widest text-white/40">
							Acesso
						</p>
						<p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
							Restrito
						</p>
					</div>
				</div>
			}
		>
			{children}
		</SharedDashboardShell>
	);
};
