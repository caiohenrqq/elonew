import { ApiMutationThrottlerGuard } from '@app/common/http/api-mutation-throttler.guard';
import { AppSettingsService } from '@app/common/settings/app-settings.service';
import type { ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerException, ThrottlerModule } from '@nestjs/throttler';

type RequestStub = {
	method: string;
	url: string;
	ip: string;
	headers: Record<string, string | string[] | undefined>;
};

const createContext = (request: Partial<RequestStub>): ExecutionContext => {
	const fullRequest: RequestStub = {
		method: 'POST',
		url: '/orders/order-1/credentials',
		ip: '10.0.0.1',
		headers: {},
		...request,
	};

	return {
		getType: () => 'http',
		getHandler: () => function testHandler() {},
		getClass: () => class TestController {},
		switchToHttp: () => ({
			getRequest: () => fullRequest,
			getResponse: () => ({ header: jest.fn() }),
		}),
	} as unknown as ExecutionContext;
};

describe('ApiMutationThrottlerGuard', () => {
	const openModules: Array<{ close(): Promise<void> }> = [];

	afterEach(async () => {
		await Promise.all(openModules.splice(0).map((module) => module.close()));
	});

	const createGuard = async (limit: number) => {
		const moduleRef = await Test.createTestingModule({
			imports: [ThrottlerModule.forRoot([])],
			providers: [
				ApiMutationThrottlerGuard,
				{
					provide: AppSettingsService,
					useValue: {
						apiMutationThrottleLimit: limit,
						apiMutationThrottleTtlSeconds: 60,
					},
				},
			],
		}).compile();
		await moduleRef.init();
		openModules.push(moduleRef);

		return moduleRef.get(ApiMutationThrottlerGuard);
	};

	it('allows read requests regardless of volume', async () => {
		const guard = await createGuard(1);

		for (let i = 0; i < 5; i++)
			await expect(
				guard.canActivate(createContext({ method: 'GET' })),
			).resolves.toBe(true);
	});

	it('skips internal worker routes', async () => {
		const guard = await createGuard(1);

		for (let i = 0; i < 5; i++)
			await expect(
				guard.canActivate(
					createContext({
						url: '/wallets/internal/release-matured-funds',
					}),
				),
			).resolves.toBe(true);
	});

	it('throttles mutating requests beyond the configured limit', async () => {
		const guard = await createGuard(2);

		await expect(guard.canActivate(createContext({}))).resolves.toBe(true);
		await expect(guard.canActivate(createContext({}))).resolves.toBe(true);
		await expect(guard.canActivate(createContext({}))).rejects.toBeInstanceOf(
			ThrottlerException,
		);
	});

	it('tracks clients by cf-connecting-ip so tunnel traffic is not one bucket', async () => {
		const guard = await createGuard(1);

		await expect(
			guard.canActivate(
				createContext({ headers: { 'cf-connecting-ip': '203.0.113.1' } }),
			),
		).resolves.toBe(true);
		await expect(
			guard.canActivate(
				createContext({ headers: { 'cf-connecting-ip': '203.0.113.2' } }),
			),
		).resolves.toBe(true);
		await expect(
			guard.canActivate(
				createContext({ headers: { 'cf-connecting-ip': '203.0.113.1' } }),
			),
		).rejects.toBeInstanceOf(ThrottlerException);
	});
});
