export type ApiErrorPayload = {
	statusCode?: number;
	message?: string | string[];
	error?: string;
};

export class ApiRequestError extends Error {
	constructor(
		public readonly status: number,
		public readonly payload: ApiErrorPayload | null,
	) {
		super(formatApiError(status, payload));
		this.name = 'ApiRequestError';
	}
}

const formatApiError = (_status: number, payload: ApiErrorPayload | null) => {
	if (!payload?.message) return `Não foi possível concluir a solicitação.`;
	if (Array.isArray(payload.message)) return payload.message.join('\n');
	return payload.message;
};

export const jsonResponse = <T>(data: T, init?: ResponseInit) => {
	return Response.json(data, init);
};

export const apiErrorResponse = (error: unknown) => {
	if (error instanceof ApiRequestError) {
		return Response.json(
			{ message: getPublicHttpErrorMessage(error.status) },
			{
				status: error.status,
			},
		);
	}

	return Response.json(
		{ message: 'Não foi possível concluir a solicitação.' },
		{ status: 500 },
	);
};

const getPublicHttpErrorMessage = (status: number) => {
	if (status === 401 || status === 403) {
		return 'Entre novamente para continuar.';
	}
	if (status === 400) return 'Confira os dados enviados e tente novamente.';
	return 'Não foi possível concluir a solicitação.';
};
