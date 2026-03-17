import { Role } from '@packages/auth/roles/role';

type AuthUserTokenPayload = {
	userId: string;
	role: Role;
};

export const ACCESS_TOKEN_SERVICE_KEY = Symbol('ACCESS_TOKEN_SERVICE_KEY');
export const REFRESH_TOKEN_SERVICE_KEY = Symbol('REFRESH_TOKEN_SERVICE_KEY');

export interface AccessTokenServicePort {
	sign(input: AuthUserTokenPayload): {
		token: string;
		expiresInSeconds: number;
	};
}

export interface RefreshTokenServicePort {
	generate(): {
		rawToken: string;
		tokenHash: string;
		expiresAt: Date;
	};
	hash(token: string): string;
}
