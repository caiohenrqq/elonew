import { Global, Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

@Global()
@Module({
	imports: [ThrottlerModule.forRoot([])],
	exports: [ThrottlerModule],
})
export class HttpThrottlingModule {}
