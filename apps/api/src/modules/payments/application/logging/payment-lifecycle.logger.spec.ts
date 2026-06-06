import {
	markPaymentLifecycleLogError,
	type PaymentLifecycleLogEvent,
	PaymentLifecycleLogger,
} from '@modules/payments/application/logging/payment-lifecycle.logger';
import type { PinoLogger } from 'nestjs-pino';

describe('PaymentLifecycleLogger', () => {
	it('emits successful lifecycle events at info level with duration', () => {
		const pinoLogger = {
			info: jest.fn(),
			error: jest.fn(),
		} as unknown as PinoLogger;
		const logger = new PaymentLifecycleLogger(pinoLogger);
		const event: PaymentLifecycleLogEvent = {
			event: 'payment.lifecycle',
			operation: 'create',
			outcome: 'success',
			payment_id: 'payment-1',
		};

		logger.emit(event, Date.now() - 10);

		expect(pinoLogger.info).toHaveBeenCalledWith({
			...event,
			duration_ms: expect.any(Number),
		});
		expect(pinoLogger.error).not.toHaveBeenCalled();
	});

	it('normalizes errors and emits failed lifecycle events at error level', () => {
		const pinoLogger = {
			info: jest.fn(),
			error: jest.fn(),
		} as unknown as PinoLogger;
		const logger = new PaymentLifecycleLogger(pinoLogger);
		const event: PaymentLifecycleLogEvent = {
			event: 'payment.lifecycle',
			operation: 'mercadopago_webhook',
			payment_id: 'payment-1',
		};

		markPaymentLifecycleLogError(event, new Error('Gateway timeout.'));
		logger.emit(event, Date.now() - 10);

		expect(pinoLogger.error).toHaveBeenCalledWith({
			...event,
			outcome: 'error',
			error_type: 'Error',
			error_message: 'Gateway timeout.',
			duration_ms: expect.any(Number),
		});
		expect(pinoLogger.info).not.toHaveBeenCalled();
	});
});
