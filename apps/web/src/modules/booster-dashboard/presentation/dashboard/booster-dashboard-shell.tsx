import { getButtonClassName } from '@packages/ui/components/button';
import { User, Wallet } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { logoutAction } from '@/modules/auth/actions/auth-actions';
import { DashboardShell as SharedDashboardShell } from '@/shared/dashboard/dashboard-shell';
import { BoosterNavigation } from './booster-navigation';

type BoosterDashboardShellProps = {
	children: ReactNode;
	user: {
		username: string;
	};
};

export const BoosterDashboardShell = ({
	children,
	user,
}: BoosterDashboardShellProps) => (
	<SharedDashboardShell
		user={user}
		roleLabel="BOOSTER"
		roleIcon={User}
		portalLabel="Portal do Booster"
		navigation={<BoosterNavigation />}
		logoutAction={logoutAction}
		headerAside={
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
		}
	>
		{children}
	</SharedDashboardShell>
);
