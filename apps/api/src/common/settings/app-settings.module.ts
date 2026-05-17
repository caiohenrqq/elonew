import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from '@packages/config/env/env.config';
import { AppSettingsService } from './app-settings.service';

@Global()
@Module({
	imports: [
		ConfigModule.forRoot({
			validate: validateEnv,
			isGlobal: true,
		}),
	],
	providers: [AppSettingsService],
	exports: [AppSettingsService],
})
export class AppSettingsModule {}
