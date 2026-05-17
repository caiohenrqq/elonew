import type { AppSettingsService } from '@app/common/settings/app-settings.service';
import type { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { ServerOptions } from 'socket.io';

export class ApiSocketIoAdapter extends IoAdapter {
	constructor(
		app: INestApplicationContext,
		private readonly appSettings: AppSettingsService,
	) {
		super(app);
	}

	override createIOServer(port: number, options?: ServerOptions) {
		return super.createIOServer(port, {
			...options,
			cors: {
				origin: this.appSettings.chatSocketAllowedOrigins,
				credentials: true,
			},
		});
	}
}
