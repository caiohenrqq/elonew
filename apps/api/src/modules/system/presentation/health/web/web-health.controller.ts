import { WebHealthUseCase } from '@modules/system/application/use-cases/health/web-health.use-case';
import { Controller, Get } from '@nestjs/common';

@Controller('api/health/web')
export class WebHealthController {
	constructor(private readonly webHealthUseCase: WebHealthUseCase) {}

	@Get()
	async getStatus(): Promise<{ status: 'ok' }> {
		return this.webHealthUseCase.check();
	}
}
