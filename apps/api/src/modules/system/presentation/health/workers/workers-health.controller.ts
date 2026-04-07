import { Public } from '@modules/auth/presentation/decorators/public.decorator';
import { WorkersHealthUseCase } from '@modules/system/application/use-cases/health/workers-health.use-case';
import { Controller, Get } from '@nestjs/common';

@Public()
@Controller('api/health/workers')
export class WorkersHealthController {
	constructor(private readonly workersHealthUseCase: WorkersHealthUseCase) {}

	@Get()
	async getStatus(): Promise<{ status: 'ok' }> {
		return this.workersHealthUseCase.check();
	}
}
