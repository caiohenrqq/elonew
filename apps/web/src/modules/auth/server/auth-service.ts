import { api } from '@/shared/api-client-management/api-client';
import {
	type AuthSessionInput,
	clearAuthSession,
	getAuthSession,
	setAuthSession,
} from '@/shared/auth/session';

export type LoginInput = {
	email: string;
	password: string;
};

export type RegisterInput = {
	username: string;
	email: string;
	password: string;
};

export const login = async (input: LoginInput) => {
	const session = await api.request<AuthSessionInput>('/auth/login', {
		method: 'POST',
		body: JSON.stringify(input),
	});
	await setAuthSession(session);
};

export const register = async (input: RegisterInput) => {
	await api.request('/users/sign-up', {
		method: 'POST',
		body: JSON.stringify(input),
	});
};

export const logout = async () => {
	const session = await getAuthSession();

	if (session) {
		try {
			await api.request('/auth/logout', {
				method: 'POST',
				body: JSON.stringify({ refreshToken: session.refreshToken }),
			});
		} catch {
			// The API remains the auth authority; local cookies are cleared either way.
		}
	}

	await clearAuthSession();
};
