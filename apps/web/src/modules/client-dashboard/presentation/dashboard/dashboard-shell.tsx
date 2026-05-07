import { User } from 'lucide-react';
import type { ReactNode } from 'react';
import { logoutAction } from '@/modules/auth/actions/auth-actions';
import { DashboardShell as SharedDashboardShell } from '@/shared/dashboard/dashboard-shell';
import { DashboardNavigation } from './dashboard-navigation';

type DashboardShellProps = {
	children: ReactNode;
	user: {
		username: string;
	};
};

export const DashboardShell = ({ children, user }: DashboardShellProps) => (
	<SharedDashboardShell
		user={user}
		roleLabel="CLIENTE"
		roleIcon={User}
		portalLabel="Portal do Cliente"
		navigation={<DashboardNavigation />}
		logoutAction={logoutAction}
		headerAside={
			<div className="text-right">
				<p className="text-[8px] font-medium uppercase tracking-widest text-white/40">
					Status do Sistema
				</p>
				<div className="flex items-center justify-end gap-1.5">
					<div className="h-1 w-1 rounded-full bg-emerald-500" />
					<p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
						Online
					</p>
				</div>
			</div>
		}
	>
		{children}
	</SharedDashboardShell>
);
