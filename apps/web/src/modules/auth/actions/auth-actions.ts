'use server';

import { redirect } from 'next/navigation';
import { getAuthErrorMessage } from '@/shared/api-client-management/user-messages';
import { assertSameOriginRequest } from '@/shared/security/origin';
import {
	type LoginFormInput,
	loginFormSchema,
	type RegisterFormInput,
	registerFormSchema,
} from '../model/auth-schemas';
import { login, logout, register } from '../server/auth-service';

export type AuthActionState = {
	error?: string;
	success?: boolean;
};

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

export const logoutAction = async () => {
	await assertSameOriginRequest();
	await logout();
	redirect('/login');
};
