import { WorkersHealthController } from '@modules/system/presentation/health/workers/workers-health.controller';
import { SystemModule } from '@modules/system/system.module';
import { Test, type TestingModule } from '@nestjs/testing';

describe('System module integration (workers health)', () => {
	let controller: WorkersHealthController;
	let moduleRef: TestingModule;

	beforeEach(async () => {
		moduleRef = await Test.createTestingModule({
			imports: [SystemModule],
		}).compile();

		controller = moduleRef.get(WorkersHealthController);
	});

	afterEach(async () => {
		await moduleRef.close();
	});

	it('returns ok status', async () => {
		await expect(controller.getStatus()).resolves.toEqual({ status: 'ok' });
	});
});
