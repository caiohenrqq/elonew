import { AppSettingsService } from '@app/common/settings/app-settings.service';
import { AUTH_SESSION_REPOSITORY_KEY } from '@modules/auth/application/ports/auth-session-repository.port';
import { ORDER_CHECKOUT_PORT_KEY } from '@modules/orders/application/ports/order-checkout.port';
import { ORDER_QUOTE_REPOSITORY_KEY } from '@modules/orders/application/ports/order-quote-repository.port';
import { ORDER_REPOSITORY_KEY } from '@modules/orders/application/ports/order-repository.port';
import { USER_REPOSITORY_KEY } from '@modules/users/application/ports/user-repository.port';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import type { ApiHttpApp } from '../src/common/http/http-app.factory';
import { createTestHttpApp, requestHttp } from './create-test-http-app';
import { InMemoryOrderRepository } from './support/in-memory/orders/in-memory-order.repository';
import { InMemoryOrderCheckoutRepository } from './support/in-memory/orders/in-memory-order-checkout.repository';
import { InMemoryOrderQuoteRepository } from './support/in-memory/orders/in-memory-order-quote.repository';
import { InMemoryUserRepository } from './support/in-memory/users/in-memory-user.repository';
import { createTestAppSettings } from './test-app-settings';

class InMemoryAuthSessionRepository {
	private readonly sessions = new Map<
		string,
		{
			id: string;
			userId: string;
			refreshTokenHash: string;
			expiresAt: Date;
			revokedAt: Date | null;
			lastUsedAt: Date | null;
			createdAt: Date;
			updatedAt: Date;
		}
	>();
	private nextId = 1;

	async findByRefreshTokenHash(tokenHash: string) {
		return (
			[...this.sessions.values()].find(
				(session) => session.refreshTokenHash === tokenHash,
			) ?? null
		);
	}

	async create(session: {
		userId: string;
		refreshTokenHash: string;
		expiresAt: Date;
	}) {
		const createdSession = {
			id: `session-${this.nextId++}`,
			userId: session.userId,
			refreshTokenHash: session.refreshTokenHash,
			expiresAt: session.expiresAt,
			revokedAt: null,
			lastUsedAt: null,
			createdAt: new Date('2026-03-17T00:00:00.000Z'),
			updatedAt: new Date('2026-03-17T00:00:00.000Z'),
		};
		this.sessions.set(createdSession.id, createdSession);

		return createdSession;
	}

	async save(session: {
		id: string;
		userId: string;
		refreshTokenHash: string;
		expiresAt: Date;
		revokedAt: Date | null;
		lastUsedAt: Date | null;
		createdAt: Date;
		updatedAt: Date;
	}) {
		this.sessions.set(session.id, session);
	}
}

