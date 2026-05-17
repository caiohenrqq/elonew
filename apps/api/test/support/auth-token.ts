import { createHmac } from 'node:crypto';

export const getTestJwtSecret = () =>
	process.env.JWT_ACCESS_TOKEN_SECRET ?? 'dev-secret';

export function signTestAccessToken(payload: Record<string, unknown>): string {
	const now = Math.floor(Date.now() / 1000);
	const header = Buffer.from(
		JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
	).toString('base64url');
	const body = Buffer.from(
		JSON.stringify({
			issuedAt: now,
			expiresAt: now + 900,
			...payload,
		}),
	).toString('base64url');
	const signature = createHmac('sha256', getTestJwtSecret())
		.update(`${header}.${body}`)
		.digest('base64url');

	return `${header}.${body}.${signature}`;
}
