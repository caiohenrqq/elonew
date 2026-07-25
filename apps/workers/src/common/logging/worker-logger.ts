import { AppSettingsService } from '@app/common/settings/app-settings.service';
import { Inject, Injectable } from '@nestjs/common';
import { type Logger, pino } from 'pino';

// Base fields mirror the API logger so both services answer the same queries in
// Loki, which parses the JSON line and its numeric `level`.
@Injectable()
export class WorkerLogger {
	private readonly logger: Logger;

	constructor(
		@Inject(AppSettingsService)
		private readonly appSettings: AppSettingsService,
	) {
		this.logger = pino({
			level: 'info',
			base: {
				service: 'workers',
				env: this.appSettings.nodeEnv,
				version: process.env.APP_VERSION ?? 'unknown',
			},
		});
	}

	info(event: object): void {
		this.logger.info(event);
	}

	error(event: object): void {
		this.logger.error(event);
	}
}
