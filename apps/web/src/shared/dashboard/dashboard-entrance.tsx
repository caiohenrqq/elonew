import type { ReactNode } from 'react';

type DashboardEntranceProps = {
	children: ReactNode;
};

export const DashboardEntrance = ({ children }: DashboardEntranceProps) => {
	return (
		<div className="dashboard-entrance flex min-h-0 flex-1 flex-col space-y-10">
			{children}
		</div>
	);
};
