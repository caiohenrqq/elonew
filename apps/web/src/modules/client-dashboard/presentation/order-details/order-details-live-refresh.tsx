'use client';

import { useDashboardEvents } from '@/shared/dashboard/use-dashboard-events';

const orderDetailsEvents = [
	'order.paid',
	'order.accepted',
	'order.rejected',
	'order.completed',
	'order.cancelled',
] as const;

export const OrderDetailsLiveRefresh = () => {
	useDashboardEvents({ events: orderDetailsEvents });

	return null;
};
