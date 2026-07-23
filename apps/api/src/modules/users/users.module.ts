import { EmailModule } from '@app/common/email/email.module';
import { HttpThrottlingModule } from '@app/common/http/http-throttling.module';
import { PrismaModule } from '@app/common/prisma/prisma.module';
import { EMAIL_CONFIRMATION_TOKEN_SERVICE_KEY } from '@modules/users/application/ports/email-confirmation-token.port';
import { PASSWORD_HASHER_KEY } from '@modules/users/application/ports/password-hasher.port';
import { USER_REPOSITORY_KEY } from '@modules/users/application/ports/user-repository.port';
import { ConfirmEmailUseCase } from '@modules/users/application/use-cases/confirm-email/confirm-email.use-case';
import { SetPasswordUseCase } from '@modules/users/application/use-cases/set-password/set-password.use-case';
import { SignUpUseCase } from '@modules/users/application/use-cases/sign-up/sign-up.use-case';
import { PrismaUserRepository } from '@modules/users/infrastructure/repositories/prisma-user.repository';
import { Argon2PasswordHasher } from '@modules/users/infrastructure/security/argon2-password-hasher';
import { HmacEmailConfirmationTokenService } from '@modules/users/infrastructure/security/hmac-email-confirmation-token.service';
import { UsersController } from '@modules/users/presentation/users.controller';
import { Module } from '@nestjs/common';

@Module({
	imports: [PrismaModule, HttpThrottlingModule, EmailModule],
	controllers: [UsersController],
	providers: [
		PrismaUserRepository,
		Argon2PasswordHasher,
		{
			provide: PASSWORD_HASHER_KEY,
			useExisting: Argon2PasswordHasher,
		},
		HmacEmailConfirmationTokenService,
		{
			provide: EMAIL_CONFIRMATION_TOKEN_SERVICE_KEY,
			useExisting: HmacEmailConfirmationTokenService,
		},
		{
			provide: USER_REPOSITORY_KEY,
			useExisting: PrismaUserRepository,
		},
		SignUpUseCase,
		ConfirmEmailUseCase,
		SetPasswordUseCase,
	],
	exports: [
		USER_REPOSITORY_KEY,
		PASSWORD_HASHER_KEY,
		EMAIL_CONFIRMATION_TOKEN_SERVICE_KEY,
	],
})
export class UsersModule {}