describe('Auth (e2e)', () => {
	let app: ApiHttpApp;

	async function createApp(
		settingsOverride: Partial<Record<string, unknown>> = {},
	) {
		const testingModule = Test.createTestingModule({
			imports: [AppModule],
		})
			.overrideProvider(USER_REPOSITORY_KEY)
			.useClass(InMemoryUserRepository)
			.overrideProvider(ORDER_REPOSITORY_KEY)
			.useClass(InMemoryOrderRepository)
			.overrideProvider(ORDER_CHECKOUT_PORT_KEY)
			.useClass(InMemoryOrderCheckoutRepository)
			.overrideProvider(ORDER_QUOTE_REPOSITORY_KEY)
			.useClass(InMemoryOrderQuoteRepository)
			.overrideProvider(AUTH_SESSION_REPOSITORY_KEY)
			.useClass(InMemoryAuthSessionRepository)
			.overrideProvider(AppSettingsService)
			.useValue(createTestAppSettings(settingsOverride));

		const moduleRef = await testingModule.compile();
		app = await createTestHttpApp(moduleRef);
	}

	beforeEach(async () => {
		await createApp();
	});

	afterEach(async () => {
		await app.close();
	});

	function makeOrderPayload() {
		return {
			serviceType: 'elo_boost',
			currentLeague: 'gold',
			currentDivision: 'II',
			currentLp: 50,
			desiredLeague: 'platinum',
			desiredDivision: 'IV',
			server: 'br',
			desiredQueue: 'solo_duo',
			lpGain: 20,
			deadline: '2026-03-31T00:00:00.000Z',
		};
	}

	async function createQuotedOrder(token: string): Promise<{ id: string }> {
		let quoteId = '';
		let orderId = '';

		await requestHttp(app)
			.post('/orders/quote')
			.set('Authorization', `Bearer ${token}`)
			.send(makeOrderPayload())
			.expect(201)
			.expect<{ quoteId: string }>(({ body }) => {
				quoteId = body.quoteId;
			})
			.execute();

		await requestHttp(app)
			.post('/orders')
			.set('Authorization', `Bearer ${token}`)
			.send({ quoteId })
			.expect(201)
			.expect<{ id: string }>(({ body }) => {
				orderId = body.id;
			})
			.execute();

		return { id: orderId };
	}

	it('logs in an active user and allows access to a protected route with the issued access token', async () => {
		let confirmationToken = '';
		let accessToken = '';

		await requestHttp(app)
			.post('/users/sign-up')
			.send({
				username: 'summoner1',
				email: 'summoner1@example.com',
				password: 'Secret123456!',
			})
			.expect(201)
			.expect<{ emailConfirmationPreviewToken: string }>(({ body }) => {
				confirmationToken = body.emailConfirmationPreviewToken;
			})
			.execute();

		await requestHttp(app)
			.post('/users/confirm-email')
			.send({ token: confirmationToken })
			.expect(201)
			.execute();

		await requestHttp(app)
			.post('/auth/login')
			.send({
				email: 'summoner1@example.com',
				password: 'Secret123456!',
			})
			.expect(201)
			.expect<{
				accessToken: string;
				refreshToken: string;
				expiresInSeconds: number;
			}>(({ body }) => {
				accessToken = body.accessToken;
				expect(body.refreshToken).toEqual(expect.any(String));
				expect(body.expiresInSeconds).toBeGreaterThan(0);
			})
			.execute();

		await requestHttp(app)
			.post('/orders/quote')
			.set('Authorization', `Bearer ${accessToken}`)
			.send(makeOrderPayload())
			.expect(201)
			.execute();

		await expect(createQuotedOrder(accessToken)).resolves.toMatchObject({
			id: expect.any(String),
		});
	});

	it('rejects login for inactive accounts', async () => {
		await requestHttp(app)
			.post('/users/sign-up')
			.send({
				username: 'summoner2',
				email: 'summoner2@example.com',
				password: 'Secret123456!',
			})
			.expect(201)
			.execute();

		await requestHttp(app)
			.post('/auth/login')
			.send({
				email: 'summoner2@example.com',
				password: 'Secret123456!',
			})
			.expect(403)
			.execute();
	});

	it('applies baseline security headers on API responses', async () => {
		await requestHttp(app)
			.post('/auth/login')
			.send({
				email: 'missing@example.com',
				password: 'wrong-password',
			})
			.expect(401)
			.expect(({ headers }) => {
				expect(headers['x-content-type-options']).toBe('nosniff');
				expect(headers['x-frame-options']).toBe('DENY');
				expect(headers['referrer-policy']).toBe('no-referrer');
			})
			.execute();
	});

	it('rate limits repeated login attempts', async () => {
		await app.close();
		await createApp({
			authLoginThrottleLimit: 1,
			authLoginThrottleTtlSeconds: 60,
		});

		await requestHttp(app)
			.post('/auth/login')
			.send({
				email: 'missing@example.com',
				password: 'wrong-password',
			})
			.expect(401)
			.execute();

		await requestHttp(app)
			.post('/auth/login')
			.send({
				email: 'missing@example.com',
				password: 'wrong-password',
			})
			.expect(429)
			.execute();
	});

	it('rotates refresh tokens and revokes them on logout', async () => {
		let confirmationToken = '';
		let refreshToken = '';
		let rotatedRefreshToken = '';

		await requestHttp(app)
			.post('/users/sign-up')
			.send({
				username: 'summoner3',
				email: 'summoner3@example.com',
				password: 'Secret123456!',
			})
			.expect(201)
			.expect<{ emailConfirmationPreviewToken: string }>(({ body }) => {
				confirmationToken = body.emailConfirmationPreviewToken;
			})
			.execute();

		await requestHttp(app)
			.post('/users/confirm-email')
			.send({ token: confirmationToken })
			.expect(201)
			.execute();

		await requestHttp(app)
			.post('/auth/login')
			.send({
				email: 'summoner3@example.com',
				password: 'Secret123456!',
			})
			.expect(201)
			.expect<{ refreshToken: string }>(({ body }) => {
				refreshToken = body.refreshToken;
			})
			.execute();

		await requestHttp(app)
			.post('/auth/refresh')
			.send({ refreshToken })
			.expect(201)
			.expect<{ refreshToken: string }>(({ body }) => {
				rotatedRefreshToken = body.refreshToken;
				expect(rotatedRefreshToken).not.toBe(refreshToken);
			})
			.execute();

		await requestHttp(app)
			.post('/auth/refresh')
			.send({ refreshToken })
			.expect(401)
			.execute();

		await requestHttp(app)
			.post('/auth/logout')
			.send({ refreshToken: rotatedRefreshToken })
			.expect(200, { success: true })
			.execute();

		await requestHttp(app)
			.post('/auth/refresh')
			.send({ refreshToken: rotatedRefreshToken })
			.expect(401)
			.execute();
	});

	it('rate limits repeated refresh attempts', async () => {
		await app.close();
		await createApp({
			authRefreshThrottleLimit: 1,
			authRefreshThrottleTtlSeconds: 60,
		});

		let confirmationToken = '';
		let refreshToken = '';
		let rotatedRefreshToken = '';

		await requestHttp(app)
			.post('/users/sign-up')
			.send({
				username: 'summoner4',
				email: 'summoner4@example.com',
				password: 'Secret123456!',
			})
			.expect(201)
			.expect<{ emailConfirmationPreviewToken: string }>(({ body }) => {
				confirmationToken = body.emailConfirmationPreviewToken;
			})
			.execute();

		await requestHttp(app)
			.post('/users/confirm-email')
			.send({ token: confirmationToken })
			.expect(201)
			.execute();

		await requestHttp(app)
			.post('/auth/login')
			.send({
				email: 'summoner4@example.com',
				password: 'Secret123456!',
			})
			.expect(201)
			.expect<{ refreshToken: string }>(({ body }) => {
				refreshToken = body.refreshToken;
			})
			.execute();

		await requestHttp(app)
			.post('/auth/refresh')
			.send({ refreshToken })
			.expect(201)
			.expect<{ refreshToken: string }>(({ body }) => {
				rotatedRefreshToken = body.refreshToken;
			})
			.execute();

		await requestHttp(app)
			.post('/auth/refresh')
			.send({ refreshToken: rotatedRefreshToken })
			.expect(429)
			.execute();
	});
});
