import { SetMetadata } from '@nestjs/common';
import type { Role } from '@packages/auth/roles/role';

export const ROLES_METADATA_KEY = 'roles';

export const Roles = (...roles: Role[]) =>
	SetMetadata(ROLES_METADATA_KEY, roles);
