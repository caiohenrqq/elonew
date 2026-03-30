import { AppSettingsService } from '@app/common/settings/app-settings.service';
import { USER_REPOSITORY_KEY } from '@modules/users/application/ports/user-repository.port';
import { InMemoryUserRepository } from '@modules/users/infrastructure/repositories/in-memory-user.repository';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import type { ApiHttpApp } from '../src/common/http/http-app.factory';
import { createTestHttpApp, requestHttp } from './create-test-http-app';
import { createTestAppSettings } from './test-app-settings';

describe('Users (e2e)', () => {
	let app: ApiHttpApp;

	async function createApp(
		settingsOverride?: Partial<Record<keyof AppSettingsService, unknown>>,
	) {
		const testingModule = Test.createTestingModule({
			imports: [AppModule],
		})
			.overrideProvider(USER_REPOSITORY_KEY)
			.useClass(InMemoryUserRepository);

		if (settingsOverride) {
			testingModule
				.overrideProvider(AppSettingsService)
				.useValue(createTestAppSettings(settingsOverride));
		}

		const moduleRef = await testingModule.compile();
		app = await createTestHttpApp(moduleRef);
	}

	beforeEach(async () => {
		await createApp();
	});

	afterEach(async () => {
		await app.close();
	});

	it('creates a pending user through the sign-up endpoint', async () => {
		await requestHttp(app)
			.post('/users/sign-up')
			.send({
				username: 'summoner1',
				email: 'summoner1@example.com',
				password: 'Secret123456!',
			})
			.expect(201)
			.expect<{
				id: string;
				username: string;
				email: string;
				role: string;
				isActive: boolean;
				emailConfirmedAt: null;
				emailConfirmationPreviewToken: string;
			}>(({ body }) => {
				expect(body).toEqual({
					id: expect.any(String),
					username: 'summoner1',
					email: 'summoner1@example.com',
					role: 'CLIENT',
					isActive: false,
					emailConfirmedAt: null,
					emailConfirmationPreviewToken: expect.any(String),
				});
			})
			.execute();
	});

	it('hides the preview token outside development and test', async () => {
		await app.close();
		await createApp({
			isDevelopment: false,
			isTest: false,
		});

		await requestHttp(app)
			.post('/users/sign-up')
			.send({
				username: 'summoner-hidden-token',
				email: 'summoner-hidden-token@example.com',
				password: 'Secret123456!',
			})
			.expect(201)
			.expect<{
				emailConfirmationPreviewToken: null;
			}>(({ body }) => {
				expect(body.emailConfirmationPreviewToken).toBeNull();
			})
			.execute();
	});

	it('rejects invalid sign-up payloads with bad request', async () => {
		await requestHttp(app)
			.post('/users/sign-up')
			.send({
				username: 'summoner1',
				email: 'summoner1@example.com',
				password: 'short',
			})
			.expect(400)
			.execute();
	});

	it('confirms email and activates the pending user', async () => {
		let token = '';

		await requestHttp(app)
			.post('/users/sign-up')
			.send({
				username: 'summoner2',
				email: 'summoner2@example.com',
				password: 'Secret123456!',
			})
			.expect(201)
			.expect<{ emailConfirmationPreviewToken: string }>(({ body }) => {
				token = body.emailConfirmationPreviewToken;
			})
			.execute();

		await requestHttp(app)
			.post('/users/confirm-email')
			.send({ token })
			.expect(201)
			.expect<{
				id: string;
				isActive: boolean;
				emailConfirmedAt: string;
				emailConfirmationToken: null;
			}>(({ body }) => {
				expect(body).toEqual({
					id: expect.any(String),
					isActive: true,
					emailConfirmedAt: expect.any(String),
					emailConfirmationToken: null,
				});
			})
			.execute();
	});

	it('returns bad request when the confirmation token is invalid', async () => {
		await requestHttp(app)
			.post('/users/confirm-email')
			.send({ token: 'missing-token' })
			.expect(400, {
				message: 'Invalid confirmation token.',
				error: 'Bad Request',
				statusCode: 400,
			})
			.execute();
	});

	it('returns a generic duplicate-registration response', async () => {
		const payload = {
			username: 'summoner3',
			email: 'summoner3@example.com',
			password: 'Secret123456!',
		};

		await requestHttp(app)
			.post('/users/sign-up')
			.send(payload)
			.expect(201)
			.execute();

		await requestHttp(app)
			.post('/users/sign-up')
			.send({
				...payload,
				password: 'Secret123456!',
			})
			.expect(400, {
				message: 'Registration is unavailable.',
				error: 'Bad Request',
				statusCode: 400,
			})
			.execute();
	});

	it('rate-limits repeated sign-up attempts', async () => {
		for (let index = 0; index < 3; index++) {
			await requestHttp(app)
				.post('/users/sign-up')
				.send({
					username: `summoner-rate-${index}`,
					email: `summoner-rate-${index}@example.com`,
					password: 'Secret123456!',
				})
				.expect(201)
				.execute();
		}

		await requestHttp(app)
			.post('/users/sign-up')
			.send({
				username: 'summoner-rate-overflow',
				email: 'summoner-rate-overflow@example.com',
				password: 'Secret123456!',
			})
			.expect(429)
			.execute();
	});

	it('rate-limits confirm-email requests using the configured settings', async () => {
		await app.close();
		await createApp({
			usersConfirmEmailThrottleLimit: 1,
			usersConfirmEmailThrottleTtlSeconds: 60,
		});

		await requestHttp(app)
			.post('/users/confirm-email')
			.send({ token: 'missing-token-1' })
			.expect(400)
			.execute();

		await requestHttp(app)
			.post('/users/confirm-email')
			.send({ token: 'missing-token-2' })
			.expect(429)
			.execute();
	});

	it('does not throttle unrelated routes with the users limits', async () => {
		await app.close();
		await createApp({
			usersSignUpThrottleLimit: 1,
			usersSignUpThrottleTtlSeconds: 60,
			usersConfirmEmailThrottleLimit: 1,
			usersConfirmEmailThrottleTtlSeconds: 60,
		});

		for (let index = 0; index < 3; index++) {
			await requestHttp(app)
				.get('/api/health/api')
				.expect(200, {
					status: 'ok',
				})
				.execute();
		}
	});
});
