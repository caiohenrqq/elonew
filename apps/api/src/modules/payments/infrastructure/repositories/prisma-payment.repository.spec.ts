import { Payment } from '@modules/payments/domain/payment.entity';
import { PrismaPaymentRepository } from '@modules/payments/infrastructure/repositories/prisma-payment.repository';
import { PaymentMethod as PrismaPaymentMethod } from '@prisma/client';

describe('PrismaPaymentRepository', () => {
	it('saves and rehydrates a payment', async () => {
		const findUnique = jest.fn().mockResolvedValue({
			id: 'payment-1',
			orderId: 'order-1',
			status: 'held',
			grossAmount: 100,
			boosterAmount: 70,
			paymentMethod: PrismaPaymentMethod.PIX,
			gateway: 'MERCADO_PAGO',
			gatewayReferenceId: null,
			gatewayId: 'mp-payment-1',
			gatewayStatus: 'approved',
			gatewayStatusDetail: null,
		});
		const upsert = jest.fn().mockResolvedValue(undefined);
		const prisma = {
			payment: {
				findUnique,
				findFirst: jest.fn(),
				upsert,
			},
		};
		const repository = new PrismaPaymentRepository(prisma as never);
		const payment = Payment.create({
			id: 'payment-1',
			orderId: 'order-1',
			grossAmount: 100,
			paymentMethod: 'pix',
		});
		payment.attachGatewayDetails({
			gatewayId: 'mp-payment-1',
			gatewayStatus: 'approved',
		});
		payment.confirm();

		await repository.save(payment);

		await expect(repository.findById('payment-1')).resolves.toMatchObject({
			id: 'payment-1',
			orderId: 'order-1',
			status: 'held',
			grossAmount: 100,
			boosterAmount: 70,
			paymentMethod: 'pix',
			gateway: 'MERCADO_PAGO',
			gatewayReferenceId: null,
			gatewayId: 'mp-payment-1',
			gatewayStatus: 'approved',
			gatewayStatusDetail: null,
		});
		expect(upsert).toHaveBeenCalledWith({
			where: { id: 'payment-1' },
			create: {
				id: 'payment-1',
				orderId: 'order-1',
				status: 'held',
				grossAmount: 100,
				boosterAmount: 70,
				paymentMethod: PrismaPaymentMethod.PIX,
				gateway: 'MERCADO_PAGO',
				gatewayReferenceId: null,
				gatewayId: 'mp-payment-1',
				gatewayStatus: 'approved',
				gatewayStatusDetail: null,
			},
			update: {
				status: 'held',
				grossAmount: 100,
				boosterAmount: 70,
				paymentMethod: PrismaPaymentMethod.PIX,
				gateway: 'MERCADO_PAGO',
				gatewayReferenceId: null,
				gatewayId: 'mp-payment-1',
				gatewayStatus: 'approved',
				gatewayStatusDetail: null,
			},
		});
	});

	it.each([
		['credit_card', PrismaPaymentMethod.CREDIT_CARD],
		['pix', PrismaPaymentMethod.PIX],
		['boleto', PrismaPaymentMethod.BOLETO],
	] as const)('saves %s using the expected persisted Prisma enum', async (paymentMethod, persistedPaymentMethod) => {
		const upsert = jest.fn().mockResolvedValue(undefined);
		const prisma = {
			payment: {
				findUnique: jest.fn(),
				findFirst: jest.fn(),
				upsert,
			},
		};
		const repository = new PrismaPaymentRepository(prisma as never);

		await repository.save(
			Payment.create({
				id: `payment-${paymentMethod}`,
				orderId: `order-${paymentMethod}`,
				grossAmount: 100,
				paymentMethod,
			}),
		);

		expect(upsert).toHaveBeenCalledWith({
			where: { id: `payment-${paymentMethod}` },
			create: {
				id: `payment-${paymentMethod}`,
				orderId: `order-${paymentMethod}`,
				status: 'awaiting_confirmation',
				grossAmount: 100,
				boosterAmount: 70,
				paymentMethod: persistedPaymentMethod,
				gateway: 'MERCADO_PAGO',
				gatewayReferenceId: null,
				gatewayId: null,
				gatewayStatus: null,
				gatewayStatusDetail: null,
			},
			update: {
				status: 'awaiting_confirmation',
				grossAmount: 100,
				boosterAmount: 70,
				paymentMethod: persistedPaymentMethod,
				gateway: 'MERCADO_PAGO',
				gatewayReferenceId: null,
				gatewayId: null,
				gatewayStatus: null,
				gatewayStatusDetail: null,
			},
		});
	});

	it('finds a payment by gateway id', async () => {
		const findFirst = jest.fn().mockResolvedValue({
			id: 'payment-gateway-lookup',
			orderId: 'order-gateway-lookup',
			status: 'awaiting_confirmation',
			grossAmount: 100,
			boosterAmount: 70,
			paymentMethod: PrismaPaymentMethod.PIX,
			gateway: 'MERCADO_PAGO',
			gatewayReferenceId: null,
			gatewayId: 'mp-gateway-lookup',
			gatewayStatus: 'pending',
			gatewayStatusDetail: null,
		});
		const prisma = {
			payment: {
				findUnique: jest.fn(),
				findFirst,
				upsert: jest.fn(),
			},
		};
		const repository = new PrismaPaymentRepository(prisma as never);

		await expect(
			repository.findByGatewayId('mp-gateway-lookup'),
		).resolves.toMatchObject({
			id: 'payment-gateway-lookup',
			gatewayId: 'mp-gateway-lookup',
			gatewayStatus: 'pending',
		});
		expect(findFirst).toHaveBeenCalledWith({
			where: { gatewayId: 'mp-gateway-lookup' },
		});
	});

	it('returns null when payment is missing', async () => {
		const prisma = {
			payment: {
				findUnique: jest.fn().mockResolvedValue(null),
				findFirst: jest.fn(),
				upsert: jest.fn(),
			},
		};
		const repository = new PrismaPaymentRepository(prisma as never);

		await expect(repository.findById('missing-payment')).resolves.toBeNull();
	});

	it('throws when persisted payment status is invalid', async () => {
		const prisma = {
			payment: {
				findUnique: jest.fn().mockResolvedValue({
					id: 'payment-1',
					orderId: 'order-1',
					status: 'invalid_status',
					grossAmount: 100,
					boosterAmount: 70,
					paymentMethod: PrismaPaymentMethod.PIX,
					gateway: 'MERCADO_PAGO',
					gatewayReferenceId: null,
					gatewayId: null,
					gatewayStatus: null,
					gatewayStatusDetail: null,
				}),
				findFirst: jest.fn(),
				upsert: jest.fn(),
			},
		};
		const repository = new PrismaPaymentRepository(prisma as never);

		await expect(repository.findById('payment-1')).rejects.toThrow(
			'Invalid payment status persisted: invalid_status',
		);
	});

	it('rehydrates failed payment status', async () => {
		const prisma = {
			payment: {
				findUnique: jest.fn().mockResolvedValue({
					id: 'payment-failed-1',
					orderId: 'order-failed-1',
					status: 'failed',
					grossAmount: 100,
					boosterAmount: 70,
					paymentMethod: PrismaPaymentMethod.PIX,
					gateway: 'MERCADO_PAGO',
					gatewayReferenceId: null,
					gatewayId: null,
					gatewayStatus: null,
					gatewayStatusDetail: null,
				}),
				findFirst: jest.fn(),
				upsert: jest.fn(),
			},
		};
		const repository = new PrismaPaymentRepository(prisma as never);

		await expect(
			repository.findById('payment-failed-1'),
		).resolves.toMatchObject({
			id: 'payment-failed-1',
			status: 'failed',
			paymentMethod: 'pix',
		});
	});

	it('throws when persisted payment method is invalid', async () => {
		const prisma = {
			payment: {
				findUnique: jest.fn().mockResolvedValue({
					id: 'payment-invalid-method-1',
					orderId: 'order-invalid-method-1',
					status: 'held',
					grossAmount: 100,
					boosterAmount: 70,
					paymentMethod: 'pix',
					gateway: 'MERCADO_PAGO',
					gatewayReferenceId: null,
					gatewayId: null,
					gatewayStatus: null,
					gatewayStatusDetail: null,
				}),
				findFirst: jest.fn(),
				upsert: jest.fn(),
			},
		};
		const repository = new PrismaPaymentRepository(prisma as never);

		await expect(
			repository.findById('payment-invalid-method-1'),
		).rejects.toThrow('Invalid payment method persisted: pix');
	});
});
