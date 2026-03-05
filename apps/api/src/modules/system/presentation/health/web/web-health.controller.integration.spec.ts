import { WebHealthController } from '@modules/system/presentation/health/web/web-health.controller';
import { SystemModule } from '@modules/system/system.module';
import { Test } from '@nestjs/testing';

describe('WebHealthController integration', () => {
	let controller: WebHealthController;

	beforeEach(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [SystemModule],
		}).compile();

		controller = moduleRef.get(WebHealthController);
	});

	it('returns ok status', async () => {
		await expect(controller.getStatus()).resolves.toEqual({ status: 'ok' });
	});
});
