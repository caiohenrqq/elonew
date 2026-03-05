import { ConfirmPaymentUseCase } from '@modules/payments/application/use-cases/confirm-payment.use-case';
import { CreatePaymentUseCase } from '@modules/payments/application/use-cases/create-payment.use-case';
import { GetPaymentUseCase } from '@modules/payments/application/use-cases/get-payment.use-case';
import { HandlePaymentConfirmedWebhookUseCase } from '@modules/payments/application/use-cases/handle-payment-confirmed-webhook.use-case';
import { ReleasePaymentHoldUseCase } from '@modules/payments/application/use-cases/release-payment-hold.use-case';
import {
	BadRequestException,
	Body,
	Controller,
	Get,
	HttpCode,
	NotFoundException,
	Param,
	Post,
} from '@nestjs/common';

type CreatePaymentRequestBody = {
	paymentId: string;
	orderId: string;
	grossAmount: number;
};

type HandlePaymentConfirmedWebhookRequestBody = {
	eventId: string;
	paymentId: string;
};

@Controller('payments')
export class PaymentsController {
	constructor(
		private readonly createPaymentUseCase: CreatePaymentUseCase,
		private readonly getPaymentUseCase: GetPaymentUseCase,
		private readonly confirmPaymentUseCase: ConfirmPaymentUseCase,
		private readonly handlePaymentConfirmedWebhookUseCase: HandlePaymentConfirmedWebhookUseCase,
		private readonly releasePaymentHoldUseCase: ReleasePaymentHoldUseCase,
	) {}

	@Post()
	async create(@Body() body: CreatePaymentRequestBody): Promise<{
		id: string;
		orderId: string;
		status: string;
		grossAmount: number;
		boosterAmount: number;
	}> {
		try {
			return await this.createPaymentUseCase.execute(body);
		} catch (error) {
			throw this.mapDomainError(error);
		}
	}

	@Get(':paymentId')
	async get(@Param('paymentId') paymentId: string): Promise<{
		id: string;
		orderId: string;
		status: string;
		grossAmount: number;
		boosterAmount: number;
	}> {
		const payment = await this.getPaymentUseCase.execute({ paymentId });
		if (!payment) throw new NotFoundException('Payment not found.');

		return payment;
	}

	@Post(':paymentId/confirm')
	@HttpCode(200)
	async confirm(
		@Param('paymentId') paymentId: string,
	): Promise<{ success: true }> {
		return this.executeMutation(() =>
			this.confirmPaymentUseCase.execute({ paymentId }),
		);
	}

	@Post('webhooks/payment-confirmed')
	@HttpCode(200)
	async handlePaymentConfirmedWebhook(
		@Body() body: HandlePaymentConfirmedWebhookRequestBody,
	): Promise<{ processed: boolean }> {
		try {
			return await this.handlePaymentConfirmedWebhookUseCase.execute(body);
		} catch (error) {
			throw this.mapDomainError(error);
		}
	}

	@Post(':paymentId/release')
	@HttpCode(200)
	async release(
		@Param('paymentId') paymentId: string,
	): Promise<{ success: true }> {
		return this.executeMutation(() =>
			this.releasePaymentHoldUseCase.execute({ paymentId }),
		);
	}

	private async executeMutation(
		mutation: () => Promise<void>,
	): Promise<{ success: true }> {
		try {
			await mutation();
			return { success: true };
		} catch (error) {
			throw this.mapDomainError(error);
		}
	}

	private mapDomainError(
		error: unknown,
	): BadRequestException | NotFoundException {
		if (!(error instanceof Error)) {
			return new BadRequestException('Unexpected error.');
		}

		if (
			error.message === 'Payment not found.' ||
			error.message === 'Order not found.'
		) {
			return new NotFoundException(error.message);
		}

		return new BadRequestException(error.message);
	}
}
