import { WebHealthController } from '@modules/system/presentation/health/web/web-health.controller';
import { SystemModule } from '@modules/system/system.module';
import { Test, type TestingModule } from '@nestjs/testing';

describe('System module integration (web health)', () => {
	let controller: WebHealthController;
	let moduleRef: TestingModule;

	beforeEach(async () => {
		moduleRef = await Test.createTestingModule({
			imports: [SystemModule],
		}).compile();

		controller = moduleRef.get(WebHealthController);
	});

	afterEach(async () => {
		await moduleRef.close();
	});

	it('returns ok status', async () => {
		await expect(controller.getStatus()).resolves.toEqual({ status: 'ok' });
	});
});
