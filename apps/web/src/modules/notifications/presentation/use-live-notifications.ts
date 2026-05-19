'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { getPublicApiBaseUrl } from '@/shared/env/public-env';
import type { ListNotificationsResponse } from '@/shared/notifications/notification-contracts';
import {
	listNotificationsResponseSchema,
	notificationsReadAllEventSchema,
	notificationUpdatedEventSchema,
} from '@/shared/notifications/notification-contracts';
import {
	applyNotificationsReadAll,
	applyNotificationUpdated,
	replaceNotifications,
} from './notification-live-state';

const NOTIFICATION_NAMESPACE = '/notifications';

export const useLiveNotifications = (
	initialNotifications: ListNotificationsResponse,
) => {
	const [notifications, setNotifications] = useState(initialNotifications);
	const [liveError, setLiveError] = useState<string | null>(null);
	const didRetryAuthRef = useRef(false);

	const refetchNotifications = useCallback(async () => {
		const response = await fetch('/api/notifications', {
			cache: 'no-store',
			credentials: 'same-origin',
		});
		if (response.status === 401 || response.status === 403) return false;
		if (!response.ok) throw new Error('Unable to refresh notifications.');

		const next = listNotificationsResponseSchema.parse(await response.json());
		setNotifications((current) => replaceNotifications(current, next));
		return true;
	}, []);

	useEffect(() => {
		const socket = io(`${getPublicApiBaseUrl()}${NOTIFICATION_NAMESPACE}`, {
			withCredentials: true,
			transports: ['websocket', 'polling'],
		});

		const refreshFromSource = () => {
			void refetchNotifications().catch(() => {
				setLiveError('Não foi possível atualizar as notificações.');
			});
		};
		const handleUpdated = (payload: unknown) => {
			const parsed = notificationUpdatedEventSchema.safeParse(payload);
			if (!parsed.success) {
				refreshFromSource();
				return;
			}

			setNotifications((current) =>
				applyNotificationUpdated(
					current,
					parsed.data.notification,
					parsed.data.unreadCount,
				),
			);
		};
		const handleReadAll = (payload: unknown) => {
			const parsed = notificationsReadAllEventSchema.safeParse(payload);
			if (!parsed.success) {
				refreshFromSource();
				return;
			}

			setNotifications((current) =>
				applyNotificationsReadAll(
					current,
					parsed.data.readAt,
					parsed.data.cutoffActivityAt,
					parsed.data.unreadCount,
				),
			);
		};
		const handleAuthError = (payload: unknown) => {
			const code =
				typeof payload === 'object' && payload && 'code' in payload
					? payload.code
					: null;
			if (code !== 'AUTHENTICATION_REQUIRED' && code !== 'INVALID_ACCESS_TOKEN')
				return;
			if (didRetryAuthRef.current) return;

			didRetryAuthRef.current = true;
			void refetchNotifications()
				.then((canReconnect) => {
					if (canReconnect) socket.connect();
				})
				.catch(() => undefined);
		};

		socket.on('connect', refreshFromSource);
		socket.on('notifications:updated', handleUpdated);
		socket.on('notifications:read-all', handleReadAll);
		socket.on('notifications:error', handleAuthError);

		return () => {
			socket.off('connect', refreshFromSource);
			socket.off('notifications:updated', handleUpdated);
			socket.off('notifications:read-all', handleReadAll);
			socket.off('notifications:error', handleAuthError);
			socket.close();
		};
	}, [refetchNotifications]);

	return {
		liveError,
		notifications,
		refetchNotifications,
		setLiveError,
		setNotifications,
	};
};
