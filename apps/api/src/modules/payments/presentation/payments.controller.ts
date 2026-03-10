import { ZodValidationPipe } from '@app/common/http/zod-validation.pipe';
import { ConfirmPaymentUseCase } from '@modules/payments/application/use-cases/confirm-payment/confirm-payment.use-case';
import { CreatePaymentUseCase } from '@modules/payments/application/use-cases/create-payment/create-payment.use-case';
import { FailPaymentUseCase } from '@modules/payments/application/use-cases/fail-payment/fail-payment.use-case';
import { GetPaymentUseCase } from '@modules/payments/application/use-cases/get-payment/get-payment.use-case';
import { HandlePaymentConfirmedWebhookUseCase } from '@modules/payments/application/use-cases/handle-payment-confirmed-webhook/handle-payment-confirmed-webhook.use-case';
import { ReleasePaymentHoldUseCase } from '@modules/payments/application/use-cases/release-payment-hold/release-payment-hold.use-case';
import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import {
	type CreatePaymentSchemaInput,
	createPaymentSchema,
	type HandlePaymentConfirmedWebhookSchemaInput,
	handlePaymentConfirmedWebhookSchema,
} from './payments.request-schemas';

@Controller('payments')
export class PaymentsController {
	constructor(
		private readonly createPaymentUseCase: CreatePaymentUseCase,
		private readonly getPaymentUseCase: GetPaymentUseCase,
		private readonly confirmPaymentUseCase: ConfirmPaymentUseCase,
		private readonly failPaymentUseCase: FailPaymentUseCase,
		private readonly handlePaymentConfirmedWebhookUseCase: HandlePaymentConfirmedWebhookUseCase,
		private readonly releasePaymentHoldUseCase: ReleasePaymentHoldUseCase,
	) {}

	@Post()
	async create(
		@Body(new ZodValidationPipe(createPaymentSchema))
		body: CreatePaymentSchemaInput,
	): Promise<{
		id: string;
		orderId: string;
		status: string;
		grossAmount: number;
		boosterAmount: number;
	}> {
		return await this.createPaymentUseCase.execute(body);
	}

	@Get(':paymentId')
	async get(@Param('paymentId') paymentId: string): Promise<{
		id: string;
		orderId: string;
		status: string;
		grossAmount: number;
		boosterAmount: number;
	}> {
		return await this.getPaymentUseCase.execute({ paymentId });
	}

	@Post(':paymentId/confirm')
	@HttpCode(200)
	async confirm(
		@Param('paymentId') paymentId: string,
	): Promise<{ success: true }> {
		await this.confirmPaymentUseCase.execute({ paymentId });
		return { success: true };
	}

	@Post(':paymentId/fail')
	@HttpCode(200)
	async fail(
		@Param('paymentId') paymentId: string,
	): Promise<{ success: true }> {
		await this.failPaymentUseCase.execute({ paymentId });
		return { success: true };
	}

	@Post('webhooks/payment-confirmed')
	@HttpCode(200)
	async handlePaymentConfirmedWebhook(
		@Body(new ZodValidationPipe(handlePaymentConfirmedWebhookSchema))
		body: HandlePaymentConfirmedWebhookSchemaInput,
	): Promise<{ processed: boolean }> {
		return await this.handlePaymentConfirmedWebhookUseCase.execute(body);
	}

	@Post(':paymentId/release')
	@HttpCode(200)
	async release(
		@Param('paymentId') paymentId: string,
	): Promise<{ success: true }> {
		await this.releasePaymentHoldUseCase.execute({ paymentId });
		return { success: true };
	}
}
