import { AppModule } from '@app/app.module';
import type { NestApplicationOptions } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
	FastifyAdapter,
	type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import type { TestingModule } from '@nestjs/testing';

export type ApiHttpApp = NestFastifyApplication;
const HTTP_BODY_LIMIT_BYTES = 1_048_576;

export function createHttpApp(
	options?: NestApplicationOptions,
): Promise<ApiHttpApp> {
	return NestFactory.create<ApiHttpApp>(
		AppModule,
		new FastifyAdapter({
			bodyLimit: HTTP_BODY_LIMIT_BYTES,
		}),
		options,
	);
}

export async function initializeHttpApp(app: ApiHttpApp): Promise<ApiHttpApp> {
	registerHttpSecurity(app);
	await app.init();
	await app.getHttpAdapter().getInstance().ready();

	return app;
}

export function createTestingHttpApp(moduleRef: TestingModule): ApiHttpApp {
	return moduleRef.createNestApplication<ApiHttpApp>(
		new FastifyAdapter({
			bodyLimit: HTTP_BODY_LIMIT_BYTES,
		}),
	);
}

function registerHttpSecurity(app: ApiHttpApp): void {
	const instance = app.getHttpAdapter().getInstance() as {
		addHook(
			name: 'onSend',
			hook: (
				request: unknown,
				reply: {
					header(name: string, value: string): void;
				},
				payload: unknown,
			) => Promise<unknown> | unknown,
		): void;
	};

	instance.addHook(
		'onSend',
		async (
			_request,
			reply: {
				header(name: string, value: string): void;
			},
			payload: unknown,
		) => {
			reply.header('X-Content-Type-Options', 'nosniff');
			reply.header('X-Frame-Options', 'DENY');
			reply.header('Referrer-Policy', 'no-referrer');

			return payload;
		},
	);
}
