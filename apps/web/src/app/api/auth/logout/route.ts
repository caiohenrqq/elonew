import { logout } from '@/features/auth/server/auth-service';
import { apiErrorResponse } from '@/shared/api-client-management/http';
import { assertSameOriginRequest } from '@/shared/security/origin';

export const POST = async () => {
	try {
		await assertSameOriginRequest();
		await logout();
		return new Response(null, { status: 204 });
	} catch (error) {
		return apiErrorResponse(error);
	}
};
