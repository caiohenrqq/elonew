import type { AppSettingsService } from '@app/common/settings/app-settings.service';
import { SetMetadata } from '@nestjs/common';

type NumericSettingKey = {
	[K in Extract<
		keyof AppSettingsService,
		string
	>]: AppSettingsService[K] extends number ? K : never;
}[Extract<keyof AppSettingsService, string>];

export type RouteThrottleMetadata = {
	name: string;
	limit: NumericSettingKey;
	ttlSeconds: NumericSettingKey;
};

export const ROUTE_THROTTLE_METADATA_KEY = 'routeThrottle';

// The limits live on AppSettingsService and are resolved per request, but the
// setting names are checked at compile time so a renamed setting breaks the
// build instead of silently disabling the limit.
export const RouteThrottle = (metadata: RouteThrottleMetadata) =>
	SetMetadata(ROUTE_THROTTLE_METADATA_KEY, metadata);
