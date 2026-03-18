import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppSettingsService } from './app-settings.service';
import { validateWorkerEnv } from './worker-env';

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
