import type { ReactNode } from 'react';

type DashboardEntranceProps = {
	children: ReactNode;
};

export const DashboardEntrance = ({ children }: DashboardEntranceProps) => {
	return <div className="dashboard-entrance space-y-10">{children}</div>;
};
