import { HttpThrottlingModule } from '@app/common/http/http-throttling.module';
import { PrismaService } from '@app/common/prisma/prisma.service';
import { AppSettingsModule } from '@app/common/settings/app-settings.module';
import { AUTH_SESSION_REPOSITORY_KEY } from '@modules/auth/application/ports/auth-session-repository.port';
import {
	ACCESS_TOKEN_SERVICE_KEY,
	REFRESH_TOKEN_SERVICE_KEY,
} from '@modules/auth/application/ports/token-service.port';
import { LoginUseCase } from '@modules/auth/application/use-cases/login/login.use-case';
import { LogoutUseCase } from '@modules/auth/application/use-cases/logout/logout.use-case';
import { RefreshSessionUseCase } from '@modules/auth/application/use-cases/refresh-session/refresh-session.use-case';
import { PrismaAuthSessionRepository } from '@modules/auth/infrastructure/repositories/prisma-auth-session.repository';
import { HmacAccessTokenService } from '@modules/auth/infrastructure/security/hmac-access-token.service';
import { HmacRefreshTokenService } from '@modules/auth/infrastructure/security/hmac-refresh-token.service';
import { AuthController } from '@modules/auth/presentation/auth.controller';
import { AuthThrottlerGuard } from '@modules/auth/presentation/guards/auth-throttler.guard';
import { InternalApiKeyGuard } from '@modules/auth/presentation/guards/internal-api-key.guard';
import { JwtAuthGuard } from '@modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/presentation/guards/roles.guard';
import { UsersModule } from '@modules/users/users.module';
import { Module } from '@nestjs/common';

@Module({
	imports: [AppSettingsModule, HttpThrottlingModule, UsersModule],
	controllers: [AuthController],
	providers: [
		PrismaService,
		PrismaAuthSessionRepository,
		{
			provide: AUTH_SESSION_REPOSITORY_KEY,
			useExisting: PrismaAuthSessionRepository,
		},
		HmacAccessTokenService,
		{
			provide: ACCESS_TOKEN_SERVICE_KEY,
			useExisting: HmacAccessTokenService,
		},
		HmacRefreshTokenService,
		{
			provide: REFRESH_TOKEN_SERVICE_KEY,
			useExisting: HmacRefreshTokenService,
		},
		LoginUseCase,
		RefreshSessionUseCase,
		LogoutUseCase,
		AuthThrottlerGuard,
		InternalApiKeyGuard,
		JwtAuthGuard,
		RolesGuard,
	],
	exports: [InternalApiKeyGuard, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
