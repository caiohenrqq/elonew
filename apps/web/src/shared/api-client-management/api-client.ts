import 'server-only';

import {
	type AuthSessionInput,
	clearAuthSession,
	getAuthSession,
	isAccessTokenExpired,
	setAuthSession,
} from '@/shared/auth/session';
import { type ApiErrorPayload, ApiRequestError } from './http';

type ApiRequestOptions = RequestInit & {
	auth?: boolean;
	allowSessionRefresh?: boolean;
	retryOnUnauthorized?: boolean;
};

const DEFAULT_API_BASE_URL = 'http://localhost:3000';

const getApiBaseUrl = () => {
	return (process.env.API_URL ?? DEFAULT_API_BASE_URL).replace(/\/$/, '');
};

const parseJsonResponse = async (response: Response) => {
	const text = await response.text();
	if (!text) return null;

	try {
		return JSON.parse(text) as unknown;
	} catch {
		return { message: text };
	}
};

const refreshSession = async (refreshToken: string) => {
	const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ refreshToken }),
		cache: 'no-store',
	});

	if (!response.ok) {
		await clearAuthSession();
		throw new ApiRequestError(
			response.status,
			(await parseJsonResponse(response)) as ApiErrorPayload | null,
		);
	}

	const session = (await response.json()) as AuthSessionInput;
	await setAuthSession(session);
	return session.accessToken;
};

const buildRequestHeaders = (
	init: RequestInit,
	auth: boolean,
	accessToken?: string,
) => {
	const headers = new Headers(init.headers);
	if (init.body && !headers.has('content-type')) {
		headers.set('content-type', 'application/json');
	}
	if (auth && accessToken)
		headers.set('authorization', `Bearer ${accessToken}`);
	return headers;
};

const request = async <T>(
	path: string,
	{
		auth = false,
		allowSessionRefresh = true,
		retryOnUnauthorized = true,
		...init
	}: ApiRequestOptions = {},
): Promise<T> => {
	const session = await getAuthSession();
	let accessToken = session?.accessToken;

	if (auth) {
		if (!session) {
			throw new ApiRequestError(401, {
				message: 'Entre novamente para continuar.',
			});
		}
		if (isAccessTokenExpired(session)) {
			if (!allowSessionRefresh) {
				throw new ApiRequestError(401, {
					message: 'Entre novamente para continuar.',
				});
			}
			accessToken = await refreshSession(session.refreshToken);
		}
	}

	const headers = buildRequestHeaders(init, auth, accessToken);

	const response = await fetch(`${getApiBaseUrl()}${path}`, {
		...init,
		headers,
		cache: 'no-store',
	});

	if (
		response.status === 401 &&
		auth &&
		allowSessionRefresh &&
		retryOnUnauthorized &&
		session
	) {
		const nextAccessToken = await refreshSession(session.refreshToken);
		const retryHeaders = new Headers(headers);
		retryHeaders.set('authorization', `Bearer ${nextAccessToken}`);

		return request<T>(path, {
			...init,
			auth,
			retryOnUnauthorized: false,
			headers: retryHeaders,
		});
	}

	if (!response.ok) {
		throw new ApiRequestError(
			response.status,
			(await parseJsonResponse(response)) as ApiErrorPayload | null,
		);
	}

	return (await parseJsonResponse(response)) as T;
};

export const api = {
	request,
};
