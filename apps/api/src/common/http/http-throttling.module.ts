import { RouteThrottlerGuard } from '@app/common/http/route-throttler.guard';
import { Global, Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

@Global()
@Module({
	imports: [ThrottlerModule.forRoot([])],
	providers: [RouteThrottlerGuard],
	exports: [ThrottlerModule, RouteThrottlerGuard],
})
export class HttpThrottlingModule {}
