import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
	(_: unknown, context: ExecutionContext): AuthenticatedUser | undefined => {
		const request = context
			.switchToHttp()
			.getRequest<{ user?: AuthenticatedUser }>();
		return request.user;
	},
);
