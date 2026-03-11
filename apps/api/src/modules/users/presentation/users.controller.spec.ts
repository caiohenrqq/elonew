import { AppSettingsService } from '@app/common/settings/app-settings.service';
import { ConfirmEmailUseCase } from '@modules/users/application/use-cases/confirm-email/confirm-email.use-case';
import { SignUpUseCase } from '@modules/users/application/use-cases/sign-up/sign-up.use-case';
import { UsersController } from '@modules/users/presentation/users.controller';

function makeController(
	appSettings: Pick<AppSettingsService, 'isDevelopment' | 'isTest'>,
) {
	const signUpUseCase = {
		execute: jest.fn(),
	} as unknown as SignUpUseCase;
	const confirmEmailUseCase = {
		execute: jest.fn(),
	} as unknown as ConfirmEmailUseCase;

	return {
		controller: new UsersController(
			signUpUseCase,
			confirmEmailUseCase,
			appSettings as AppSettingsService,
		),
		signUpExecute: signUpUseCase.execute as jest.Mock,
	};
}

describe('UsersController', () => {
	it('returns the preview token in test mode', async () => {
		const { controller, signUpExecute } = makeController({
			isDevelopment: false,
			isTest: true,
		});
		signUpExecute.mockResolvedValue({
			id: 'user-1',
			username: 'summoner1',
			email: 'summoner1@example.com',
			role: 'CLIENT',
			isActive: false,
			emailConfirmedAt: null,
			emailConfirmationPreviewToken: 'preview-token',
		});

		await expect(
			controller.signUp({
				username: 'summoner1',
				email: 'summoner1@example.com',
				password: 'Secret123456!',
			}),
		).resolves.toMatchObject({
			emailConfirmationPreviewToken: 'preview-token',
		});
	});

	it('hides the preview token outside development and test', async () => {
		const { controller, signUpExecute } = makeController({
			isDevelopment: false,
			isTest: false,
		});
		signUpExecute.mockResolvedValue({
			id: 'user-1',
			username: 'summoner1',
			email: 'summoner1@example.com',
			role: 'CLIENT',
			isActive: false,
			emailConfirmedAt: null,
			emailConfirmationPreviewToken: 'preview-token',
		});

		await expect(
			controller.signUp({
				username: 'summoner1',
				email: 'summoner1@example.com',
				password: 'Secret123456!',
			}),
		).resolves.toMatchObject({
			emailConfirmationPreviewToken: null,
		});
	});
});
