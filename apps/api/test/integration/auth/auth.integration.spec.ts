import { AppSettingsService } from '@app/common/settings/app-settings.service';
import { AUTH_SESSION_REPOSITORY_KEY } from '@modules/auth/application/ports/auth-session-repository.port';
import { InMemoryAuthSessionRepository } from '@modules/auth/infrastructure/repositories/in-memory-auth-session.repository';
import { AuthController } from '@modules/auth/presentation/auth.controller';
import { USER_REPOSITORY_KEY } from '@modules/users/application/ports/user-repository.port';
import { InMemoryUserRepository } from '@modules/users/infrastructure/repositories/in-memory-user.repository';
import { UsersController } from '@modules/users/presentation/users.controller';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../../src/app.module';

describe('Auth module integration', () => {
	let usersController: UsersController;
	let authController: AuthController;

	beforeEach(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		})
			.overrideProvider(USER_REPOSITORY_KEY)
			.useClass(InMemoryUserRepository)
			.overrideProvider(AUTH_SESSION_REPOSITORY_KEY)
			.useClass(InMemoryAuthSessionRepository)
			.overrideProvider(AppSettingsService)
			.useValue({
				port: 3000,
				databaseUrl: 'postgresql://test',
				jwtAccessTokenSecret: 'test-secret',
				jwtAccessTokenTtlMinutes: 15,
				jwtRefreshTokenSecret: 'test-refresh-secret',
				jwtRefreshTokenTtlDays: 7,
				emailConfirmationTokenSecret: 'test-email-confirmation-secret',
				emailConfirmationTokenTtlMinutes: 30,
				usersSignUpThrottleLimit: 10,
				usersSignUpThrottleTtlSeconds: 60,
				usersConfirmEmailThrottleLimit: 10,
				usersConfirmEmailThrottleTtlSeconds: 60,
				walletLockPeriodInHours: 72,
				isDevelopment: false,
				isTest: true,
				isProduction: false,
			})
			.compile();

		usersController = moduleRef.get(UsersController);
		authController = moduleRef.get(AuthController);
	});

	it('logs in, rotates refresh tokens, and revokes them on logout', async () => {
		const signedUpUser = await usersController.signUp({
			username: 'summoner1',
			email: 'summoner1@example.com',
			password: 'Secret123456!',
		});
		await usersController.confirmEmail({
			token: signedUpUser.emailConfirmationPreviewToken as string,
		});

		const loginResult = await authController.login({
			email: 'summoner1@example.com',
			password: 'Secret123456!',
		});
		expect(loginResult).toMatchObject({
			accessToken: expect.any(String),
			refreshToken: expect.any(String),
			expiresInSeconds: 900,
			user: {
				email: 'summoner1@example.com',
				isActive: true,
			},
		});

		const refreshed = await authController.refresh({
			refreshToken: loginResult.refreshToken,
		});
		expect(refreshed.refreshToken).not.toBe(loginResult.refreshToken);

		await expect(
			authController.logout({
				refreshToken: refreshed.refreshToken,
			}),
		).resolves.toEqual({ success: true });

		await expect(
			authController.refresh({
				refreshToken: refreshed.refreshToken,
			}),
		).rejects.toThrow('Refresh token has been revoked.');
	});
});
