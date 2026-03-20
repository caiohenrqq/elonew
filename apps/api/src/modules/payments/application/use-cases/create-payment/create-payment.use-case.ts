import {
	ORDER_PAYMENT_AMOUNT_PORT_KEY,
	type OrderPaymentAmountPort,
} from '@modules/payments/application/ports/order-payment-amount.port';
import {
	ORDER_STATUS_PORT_KEY,
	type OrderStatusPort,
} from '@modules/payments/application/ports/order-status.port';
import {
	PAYMENT_REPOSITORY_KEY,
	type PaymentRepositoryPort,
} from '@modules/payments/application/ports/payment-repository.port';
import { Payment } from '@modules/payments/domain/payment.entity';
import {
	PaymentAlreadyExistsError,
	PaymentOrderNotFoundError,
} from '@modules/payments/domain/payment.errors';
import type { PaymentStatus } from '@modules/payments/domain/payment-status';
import { Inject, Injectable } from '@nestjs/common';
import type { PaymentMethod } from '@shared/payments/payment-method';

type CreatePaymentInput = {
	clientId: string;
	paymentId: string;
	orderId: string;
	paymentMethod: PaymentMethod;
};

type CreatePaymentOutput = {
	id: string;
	orderId: string;
	status: PaymentStatus;
	grossAmount: number;
	boosterAmount: number;
	paymentMethod: PaymentMethod;
};

@Injectable()
export class CreatePaymentUseCase {
	constructor(
		@Inject(PAYMENT_REPOSITORY_KEY)
		private readonly paymentRepository: PaymentRepositoryPort,
		@Inject(ORDER_STATUS_PORT_KEY)
		private readonly orderStatusPort: OrderStatusPort,
		@Inject(ORDER_PAYMENT_AMOUNT_PORT_KEY)
		private readonly orderPaymentAmountPort: OrderPaymentAmountPort,
	) {}

	async execute(input: CreatePaymentInput): Promise<CreatePaymentOutput> {
		const existingPayment = await this.paymentRepository.findById(
			input.paymentId,
		);
		if (existingPayment) throw new PaymentAlreadyExistsError();
		const orderStatus = await this.orderStatusPort.findByOrderIdForClient(
			input.orderId,
			input.clientId,
		);
		if (!orderStatus) throw new PaymentOrderNotFoundError();
		const grossAmount =
			await this.orderPaymentAmountPort.findByOrderIdForClient(
				input.orderId,
				input.clientId,
			);
		if (grossAmount === null) throw new PaymentOrderNotFoundError();

		const payment = Payment.create({
			id: input.paymentId,
			orderId: input.orderId,
			grossAmount,
			paymentMethod: input.paymentMethod,
		});

		await this.paymentRepository.save(payment);

		return {
			id: payment.id,
			orderId: payment.orderId,
			status: payment.status,
			grossAmount: payment.grossAmount,
			boosterAmount: payment.boosterAmount,
			paymentMethod: payment.paymentMethod,
		};
	}
}
