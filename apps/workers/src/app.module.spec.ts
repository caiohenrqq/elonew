import assert from 'node:assert/strict';
import test from 'node:test';
import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';
import { ProcessWalletFundsReleaseJobUseCase } from './modules/wallet-funds-release/application/use-cases/process-wallet-funds-release-job/process-wallet-funds-release-job.use-case';

test('AppModule wires the wallet funds release worker use case through Nest DI', async () => {
	const moduleRef = await Test.createTestingModule({
		imports: [AppModule],
	}).compile();

	assert.ok(moduleRef.get(ProcessWalletFundsReleaseJobUseCase));
});
