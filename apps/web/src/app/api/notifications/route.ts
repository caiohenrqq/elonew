import { api } from '@/shared/api-client-management/api-client';
import { ApiRequestError } from '@/shared/api-client-management/http';
import { listNotificationsResponseSchema } from '@/shared/notifications/notification-contracts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = async () => {
	try {
		const response = await api.request<unknown>('/notifications?limit=10', {
			auth: true,
		});

		return Response.json(listNotificationsResponseSchema.parse(response), {
			headers: { 'cache-control': 'no-store' },
		});
	} catch (error) {
		if (error instanceof ApiRequestError) {
			return Response.json(
				{ message: error.payload?.message ?? 'Unable to load notifications.' },
				{ status: error.status, headers: { 'cache-control': 'no-store' } },
			);
		}

		throw error;
	}
};
