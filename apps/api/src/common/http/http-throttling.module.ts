import { RouteThrottlerGuard } from '@app/common/http/route-throttler.guard';
import { WindowThrottlerStorage } from '@app/common/http/window-throttler.storage';
import { Global, Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

@Global()
@Module({
	imports: [
		// Built per module instantiation, not once at import: a storage shared
		// between apps would carry hit counts from one to the next.
		ThrottlerModule.forRootAsync({
			useFactory: () => ({
				throttlers: [],
				storage: new WindowThrottlerStorage(),
			}),
		}),
	],
	providers: [RouteThrottlerGuard],
	exports: [ThrottlerModule, RouteThrottlerGuard],
})
export class HttpThrottlingModule {}
