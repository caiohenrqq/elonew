'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

const ORDER_EVENT_TYPES = [
	'order.paid',
	'order.accepted',
	'order.rejected',
	'order.completed',
	'order.cancelled',
] as const;

const REFRESH_DEBOUNCE_MS = 500;

type DashboardOrderEventType = (typeof ORDER_EVENT_TYPES)[number];

type UseDashboardEventsInput = {
	events?: readonly DashboardOrderEventType[];
};

export const useDashboardEvents = ({
	events = ORDER_EVENT_TYPES,
}: UseDashboardEventsInput = {}) => {
	const router = useRouter();
	const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (typeof EventSource === 'undefined') return;

		const eventSource = new EventSource('/api/orders/events');
		const close = () => {
			eventSource.close();
		};
		const refresh = () => {
			if (refreshTimeoutRef.current) return;

			refreshTimeoutRef.current = setTimeout(() => {
				refreshTimeoutRef.current = null;
				router.refresh();
			}, REFRESH_DEBOUNCE_MS);
		};

		for (const eventType of events) {
			eventSource.addEventListener(eventType, refresh);
		}
		eventSource.addEventListener('auth.expired', close);

		return () => {
			if (refreshTimeoutRef.current) {
				clearTimeout(refreshTimeoutRef.current);
				refreshTimeoutRef.current = null;
			}
			for (const eventType of events) {
				eventSource.removeEventListener(eventType, refresh);
			}
			eventSource.removeEventListener('auth.expired', close);
			eventSource.close();
		};
	}, [events, router]);
};
