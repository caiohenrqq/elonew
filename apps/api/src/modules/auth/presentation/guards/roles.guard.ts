import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import { ROLES_METADATA_KEY } from '@modules/auth/presentation/decorators/roles.decorator';
import {
	type CanActivate,
	type ExecutionContext,
	ForbiddenException,
	Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const acceptedRoles =
			this.reflector.getAllAndOverride<string[]>(ROLES_METADATA_KEY, [
				context.getHandler(),
				context.getClass(),
			]) ?? [];
		if (acceptedRoles.length === 0) return true;

		const request = context
			.switchToHttp()
			.getRequest<{ user?: AuthenticatedUser }>();
		if (!request.user || !acceptedRoles.includes(request.user.role))
			throw new ForbiddenException('Insufficient permissions.');

		return true;
	}
}
