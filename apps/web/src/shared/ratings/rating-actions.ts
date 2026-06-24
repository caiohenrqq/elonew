'use server';

import { api } from '@/shared/api-client-management/api-client';
import { ApiRequestError } from '@/shared/api-client-management/http';
import { getAuthSession } from '@/shared/auth/session';
import { assertSameOriginRequest } from '@/shared/security/origin';
import {
	type RatingOutput,
	ratingSchema,
	ratingsSchema,
	submitRatingInputSchema,
} from './rating-contracts';

export type SubmitRatingActionState = {
	error?: string;
	rating?: RatingOutput;
};

export const getOrderRatings = async (
	orderId: string,
): Promise<RatingOutput[]> => {
	const response = await api.request<unknown>(
		`/ratings/orders/${encodeURIComponent(orderId)}`,
		{ auth: true },
	);

	return ratingsSchema.parse(response);
};

export const submitRatingAction = async (
	orderId: string,
	_previousState: SubmitRatingActionState,
	formData: FormData,
): Promise<SubmitRatingActionState> => {
	const parsed = submitRatingInputSchema.safeParse({
		orderId,
		score: formData.get('score'),
		comment: formData.get('comment') || undefined,
	});
	if (!parsed.success) {
		return { error: 'Selecione uma nota de 1 a 5.' };
	}

	try {
		const session = await getAuthSession();
		if (!session) return { error: 'Sessão expirada. Entre novamente.' };

		await assertSameOriginRequest();

		const response = await api.request<unknown>('/ratings', {
			auth: true,
			method: 'POST',
			body: JSON.stringify(parsed.data),
		});

		return { rating: ratingSchema.parse(response) };
	} catch (error) {
		if (error instanceof ApiRequestError) {
			return { error: error.message };
		}
		return { error: 'Não foi possível enviar a avaliação.' };
	}
};
