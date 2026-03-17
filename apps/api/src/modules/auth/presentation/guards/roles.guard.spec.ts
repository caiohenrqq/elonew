import { InsufficientPermissionsError } from '@modules/auth/domain/auth.errors';
import { ROLES_METADATA_KEY } from '@modules/auth/presentation/decorators/roles.decorator';
import { RolesGuard } from '@modules/auth/presentation/guards/roles.guard';
import type { ContextType, ExecutionContext, Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@packages/auth/roles/role';

type TestRequest = {
	user: {
		id: string;
		role: Role;
	};
};

class TestExecutionContext implements ExecutionContext {
	constructor(private readonly request: TestRequest) {}

	getClass<T = unknown>(): Type<T> {
		return RolesGuard as unknown as Type<T>;
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

function createExecutionContext(role: Role): ExecutionContext {
	return new TestExecutionContext({
		user: {
			id: 'user-1',
			role,
		},
	});
}

describe('RolesGuard', () => {
	it('allows users with an accepted role', () => {
		const reflector = new Reflector();
		jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.CLIENT]);
		const guard = new RolesGuard(reflector);
		const context = createExecutionContext(Role.CLIENT);

		expect(guard.canActivate(context)).toBe(true);
		expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
			ROLES_METADATA_KEY,
			[createExecutionContext, RolesGuard],
		);
	});

	it('rejects users with a role outside the accepted set', () => {
		const reflector = new Reflector();
		jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.CLIENT]);
		const guard = new RolesGuard(reflector);
		const context = createExecutionContext(Role.BOOSTER);

		expect(() => guard.canActivate(context)).toThrow(
			InsufficientPermissionsError,
		);
	});
});
