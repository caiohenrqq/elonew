const DEFAULT_PUBLIC_API_BASE_URL = 'http://localhost:3000';

export const getPublicApiBaseUrl = () => {
	const configuredUrl = process.env.NEXT_PUBLIC_API_URL;
	if (configuredUrl) return configuredUrl.replace(/\/$/, '');
	if (process.env.NODE_ENV !== 'production') return DEFAULT_PUBLIC_API_BASE_URL;
	throw new Error('NEXT_PUBLIC_API_URL is required in production.');
};
