import { ApiHealthController } from '@modules/system/presentation/health/api/api-health.controller';
import { SystemModule } from '@modules/system/system.module';
import { Test } from '@nestjs/testing';

describe('System module integration (api health)', () => {
	let controller: ApiHealthController;

	beforeEach(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [SystemModule],
		}).compile();

		controller = moduleRef.get(ApiHealthController);
	});

	it('returns ok status', async () => {
		await expect(controller.getStatus()).resolves.toEqual({ status: 'ok' });
	});
});
