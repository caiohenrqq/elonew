import { timingSafeEqual } from 'node:crypto';
import { AppSettingsService } from '@app/common/settings/app-settings.service';
import {
	InternalApiKeyRequiredError,
	InvalidInternalApiKeyError,
} from '@modules/auth/domain/auth.errors';
import {
	CanActivate,
	type ExecutionContext,
	Inject,
	Injectable,
} from '@nestjs/common';

type InternalApiKeyGuardSettings = Pick<AppSettingsService, 'internalApiKey'>;

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
	constructor(
		@Inject(AppSettingsService)
		private readonly appSettings: InternalApiKeyGuardSettings,
	) {}

	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest<{
			headers?: { 'x-internal-api-key'?: string };
		}>();
		const providedApiKey = request.headers?.['x-internal-api-key'];
		if (!providedApiKey) throw new InternalApiKeyRequiredError();

		const expectedApiKey = Buffer.from(this.appSettings.internalApiKey);
		const receivedApiKey = Buffer.from(providedApiKey);

		if (
			expectedApiKey.length !== receivedApiKey.length ||
			!timingSafeEqual(expectedApiKey, receivedApiKey)
		)
			throw new InvalidInternalApiKeyError();

		return true;
	}
}
