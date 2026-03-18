import { AppModule } from '@app/app.module';
import type { NestApplicationContextOptions } from '@nestjs/common/interfaces/nest-application-context-options.interface';
import { NestFactory } from '@nestjs/core';

export async function createWorkerApp(options?: NestApplicationContextOptions) {
	return NestFactory.createApplicationContext(AppModule, options);
}

export async function bootstrap() {
	const app = await createWorkerApp();
	return app;
}
