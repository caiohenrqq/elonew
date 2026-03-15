import { createHttpApp } from '@app/common/http/http-app.factory';
import { AppSettingsService } from '@app/common/settings/app-settings.service';

async function bootstrap() {
	const app = await createHttpApp();
	const appSettings = app.get(AppSettingsService);

	await app.listen(appSettings.port, '0.0.0.0');
}
bootstrap();
