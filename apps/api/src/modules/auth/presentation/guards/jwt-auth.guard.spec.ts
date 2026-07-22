import { createHmac } from 'node:crypto';
import type { AppSettingsService } from '@app/common/settings/app-settings.service';
import {
	AuthenticationRequiredError,
	AuthUserBlockedError,
	InvalidAccessTokenError,
} from '@modules/auth/domain/auth.errors';
import { HmacAccessTokenService } from '@modules/auth/infrastructure/security/hmac-access-token.service';
import { JwtAuthGuard } from '@modules/auth/presentation/guards/jwt-auth.guard';
import type { UserRepositoryPort } from '@modules/users/application/ports/user-repository.port';
import { User } from '@modules/users/domain/user.entity';
import type { ContextType, ExecutionContext, Type } from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';

function encodeBase64Url(value: string): string {
	return Buffer.from(value).toString('base64url');
}

function signTestToken(
	payload: Record<string, unknown>,
	secret: string,
): string {
	const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
	const body = encodeBase64Url(JSON.stringify(payload));
	const signature = createHmac('sha256', secret)
		.update(`${header}.${body}`)
		.digest('base64url');

	return `${header}.${body}.${signature}`;
}

type TestRequest = {
	headers: Record<string, string>;
	user?: { id: string; role: Role };
};

class TestExecutionContext implements ExecutionContext {
	constructor(private readonly request: TestRequest) {}

	getClass<T = unknown>(): Type<T> {
		return JwtAuthGuard as unknown as Type<T>;
	}

	getHandler(): (...args: unknown[]) => unknown {
		return createExecutionContext as (...args: unknown[]) => unknown;
	}

	getArgs<T extends unknown[] = unknown[]>(): T {
		return [this.request] as unknown as T;
	}

	getArgByIndex<T = unknown>(index: number): T {
		return this.getArgs<[T]>()[index];
	}

	switchToHttp() {
		return {
			getRequest: <T = unknown>() => this.request as T,
			getResponse: <T = unknown>() => undefined as T,
			getNext: <T = unknown>() => undefined as T,
		};
	}

	switchToRpc() {
		return {
			getData: <T = unknown>() => undefined as T,
			getContext: <T = unknown>() => undefined as T,
		};
	}

	switchToWs() {
		return {
			getData: <T = unknown>() => undefined as T,
			getClient: <T = unknown>() => undefined as T,
			getPattern: <T = unknown>() => undefined as T,
		};
	}

	getType<TContext extends string = ContextType>(): TContext {
		return 'http' as TContext;
	}
}

function createExecutionContext(
	headers: Record<string, string>,
): ExecutionContext {
	return new TestExecutionContext({ headers });
}

describe('JwtAuthGuard', () => {
	const user = (role = Role.CLIENT, isBlocked = false) =>
		User.rehydrate({
			id: 'user-1',
			username: 'user',
			email: 'user@example.com',
			passwordHash: 'hash',
			role,
			isActive: true,
			isBlocked,
			emailConfirmedAt: new Date(),
			emailConfirmationTokenHash: null,
			emailConfirmationTokenExpiresAt: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	const users = (current = user()) =>
		({
			findById: jest.fn().mockResolvedValue(current),
		}) as unknown as UserRepositoryPort;

	it('attaches the current persisted role from a valid bearer token', async () => {
		const appSettings: Pick<AppSettingsService, 'jwtAccessTokenSecret'> = {
			jwtAccessTokenSecret: 'test-secret',
		};
		const guard = new JwtAuthGuard(
			new HmacAccessTokenService(appSettings as AppSettingsService),
			users(user(Role.ADMIN)),
		);
		const token = signTestToken(
			{
				sub: 'user-1',
				role: Role.CLIENT,
				expiresAt: Math.floor(Date.now() / 1000) + 900,
				issuedAt: Math.floor(Date.now() / 1000),
			},
			appSettings.jwtAccessTokenSecret,
		);
		const context = createExecutionContext({
			authorization: `Bearer ${token}`,
		});

		await expect(guard.canActivate(context)).resolves.toBe(true);
		expect(context.switchToHttp().getRequest().user).toEqual({
			id: 'user-1',
			role: Role.ADMIN,
		});
	});

	it('rejects requests without a bearer token', async () => {
		const appSettings: Pick<AppSettingsService, 'jwtAccessTokenSecret'> = {
			jwtAccessTokenSecret: 'test-secret',
		};
		const guard = new JwtAuthGuard(
			new HmacAccessTokenService(appSettings as AppSettingsService),
			users(),
		);
		const context = createExecutionContext({});

		await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
			AuthenticationRequiredError,
		);
	});

	it('rejects tokens with malformed json payloads', async () => {
		const appSettings: Pick<AppSettingsService, 'jwtAccessTokenSecret'> = {
			jwtAccessTokenSecret: 'test-secret',
		};
		const guard = new JwtAuthGuard(
			new HmacAccessTokenService(appSettings as AppSettingsService),
			users(),
		);
		const header = encodeBase64Url(
			JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
		);
		const payload = encodeBase64Url('not-json');
		const signature = createHmac('sha256', appSettings.jwtAccessTokenSecret)
			.update(`${header}.${payload}`)
			.digest('base64url');
		const context = createExecutionContext({
			authorization: `Bearer ${header}.${payload}.${signature}`,
		});

		await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
			InvalidAccessTokenError,
		);
	});

	it('rejects expired tokens', async () => {
		const appSettings: Pick<AppSettingsService, 'jwtAccessTokenSecret'> = {
			jwtAccessTokenSecret: 'test-secret',
		};
		const guard = new JwtAuthGuard(
			new HmacAccessTokenService(appSettings as AppSettingsService),
			users(),
		);
		const token = signTestToken(
			{
				sub: 'user-1',
				role: Role.CLIENT,
				expiresAt: Math.floor(Date.now() / 1000) - 60,
				issuedAt: Math.floor(Date.now() / 1000) - 120,
			},
			appSettings.jwtAccessTokenSecret,
		);
		const context = createExecutionContext({
			authorization: `Bearer ${token}`,
		});

		await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
			InvalidAccessTokenError,
		);
	});

	it('rejects a blocked user immediately', async () => {
		const appSettings: Pick<AppSettingsService, 'jwtAccessTokenSecret'> = {
			jwtAccessTokenSecret: 'test-secret',
		};
		const guard = new JwtAuthGuard(
			new HmacAccessTokenService(appSettings as AppSettingsService),
			users(user(Role.CLIENT, true)),
		);
		const token = signTestToken(
			{
				sub: 'user-1',
				role: Role.CLIENT,
				expiresAt: Math.floor(Date.now() / 1000) + 900,
				issuedAt: Math.floor(Date.now() / 1000),
			},
			appSettings.jwtAccessTokenSecret,
		);
		await expect(
			guard.canActivate(
				createExecutionContext({ authorization: `Bearer ${token}` }),
			),
		).rejects.toBeInstanceOf(AuthUserBlockedError);
	});
});
