import 'server-only';

import { redirect } from 'next/navigation';
import { ApiRequestError } from '@/shared/api-client-management/http';

export const redirectOnAuthError = (error: unknown): never => {
	if (
		error instanceof ApiRequestError &&
		(error.status === 401 || error.status === 403)
	)
		redirect('/login');

	throw error;
};
