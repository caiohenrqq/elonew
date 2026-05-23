import { User } from 'lucide-react';
import type { ReactNode } from 'react';
import { logoutAction } from '@/modules/auth/actions/auth-actions';
import { getDashboardNotifications } from '@/modules/notifications/actions/notification-actions';
import { NotificationPopover } from '@/modules/notifications/presentation/notification-popover';
import { DashboardShell as SharedDashboardShell } from '@/shared/dashboard/dashboard-shell';
import { DashboardNavigation } from './dashboard-navigation';

type DashboardShellProps = {
	children: ReactNode;
	user: {
		username: string;
	};
};

export const DashboardShell = async ({
	children,
	user,
}: DashboardShellProps) => {
	const notifications = await getDashboardNotifications();

	return (
		<SharedDashboardShell
			user={user}
			roleLabel="CLIENTE"
			roleIcon={User}
			portalLabel="Portal do Cliente"
			navigation={<DashboardNavigation />}
			logoutAction={logoutAction}
			headerAside={
				<div className="flex items-center gap-4">
					<NotificationPopover
						initialNotifications={notifications}
						viewerRole="CLIENT"
					/>
				</div>
			}
		>
			{children}
		</SharedDashboardShell>
	);
};
