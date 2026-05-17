import { headers } from 'next/headers';
import { ApiRequestError } from '@/shared/api-client-management/http';
import { getWebAppUrl } from '@/shared/env/web-env';

type OriginCheckInput = {
	origin: string | null;
	host: string | null;
	forwardedHost?: string | null;
	appUrl?: string | null;
};

export const isAllowedOrigin = ({
	origin,
	host,
	forwardedHost,
	appUrl,
}: OriginCheckInput) => {
	if (!origin) return false;

	const normalizedOrigin = parseUrl(origin);
	if (!normalizedOrigin) return false;

	const expectedHost = forwardedHost ?? host;
	if (expectedHost && normalizedOrigin.host === expectedHost) return true;

	if (!appUrl) return false;

	const normalizedAppUrl = parseUrl(appUrl);
	return normalizedAppUrl?.origin === normalizedOrigin.origin;
};

export const assertSameOriginRequest = async () => {
	const headerStore = await headers();
	const isAllowed = isAllowedOrigin({
		origin: headerStore.get('origin'),
		host: headerStore.get('host'),
		forwardedHost: headerStore.get('x-forwarded-host'),
		appUrl: getWebAppUrl(),
	});

	if (!isAllowed) {
		throw new ApiRequestError(403, {
			message: 'Entre novamente para continuar.',
		});
	}
};

const parseUrl = (value: string) => {
	try {
		return new URL(value);
	} catch {
		return null;
	}
};
