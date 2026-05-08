'use client';

import { useDashboardEvents } from '@/shared/dashboard/use-dashboard-events';

const clientDashboardEvents = [
	'order.paid',
	'order.accepted',
	'order.rejected',
	'order.completed',
	'order.cancelled',
] as const;

export const ClientDashboardLiveRefresh = () => {
	useDashboardEvents({ events: clientDashboardEvents });

	return null;
};
