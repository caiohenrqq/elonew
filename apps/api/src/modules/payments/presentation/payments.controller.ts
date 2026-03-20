import { ZodValidationPipe } from '@app/common/http/zod-validation.pipe';
import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import { CurrentUser } from '@modules/auth/presentation/decorators/current-user.decorator';
import { Roles } from '@modules/auth/presentation/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/presentation/guards/roles.guard';
import { ConfirmPaymentUseCase } from '@modules/payments/application/use-cases/confirm-payment/confirm-payment.use-case';
import { CreatePaymentUseCase } from '@modules/payments/application/use-cases/create-payment/create-payment.use-case';
import { FailPaymentUseCase } from '@modules/payments/application/use-cases/fail-payment/fail-payment.use-case';
import { GetPaymentUseCase } from '@modules/payments/application/use-cases/get-payment/get-payment.use-case';
import { HandlePaymentConfirmedWebhookUseCase } from '@modules/payments/application/use-cases/handle-payment-confirmed-webhook/handle-payment-confirmed-webhook.use-case';
import { ReleasePaymentHoldUseCase } from '@modules/payments/application/use-cases/release-payment-hold/release-payment-hold.use-case';
import {
	Body,
	Controller,
	Get,
	HttpCode,
	Param,
	Post,
	UseGuards,
} from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';
import type { PaymentMethod } from '@shared/payments/payment-method';
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
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.CLIENT)
	async create(
		@Body(new ZodValidationPipe(createPaymentSchema))
		body: CreatePaymentSchemaInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	): Promise<{
		id: string;
		orderId: string;
		status: string;
		grossAmount: number;
		boosterAmount: number;
		paymentMethod: PaymentMethod;
	}> {
		return await this.createPaymentUseCase.execute({
			clientId: currentUser.id,
			...body,
		});
	}

	@Get(':paymentId')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.CLIENT)
	async get(
		@Param('paymentId') paymentId: string,
		@CurrentUser() currentUser: AuthenticatedUser,
	): Promise<{
		id: string;
		orderId: string;
		status: string;
		grossAmount: number;
		boosterAmount: number;
		paymentMethod: PaymentMethod;
	}> {
		return await this.getPaymentUseCase.execute({
			paymentId,
			clientId: currentUser.id,
		});
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
