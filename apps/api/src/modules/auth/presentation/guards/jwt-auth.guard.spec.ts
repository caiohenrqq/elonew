import { createHmac } from 'node:crypto';
import type { AppSettingsService } from '@app/common/settings/app-settings.service';
import { JwtAuthGuard } from '@modules/auth/presentation/guards/jwt-auth.guard';
import type { ContextType, ExecutionContext, Type } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
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
		return createExecutionContext;
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
	it('attaches the authenticated user from a valid bearer token', () => {
		const appSettings: Pick<AppSettingsService, 'jwtAccessTokenSecret'> = {
			jwtAccessTokenSecret: 'test-secret',
		};
		const guard = new JwtAuthGuard(appSettings);
		const token = signTestToken(
			{ sub: 'user-1', role: Role.CLIENT },
			appSettings.jwtAccessTokenSecret,
		);
		const context = createExecutionContext({
			authorization: `Bearer ${token}`,
		});

		expect(guard.canActivate(context)).toBe(true);
		expect(context.switchToHttp().getRequest().user).toEqual({
			id: 'user-1',
			role: Role.CLIENT,
		});
	});

	it('rejects requests without a bearer token', () => {
		const appSettings: Pick<AppSettingsService, 'jwtAccessTokenSecret'> = {
			jwtAccessTokenSecret: 'test-secret',
		};
		const guard = new JwtAuthGuard(appSettings);
		const context = createExecutionContext({});

		expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
	});

	it('rejects tokens with malformed json payloads', () => {
		const appSettings: Pick<AppSettingsService, 'jwtAccessTokenSecret'> = {
			jwtAccessTokenSecret: 'test-secret',
		};
		const guard = new JwtAuthGuard(appSettings);
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

		expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
	});
});
