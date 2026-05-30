import { z } from 'zod';

const DEFAULT_API_BASE_URL = 'http://localhost:3000';

const emptyToUndefined = (value: unknown) => {
	if (typeof value !== 'string') return value;
	const trimmed = value.trim();
	return trimmed.length === 0 ? undefined : trimmed;
};

const optionalUrlSchema = z.preprocess(
	emptyToUndefined,
	z.string().url().optional(),
);

const webSessionCookieDomainSchema = z.preprocess(
	emptyToUndefined,
	z
		.string()
		.regex(/^\.?[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/, {
			message: 'WEB_SESSION_COOKIE_DOMAIN must be a valid cookie domain.',
		})
		.optional(),
);

const webEnvSchema = z.object({
	NODE_ENV: z
		.enum(['development', 'test', 'production'])
		.default('development'),
	API_URL: optionalUrlSchema,
	WEB_SESSION_SECRET: z.preprocess(
		emptyToUndefined,
		z.string().min(32).optional(),
	),
	WEB_SESSION_COOKIE_DOMAIN: webSessionCookieDomainSchema,
	NEXT_PUBLIC_API_URL: optionalUrlSchema,
	NEXT_PUBLIC_APP_URL: optionalUrlSchema,
});

const validateWebEnv = () => {
	const result = webEnvSchema.safeParse(process.env);
	if (result.success) return result.data;

	const errors = result.error.issues
		.map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
		.join('\n');

	throw new Error(`Web env validation failed:\n${errors}`);
};

export const getWebApiBaseUrl = () => {
	const env = validateWebEnv();
	const configuredUrl = env.API_URL;
	if (configuredUrl) return configuredUrl.replace(/\/$/, '');
	if (env.NODE_ENV !== 'production') return DEFAULT_API_BASE_URL;
	throw new Error('API_URL is required in production.');
};

export const getWebSessionSecret = () => {
	const secret = validateWebEnv().WEB_SESSION_SECRET;
	if (!secret) throw new Error('WEB_SESSION_SECRET is required.');
	return secret;
};

export const getWebSessionCookieDomain = () => {
	return validateWebEnv().WEB_SESSION_COOKIE_DOMAIN;
};

export const getWebAppUrl = () => {
	const env = validateWebEnv();
	if (env.NEXT_PUBLIC_APP_URL) return env.NEXT_PUBLIC_APP_URL;
	if (env.NODE_ENV !== 'production') return undefined;
	throw new Error('NEXT_PUBLIC_APP_URL is required in production.');
};

export const isProductionRuntime = () =>
	validateWebEnv().NODE_ENV === 'production';
