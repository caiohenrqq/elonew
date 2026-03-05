import { DatabaseHealthUseCase } from '@modules/system/application/use-cases/health/database-health.use-case';
import { Controller, Get } from '@nestjs/common';

@Controller('api/health/database')
export class DatabaseHealthController {
	constructor(private readonly databaseHealthUseCase: DatabaseHealthUseCase) {}

	@Get()
	async getStatus(): Promise<{ status: 'ok' }> {
		return this.databaseHealthUseCase.check();
	}
}
