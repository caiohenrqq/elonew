import { WorkersHealthUseCase } from '@modules/system/application/use-cases/health/workers-health.use-case';
import { Controller, Get } from '@nestjs/common';

@Controller('api/health/workers')
export class WorkersHealthController {
	constructor(private readonly workersHealthUseCase: WorkersHealthUseCase) {}

	@Get()
	async getStatus(): Promise<{ status: 'ok' }> {
		return this.workersHealthUseCase.check();
	}
}
