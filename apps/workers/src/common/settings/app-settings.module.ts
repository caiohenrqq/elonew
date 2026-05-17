import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateWorkerEnv } from '@packages/config/env/worker-env.schema';
import { AppSettingsService } from './app-settings.service';

@Global()
@Module({
	imports: [
		ConfigModule.forRoot({
			validate: validateWorkerEnv,
			isGlobal: true,
		}),
	],
	providers: [AppSettingsService],
	exports: [AppSettingsService],
})
export class AppSettingsModule {}
