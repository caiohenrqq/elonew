'use server';

import {
	DEV_USER_PASSWORD,
	DEV_USERS,
	type DevUserRole,
} from '@packages/shared/testing/dev-users';
import { redirect } from 'next/navigation';
import { getAuthErrorMessage } from '@/shared/api-client-management/user-messages';
import { isDevelopmentRuntime } from '@/shared/env/web-env';
import { assertSameOriginRequest } from '@/shared/security/origin';
import {
	type LoginFormInput,
	loginFormSchema,
	type RegisterFormInput,
	registerFormSchema,
} from '../model/auth-schemas';
import { confirmEmail, login, logout, register } from '../server/auth-service';

export type AuthActionState = {
	error?: string;
	success?: boolean;
};

export type DevLoginRole = DevUserRole;

export const loginAction = async (
	input: LoginFormInput,
): Promise<AuthActionState> => {
	const parsed = loginFormSchema.safeParse(input);
	if (!parsed.success) {
		return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
	}

	let redirectPath = '/client';
	try {
		await assertSameOriginRequest();
		const session = await login(parsed.data);
		if (session.user.role === 'BOOSTER') redirectPath = '/booster';
		if (session.user.role === 'ADMIN') redirectPath = '/admin';
	} catch (error) {
		return {
			error: getAuthErrorMessage(error, 'login'),
		};
	}

	redirect(redirectPath);
};

export const devLoginAction = async (
	role: DevLoginRole,
): Promise<AuthActionState> => {
	if (!isDevelopmentRuntime()) {
		return { error: 'Login rápido disponível apenas em desenvolvimento.' };
	}

	const devUser = DEV_USERS.find((user) => user.role === role);
	if (!devUser) return { error: 'Perfil de desenvolvimento inválido.' };

	try {
		await assertSameOriginRequest();
		await login({
			email: devUser.email,
			password: DEV_USER_PASSWORD,
		});
	} catch (error) {
		return {
			error: getAuthErrorMessage(error, 'login'),
		};
	}

	redirect(devUser.dashboardPath);
};

export const registerAction = async (
	input: RegisterFormInput,
): Promise<AuthActionState> => {
	const parsed = registerFormSchema.safeParse(input);
	if (!parsed.success) {
		return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
	}

	try {
		await assertSameOriginRequest();
		const { termsAccepted: _termsAccepted, ...registerInput } = parsed.data;
		await register(registerInput);
		return { success: true };
	} catch (error) {
		return {
			error: getAuthErrorMessage(error, 'register'),
		};
	}
};

export const confirmEmailAction = async (
	token: string,
): Promise<AuthActionState> => {
	const trimmedToken = token.trim();
	if (!trimmedToken) return { error: 'Token de confirmação ausente.' };

	try {
		await assertSameOriginRequest();
		await confirmEmail(trimmedToken);
		return { success: true };
	} catch (error) {
		return {
			error: getAuthErrorMessage(error, 'confirmEmail'),
		};
	}
};

export const logoutAction = async () => {
	await assertSameOriginRequest();
	await logout();
	redirect('/login');
};
