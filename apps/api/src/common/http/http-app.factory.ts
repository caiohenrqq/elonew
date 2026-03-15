import { AppModule } from '@app/app.module';
import type { NestApplicationOptions } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
	FastifyAdapter,
	type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import type { TestingModule } from '@nestjs/testing';

export type ApiHttpApp = NestFastifyApplication;

export async function createHttpApp(
	options?: NestApplicationOptions,
): Promise<ApiHttpApp> {
	return NestFactory.create<ApiHttpApp>(
		AppModule,
		new FastifyAdapter(),
		options,
	);
}

export async function initializeHttpApp(app: ApiHttpApp): Promise<ApiHttpApp> {
	await app.init();
	await app.getHttpAdapter().getInstance().ready();

	return app;
}

export function createTestingHttpApp(moduleRef: TestingModule): ApiHttpApp {
	return moduleRef.createNestApplication<ApiHttpApp>(new FastifyAdapter());
}
