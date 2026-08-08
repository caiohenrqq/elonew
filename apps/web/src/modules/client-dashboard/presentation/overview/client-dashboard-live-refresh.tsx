'use client';

import { useDashboardEvents } from '@/shared/dashboard/use-dashboard-events';

export const ClientDashboardLiveRefresh = () => {
	useDashboardEvents();

	return null;
};
