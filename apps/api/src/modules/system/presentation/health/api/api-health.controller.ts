import { ApiHealthUseCase } from '@modules/system/application/use-cases/health/api-health.use-case';
import { Controller, Get } from '@nestjs/common';

@Controller('api/health/api')
export class ApiHealthController {
	constructor(private readonly apiHealthUseCase: ApiHealthUseCase) {}

	@Get()
	async getStatus(): Promise<{ status: 'ok' }> {
		return this.apiHealthUseCase.check();
	}
}
