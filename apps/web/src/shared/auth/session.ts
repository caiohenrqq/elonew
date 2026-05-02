import 'server-only';

import { cookies } from 'next/headers';
import {
	type SealedSessionPayload,
	sealSessionPayload,
	unsealSessionPayload,
} from './session-seal';

export const SESSION_COOKIE_NAME = 'elonew.session';

export type AuthSessionUser = {
	id: string;
	username: string;
	email: string;
	role: string;
	isActive: boolean;
};

export type AuthSessionInput = {
	accessToken: string;
	refreshToken: string;
	expiresInSeconds: number;
	user: AuthSessionUser;
};

export type AuthSession = SealedSessionPayload;

const isProduction = process.env.NODE_ENV === 'production';
const refreshTokenMaxAgeSeconds = 60 * 60 * 24 * 30;

const getCookieOptions = () => {
	return {
		httpOnly: true,
		secure: isProduction,
		sameSite: 'lax' as const,
		path: '/',
		maxAge: refreshTokenMaxAgeSeconds,
	};
};

export const getAuthSession = async (): Promise<AuthSession | null> => {
	const cookieStore = await cookies();
	const sealedSession = cookieStore.get(SESSION_COOKIE_NAME)?.value;

	if (!sealedSession) return null;

	return unsealSessionPayload(sealedSession, getSessionSecret());
};

export const setAuthSession = async (session: AuthSessionInput) => {
	const cookieStore = await cookies();
	const accessTokenExpiresAt = Date.now() + session.expiresInSeconds * 1000;
	const sealedSession = sealSessionPayload(
		{
			accessToken: session.accessToken,
			refreshToken: session.refreshToken,
			accessTokenExpiresAt,
			userId: session.user.id,
			userRole: session.user.role,
			username: session.user.username,
		},
		getSessionSecret(),
	);

	cookieStore.set(SESSION_COOKIE_NAME, sealedSession, getCookieOptions());
};

export const clearAuthSession = async () => {
	const cookieStore = await cookies();
	cookieStore.delete(SESSION_COOKIE_NAME);
};

export const isAccessTokenExpired = (session: AuthSession) => {
	return session.accessTokenExpiresAt <= Date.now() + 10_000;
};

const getSessionSecret = () => {
	const secret = process.env.WEB_SESSION_SECRET;
	if (!secret) throw new Error('WEB_SESSION_SECRET is required.');
	return secret;
};
