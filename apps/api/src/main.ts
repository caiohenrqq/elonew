import {
	createHttpApp,
	initializeHttpApp,
} from '@app/common/http/http-app.factory';
import { AppSettingsService } from '@app/common/settings/app-settings.service';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
	const app = await createHttpApp({ bufferLogs: true });
	app.useLogger(app.get(Logger));
	await initializeHttpApp(app);

	const appSettings = app.get(AppSettingsService);

	app.enableShutdownHooks();
	await app.listen(appSettings.port, '0.0.0.0');
}
bootstrap();
