import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { workerEnvSchema } from '@packages/config/env/worker-env.schema';
import { AppSettingsService } from './app-settings.service';

@Global()
@Module({
	imports: [
		ConfigModule.forRoot({
			validate: (config) => workerEnvSchema.parse(config),
			isGlobal: true,
		}),
	],
	providers: [AppSettingsService],
	exports: [AppSettingsService],
})
export class AppSettingsModule {}
