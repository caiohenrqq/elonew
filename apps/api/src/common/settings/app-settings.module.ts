import { envSchema } from '@config/env/env.schema';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppSettingsService } from './app-settings.service';

@Global()
@Module({
	imports: [
		ConfigModule.forRoot({
			validate: (config) => envSchema.parse(config),
			isGlobal: true,
		}),
	],
	providers: [AppSettingsService],
	exports: [AppSettingsService],
})
export class AppSettingsModule {}
