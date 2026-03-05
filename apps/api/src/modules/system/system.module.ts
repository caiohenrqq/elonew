import { ApiHealthUseCase } from '@modules/system/application/use-cases/health/api-health.use-case';
import { DatabaseHealthUseCase } from '@modules/system/application/use-cases/health/database-health.use-case';
import { WebHealthUseCase } from '@modules/system/application/use-cases/health/web-health.use-case';
import { WorkersHealthUseCase } from '@modules/system/application/use-cases/health/workers-health.use-case';
import { ApiHealthController } from '@modules/system/presentation/health/api/api-health.controller';
import { DatabaseHealthController } from '@modules/system/presentation/health/database/database-health.controller';
import { WebHealthController } from '@modules/system/presentation/health/web/web-health.controller';
import { WorkersHealthController } from '@modules/system/presentation/health/workers/workers-health.controller';
import { Module } from '@nestjs/common';

@Module({
	controllers: [
		ApiHealthController,
		DatabaseHealthController,
		WebHealthController,
		WorkersHealthController,
	],
	providers: [
		ApiHealthUseCase,
		DatabaseHealthUseCase,
		WebHealthUseCase,
		WorkersHealthUseCase,
	],
})
export class SystemModule {}
