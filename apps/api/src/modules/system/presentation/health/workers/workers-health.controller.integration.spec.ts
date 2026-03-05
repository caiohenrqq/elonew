import { WorkersHealthController } from '@modules/system/presentation/health/workers/workers-health.controller';
import { SystemModule } from '@modules/system/system.module';
import { Test } from '@nestjs/testing';

describe('WorkersHealthController integration', () => {
	let controller: WorkersHealthController;

	beforeEach(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [SystemModule],
		}).compile();

		controller = moduleRef.get(WorkersHealthController);
	});

	it('returns ok status', async () => {
		await expect(controller.getStatus()).resolves.toEqual({ status: 'ok' });
	});
});
