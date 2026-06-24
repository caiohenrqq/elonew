import { Public } from '@modules/auth/presentation/decorators/public.decorator';
import { ApiHealthUseCase } from '@modules/system/application/use-cases/health/api-health.use-case';
import { Controller, Get } from '@nestjs/common';

@Public()
@Controller('health')
export class ApiHealthController {
	constructor(private readonly apiHealthUseCase: ApiHealthUseCase) {}

	@Get()
	async getStatus(): Promise<{ status: 'ok' }> {
		return this.apiHealthUseCase.check();
	}
}
