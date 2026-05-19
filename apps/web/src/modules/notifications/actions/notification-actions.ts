'use server';

import { revalidatePath } from 'next/cache';
import { api } from '@/shared/api-client-management/api-client';
import { ApiRequestError } from '@/shared/api-client-management/http';
import { redirectOnAuthError } from '@/shared/auth/redirect-on-auth-error';
import type {
	ListNotificationsResponse,
	NotificationOutput,
} from '@/shared/notifications/notification-contracts';
import {
	listNotifications,
	markAllNotificationsRead,
	markNotificationRead,
} from '@/shared/notifications/notification-service';
import { assertSameOriginRequest } from '@/shared/security/origin';

export type NotificationActionState =
	| {
			notification: NotificationOutput;
			conflict?: never;
			error?: never;
	  }
	| {
			error: string;
			conflict?: boolean;
			notification?: never;
	  };

export const getDashboardNotifications =
	async (): Promise<ListNotificationsResponse> => {
		try {
			return await listNotifications((path, init) =>
				api.request(path, { ...init, allowSessionRefresh: false }),
			);
		} catch (error) {
			return redirectOnAuthError(error);
		}
	};

export const markDashboardNotificationReadAction = async (
	notificationId: string,
	expectedActivityAt: string,
): Promise<NotificationActionState> => {
	try {
		await assertSameOriginRequest();
		const notification = await markNotificationRead(
			notificationId,
			expectedActivityAt,
			api.request,
		);
		revalidatePath('/client');
		revalidatePath('/booster');
		revalidatePath('/admin');
		return { notification };
	} catch (error) {
		if (
			error instanceof ApiRequestError &&
			(error.status === 401 || error.status === 403)
		) {
			return { error: 'Entre novamente para continuar.' };
		}
		if (error instanceof ApiRequestError && error.status === 409) {
			return {
				conflict: true,
				error: 'A notificação mudou. Atualizando a lista.',
			};
		}

		return { error: 'Não foi possível marcar a notificação como lida.' };
	}
};

export const markAllDashboardNotificationsReadAction = async (): Promise<{
	cutoffActivityAt?: string;
	error?: string;
	unreadCount?: number;
}> => {
	try {
		await assertSameOriginRequest();
		const result = await markAllNotificationsRead(api.request);
		revalidatePath('/client');
		revalidatePath('/booster');
		revalidatePath('/admin');
		return {
			cutoffActivityAt: result.cutoffActivityAt,
			unreadCount: result.unreadCount,
		};
	} catch (error) {
		if (
			error instanceof ApiRequestError &&
			(error.status === 401 || error.status === 403)
		) {
			return { error: 'Entre novamente para continuar.' };
		}

		return { error: 'Não foi possível marcar as notificações como lidas.' };
	}
};
