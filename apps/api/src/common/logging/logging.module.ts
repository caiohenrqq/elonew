import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { AppSettingsService } from '@app/common/settings/app-settings.service';
import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

@Module({
	imports: [
		LoggerModule.forRootAsync({
			inject: [AppSettingsService],
			useFactory: (settings: AppSettingsService) => ({
				pinoHttp: {
					level: 'info',
					base: { service: 'api', env: settings.nodeEnv },
					genReqId: (req: IncomingMessage, res: ServerResponse) => {
						const header = req.headers['x-request-id'];
						const requestId =
							(Array.isArray(header) ? header.at(0) : header) ?? randomUUID();
						res.setHeader('x-request-id', requestId);
						return requestId;
					},
					autoLogging: {
						ignore: (req: IncomingMessage) =>
							(req.url ?? '').startsWith('/api/health'),
					},
					redact: {
						paths: [
							'req.headers.authorization',
							'req.headers.cookie',
							'res.headers["set-cookie"]',
						],
						remove: true,
					},
					transport: settings.isProduction
						? undefined
						: { target: 'pino-pretty', options: { singleLine: true } },
				},
			}),
		}),
	],
	exports: [LoggerModule],
})
export class LoggingModule {}
