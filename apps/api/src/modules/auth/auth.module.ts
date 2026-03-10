import { AppSettingsModule } from '@app/common/settings/app-settings.module';
import { JwtAuthGuard } from '@modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/presentation/guards/roles.guard';
import { Module } from '@nestjs/common';

@Module({
	imports: [AppSettingsModule],
	providers: [JwtAuthGuard, RolesGuard],
	exports: [JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
