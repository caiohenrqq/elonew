const DEFAULT_API_BASE_URL = 'http://localhost:3000';

export const getWebApiBaseUrl = () => {
	const configuredUrl = process.env.API_URL;
	if (configuredUrl) return configuredUrl.replace(/\/$/, '');
	if (process.env.NODE_ENV !== 'production') return DEFAULT_API_BASE_URL;
	throw new Error('API_URL is required in production.');
};

export const getWebSessionSecret = () => {
	const secret = process.env.WEB_SESSION_SECRET;
	if (!secret) throw new Error('WEB_SESSION_SECRET is required.');
	return secret;
};

export const getWebAppUrl = () => process.env.NEXT_PUBLIC_APP_URL;

export const isProductionRuntime = () => process.env.NODE_ENV === 'production';
