import type { OrderCredentialsAccessLogger } from '@modules/orders/application/logging/order-credentials-access.logger';
import type {
	OrderCredentialRevealInput,
	OrderCredentialRevealRecorderPort,
} from '@modules/orders/application/ports/order-credential-reveal-recorder.port';
import type { OrderCredentialsReaderPort } from '@modules/orders/application/ports/order-credentials-reader.port';
import { RevealOrderCredentialsUseCase } from '@modules/orders/application/use-cases/reveal-order-credentials/reveal-order-credentials.use-case';
import type { OrderCredentials } from '@modules/orders/domain/order.entity';
import {
	OrderCredentialsNotFoundError,
	OrderNotFoundError,
} from '@modules/orders/domain/order.errors';

const CREDENTIALS: OrderCredentials = {
	login: 'client@example.com',
	summonerName: 'Summoner#BR1',
	password: 'super-secret',
};

class StubCredentialsReader implements OrderCredentialsReaderPort {
	constructor(
		private readonly result: { credentials: OrderCredentials | null } | null,
	) {}

	calls: Array<{ orderId: string; boosterId: string }> = [];

	async findCredentialsForBooster(
		orderId: string,
		boosterId: string,
	): Promise<{ credentials: OrderCredentials | null } | null> {
		this.calls.push({ orderId, boosterId });
		return this.result;
	}
}

class StubRevealRecorder implements OrderCredentialRevealRecorderPort {
	constructor(private readonly failure?: Error) {}

	recorded: OrderCredentialRevealInput[] = [];

	async record(reveal: OrderCredentialRevealInput): Promise<void> {
		if (this.failure) throw this.failure;
		this.recorded.push(reveal);
	}
}

const buildLogger = () => {
	const emitted: Array<Record<string, unknown>> = [];
	const logger = {
		emit: (event: Record<string, unknown>) => {
			emitted.push({ ...event });
		},
	} as unknown as OrderCredentialsAccessLogger;

	return { emitted, logger };
};

describe('RevealOrderCredentialsUseCase', () => {
	it('returns the stored credentials to the assigned booster', async () => {
		const reader = new StubCredentialsReader({ credentials: CREDENTIALS });
		const recorder = new StubRevealRecorder();
		const { logger, emitted } = buildLogger();
		const useCase = new RevealOrderCredentialsUseCase(reader, recorder, logger);

		const credentials = await useCase.execute({
			orderId: 'order-1',
			boosterId: 'booster-1',
		});

		expect(credentials).toEqual(CREDENTIALS);
		expect(reader.calls).toEqual([
			{ orderId: 'order-1', boosterId: 'booster-1' },
		]);
		expect(recorder.recorded).toEqual([
			{ orderId: 'order-1', boosterId: 'booster-1' },
		]);
		expect(emitted).toEqual([
			expect.objectContaining({
				event: 'order.credentials_reveal',
				outcome: 'success',
				order_id: 'order-1',
				booster_id: 'booster-1',
			}),
		]);
	});

	it('keeps credential values out of the emitted log event', async () => {
		const reader = new StubCredentialsReader({ credentials: CREDENTIALS });
		const { logger, emitted } = buildLogger();
		const useCase = new RevealOrderCredentialsUseCase(
			reader,
			new StubRevealRecorder(),
			logger,
		);

		await useCase.execute({ orderId: 'order-1', boosterId: 'booster-1' });

		const logged = JSON.stringify(emitted);
		for (const value of Object.values(CREDENTIALS))
			expect(logged).not.toContain(value);
	});

	it('hides orders that are not revealable by this booster', async () => {
		const { logger, emitted } = buildLogger();
		const useCase = new RevealOrderCredentialsUseCase(
			new StubCredentialsReader(null),
			new StubRevealRecorder(),
			logger,
		);

		await expect(
			useCase.execute({ orderId: 'order-1', boosterId: 'other-booster' }),
		).rejects.toThrow(OrderNotFoundError);
		expect(emitted).toEqual([
			expect.objectContaining({
				outcome: 'denied',
				error_type: 'OrderNotFoundError',
			}),
		]);
	});

	it('reports when the client has not submitted credentials yet', async () => {
		const recorder = new StubRevealRecorder();
		const { logger } = buildLogger();
		const useCase = new RevealOrderCredentialsUseCase(
			new StubCredentialsReader({ credentials: null }),
			recorder,
			logger,
		);

		await expect(
			useCase.execute({ orderId: 'order-1', boosterId: 'booster-1' }),
		).rejects.toThrow(OrderCredentialsNotFoundError);
		expect(recorder.recorded).toEqual([]);
	});

	it('withholds the credentials when the reveal cannot be audited', async () => {
		const { logger, emitted } = buildLogger();
		const useCase = new RevealOrderCredentialsUseCase(
			new StubCredentialsReader({ credentials: CREDENTIALS }),
			new StubRevealRecorder(new Error('audit table unavailable')),
			logger,
		);

		await expect(
			useCase.execute({ orderId: 'order-1', boosterId: 'booster-1' }),
		).rejects.toThrow('audit table unavailable');
		expect(emitted).toEqual([
			expect.objectContaining({ outcome: 'error', error_type: 'Error' }),
		]);
	});
});
