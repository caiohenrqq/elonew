import { Public } from '@modules/auth/presentation/decorators/public.decorator';
import { WebHealthUseCase } from '@modules/system/application/use-cases/health/web-health.use-case';
import { Controller, Get } from '@nestjs/common';

@Public()
@Controller('api/health/web')
export class WebHealthController {
	constructor(private readonly webHealthUseCase: WebHealthUseCase) {}

	@Get()
	async getStatus(): Promise<{ status: 'ok' }> {
		return this.webHealthUseCase.check();
	}
}
