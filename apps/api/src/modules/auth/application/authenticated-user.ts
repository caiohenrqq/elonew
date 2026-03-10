import type { Role } from '@packages/auth/roles/role';

export type AuthenticatedUser = {
	id: string;
	role: Role;
};
