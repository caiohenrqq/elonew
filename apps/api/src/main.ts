import { AppModule } from '@app/app.module';
import { AppSettingsService } from '@app/common/settings/app-settings.service';
import { NestFactory } from '@nestjs/core';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const appSettings = app.get(AppSettingsService);
	await app.listen(appSettings.port);
}
bootstrap();
