import { User, Wallet } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { logoutAction } from '@/modules/auth/actions/auth-actions';
import { getDashboardNotifications } from '@/modules/notifications/actions/notification-actions';
import { NotificationPopover } from '@/modules/notifications/presentation/notification-popover';
import { DashboardShell as SharedDashboardShell } from '@/shared/dashboard/dashboard-shell';
import { getButtonClassName } from '@/shared/ui/components/button';
import { BoosterNavigation } from './booster-navigation';

type BoosterDashboardShellProps = {
	children: ReactNode;
	user: {
		username: string;
	};
};

export const BoosterDashboardShell = async ({
	children,
	user,
}: BoosterDashboardShellProps) => {
	const notifications = await getDashboardNotifications();

	return (
		<SharedDashboardShell
			user={user}
			roleLabel="BOOSTER"
			roleIcon={User}
			portalLabel="Portal do Booster"
			navigation={<BoosterNavigation />}
			logoutAction={logoutAction}
			headerAside={
				<div className="flex items-center gap-3">
					<NotificationPopover
						initialNotifications={notifications}
						viewerRole="BOOSTER"
					/>
					<Link
						href="/booster"
						className={getButtonClassName({
							variant: 'outline',
							size: 'sm',
							className: 'gap-2',
						})}
					>
						<Wallet className="h-3 w-3" />
						Carteira
					</Link>
				</div>
			}
		>
			{children}
		</SharedDashboardShell>
	);
};
