'use client';

import { useDashboardEvents } from '@/shared/dashboard/use-dashboard-events';

const boosterDashboardEvents = [
	'order.paid',
	'order.accepted',
	'order.rejected',
	'order.completed',
	'order.cancelled',
] as const;

export const BoosterDashboardLiveRefresh = () => {
	useDashboardEvents({ events: boosterDashboardEvents });

	return null;
};
