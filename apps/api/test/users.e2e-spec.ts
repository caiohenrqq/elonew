import { AppSettingsService } from '@app/common/settings/app-settings.service';
import { USER_REPOSITORY_KEY } from '@modules/users/application/ports/user-repository.port';
import { InMemoryUserRepository } from '@modules/users/infrastructure/repositories/in-memory-user.repository';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Users (e2e)', () => {
	let app: INestApplication;

	async function createApp(
		settingsOverride?: Partial<Record<keyof AppSettingsService, unknown>>,
	) {
		const testingModule = Test.createTestingModule({
			imports: [AppModule],
		})
			.overrideProvider(USER_REPOSITORY_KEY)
			.useClass(InMemoryUserRepository);

		if (settingsOverride) {
			testingModule.overrideProvider(AppSettingsService).useValue({
				port: 3000,
				jwtAccessTokenSecret: 'test-secret',
				emailConfirmationTokenSecret: 'test-email-confirmation-secret',
				emailConfirmationTokenTtlMinutes: 30,
				usersSignUpThrottleLimit: 3,
				usersSignUpThrottleTtlSeconds: 60,
				usersConfirmEmailThrottleLimit: 5,
				usersConfirmEmailThrottleTtlSeconds: 60,
				walletLockPeriodInHours: 72,
				isDevelopment: false,
				isTest: true,
				...settingsOverride,
			});
		}

		const moduleRef = await testingModule.compile();
		app = moduleRef.createNestApplication();
		await app.init();
	}

	beforeEach(async () => {
		await createApp();
	});

	afterEach(async () => {
		await app.close();
	});

	it('creates a pending user through the sign-up endpoint', async () => {
		await request(app.getHttpServer())
			.post('/users/sign-up')
			.send({
				username: 'summoner1',
				email: 'summoner1@example.com',
				password: 'Secret123456!',
			})
			.expect(201)
			.expect(({ body }) => {
				expect(body).toEqual({
					id: expect.any(String),
					username: 'summoner1',
					email: 'summoner1@example.com',
					role: 'CLIENT',
					isActive: false,
					emailConfirmedAt: null,
					emailConfirmationPreviewToken: expect.any(String),
				});
			});
	});

	it('rejects invalid sign-up payloads with bad request', async () => {
		await request(app.getHttpServer())
			.post('/users/sign-up')
			.send({
				username: 'summoner1',
				email: 'summoner1@example.com',
				password: 'short',
			})
			.expect(400);
	});

	it('confirms email and activates the pending user', async () => {
		let token = '';

		await request(app.getHttpServer())
			.post('/users/sign-up')
			.send({
				username: 'summoner2',
				email: 'summoner2@example.com',
				password: 'Secret123456!',
			})
			.expect(201)
			.expect(({ body }) => {
				token = body.emailConfirmationPreviewToken;
			});

		await request(app.getHttpServer())
			.post('/users/confirm-email')
			.send({ token })
			.expect(201)
			.expect(({ body }) => {
				expect(body).toEqual({
					id: expect.any(String),
					isActive: true,
					emailConfirmedAt: expect.any(String),
					emailConfirmationToken: null,
				});
			});
	});

	it('returns bad request when the confirmation token is invalid', async () => {
		await request(app.getHttpServer())
			.post('/users/confirm-email')
			.send({ token: 'missing-token' })
			.expect(400, {
				message: 'Invalid confirmation token.',
				error: 'Bad Request',
				statusCode: 400,
			});
	});

	it('returns a generic duplicate-registration response', async () => {
		const payload = {
			username: 'summoner3',
			email: 'summoner3@example.com',
			password: 'Secret123456!',
		};

		await request(app.getHttpServer())
			.post('/users/sign-up')
			.send(payload)
			.expect(201);

		await request(app.getHttpServer())
			.post('/users/sign-up')
			.send({
				...payload,
				password: 'Secret123456!',
			})
			.expect(400, {
				message: 'Registration is unavailable.',
				error: 'Bad Request',
				statusCode: 400,
			});
	});

	it('rate-limits repeated sign-up attempts', async () => {
		for (let index = 0; index < 3; index++) {
			await request(app.getHttpServer())
				.post('/users/sign-up')
				.send({
					username: `summoner-rate-${index}`,
					email: `summoner-rate-${index}@example.com`,
					password: 'Secret123456!',
				})
				.expect(201);
		}

		await request(app.getHttpServer())
			.post('/users/sign-up')
			.send({
				username: 'summoner-rate-overflow',
				email: 'summoner-rate-overflow@example.com',
				password: 'Secret123456!',
			})
			.expect(429);
	});

	it('rate-limits confirm-email requests using the configured settings', async () => {
		await app.close();
		await createApp({
			usersConfirmEmailThrottleLimit: 1,
			usersConfirmEmailThrottleTtlSeconds: 60,
		});

		await request(app.getHttpServer())
			.post('/users/confirm-email')
			.send({ token: 'missing-token-1' })
			.expect(400);

		await request(app.getHttpServer())
			.post('/users/confirm-email')
			.send({ token: 'missing-token-2' })
			.expect(429);
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
			await request(app.getHttpServer()).get('/api/health/api').expect(200, {
				status: 'ok',
			});
		}
	});
});
