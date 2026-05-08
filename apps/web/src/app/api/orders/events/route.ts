import { getAuthSession, isAccessTokenExpired } from '@/shared/auth/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DEFAULT_API_BASE_URL = 'http://localhost:3000';

const getApiBaseUrl = () => {
	const configuredUrl = process.env.API_URL;
	if (configuredUrl) return configuredUrl.replace(/\/$/, '');
	if (process.env.NODE_ENV !== 'production') return DEFAULT_API_BASE_URL;
	throw new Error('API_URL is required in production.');
};

const makeSseResponse = (body: BodyInit) =>
	new Response(body, {
		headers: {
			'cache-control': 'no-cache, no-transform',
			connection: 'keep-alive',
			'content-type': 'text/event-stream',
			'x-accel-buffering': 'no',
		},
	});

export const GET = async (request: Request) => {
	const session = await getAuthSession();
	if (!session || isAccessTokenExpired(session)) {
		return makeSseResponse('event: auth.expired\ndata: {}\n\n');
	}

	const response = await fetch(`${getApiBaseUrl()}${'/orders/events'}`, {
		headers: {
			authorization: `Bearer ${session.accessToken}`,
			accept: 'text/event-stream',
		},
		cache: 'no-store',
		signal: request.signal,
	});

	if (!response.ok || !response.body) {
		return new Response(response.body, {
			status: response.status,
			headers: {
				'cache-control': 'no-store',
				'content-type':
					response.headers.get('content-type') ?? 'application/json',
			},
		});
	}

	return makeSseResponse(response.body);
};
