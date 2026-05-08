import { ZodValidationPipe } from '@app/common/http/zod-validation.pipe';
import { AppSettingsService } from '@app/common/settings/app-settings.service';
import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import { CurrentUser } from '@modules/auth/presentation/decorators/current-user.decorator';
import { Public } from '@modules/auth/presentation/decorators/public.decorator';
import { Roles } from '@modules/auth/presentation/decorators/roles.decorator';
import { InternalApiKeyGuard } from '@modules/auth/presentation/guards/internal-api-key.guard';
import { JwtAuthGuard } from '@modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/presentation/guards/roles.guard';
import { ConfirmPaymentUseCase } from '@modules/payments/application/use-cases/confirm-payment/confirm-payment.use-case';
import { CreatePaymentUseCase } from '@modules/payments/application/use-cases/create-payment/create-payment.use-case';
import { FailPaymentUseCase } from '@modules/payments/application/use-cases/fail-payment/fail-payment.use-case';
import { GetPaymentUseCase } from '@modules/payments/application/use-cases/get-payment/get-payment.use-case';
import { HandlePaymentConfirmedWebhookUseCase } from '@modules/payments/application/use-cases/handle-payment-confirmed-webhook/handle-payment-confirmed-webhook.use-case';
import { ReleasePaymentHoldUseCase } from '@modules/payments/application/use-cases/release-payment-hold/release-payment-hold.use-case';
import { ResumePaymentCheckoutUseCase } from '@modules/payments/application/use-cases/resume-payment-checkout/resume-payment-checkout.use-case';
import { SimulateDevPaymentOutcomeUseCase } from '@modules/payments/application/use-cases/simulate-dev-payment-outcome/simulate-dev-payment-outcome.use-case';
import {
	Body,
	Controller,
	Get,
	Headers,
	HttpCode,
	NotFoundException,
	Param,
	Post,
	UseGuards,
} from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';
import type { PaymentMethod } from '@packages/shared/payments/payment-method';
import {
	type CreatePaymentSchemaInput,
	createPaymentSchema,
	type MercadoPagoWebhookSchemaInput,
	mercadoPagoWebhookSchema,
	type OrderIdParamSchemaInput,
	orderIdParamSchema,
	type PaymentIdParamSchemaInput,
	paymentIdParamSchema,
	type SimulateDevPaymentOutcomeSchemaInput,
	simulateDevPaymentOutcomeSchema,
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
		private readonly resumePaymentCheckoutUseCase: ResumePaymentCheckoutUseCase,
		private readonly simulateDevPaymentOutcomeUseCase: SimulateDevPaymentOutcomeUseCase,
		private readonly appSettings: AppSettingsService,
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
		checkoutUrl: string;
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
		@Param('paymentId', new ZodValidationPipe(paymentIdParamSchema))
		paymentId: PaymentIdParamSchemaInput,
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

	@Post('internal/:paymentId/confirm')
	@UseGuards(InternalApiKeyGuard)
	@HttpCode(200)
	async confirm(
		@Param('paymentId', new ZodValidationPipe(paymentIdParamSchema))
		paymentId: PaymentIdParamSchemaInput,
	): Promise<{ success: true }> {
		await this.confirmPaymentUseCase.execute({ paymentId });
		return { success: true };
	}

	@Post('orders/:orderId/resume')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.CLIENT)
	@HttpCode(200)
	async resumeCheckout(
		@Param('orderId', new ZodValidationPipe(orderIdParamSchema))
		orderId: OrderIdParamSchemaInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	): Promise<{
		paymentId: string;
		checkoutUrl: string;
	}> {
		return await this.resumePaymentCheckoutUseCase.execute({
			orderId,
			clientId: currentUser.id,
		});
	}

	@Post('internal/:paymentId/fail')
	@UseGuards(InternalApiKeyGuard)
	@HttpCode(200)
	async fail(
		@Param('paymentId', new ZodValidationPipe(paymentIdParamSchema))
		paymentId: PaymentIdParamSchemaInput,
	): Promise<{ success: true }> {
		await this.failPaymentUseCase.execute({ paymentId });
		return { success: true };
	}

	@Post('webhooks/mercadopago')
	@Public()
	@HttpCode(200)
	async handleMercadoPagoWebhook(
		@Body(new ZodValidationPipe(mercadoPagoWebhookSchema))
		body: MercadoPagoWebhookSchemaInput,
		@Headers('x-signature') signature?: string,
		@Headers('x-request-id') requestId?: string,
	): Promise<{ processed: boolean }> {
		return await this.handlePaymentConfirmedWebhookUseCase.execute({
			eventId: body.id,
			topic: body.type,
			notificationResourceId: body.data.id,
			signature,
			requestId,
		});
	}

	@Post('internal/:paymentId/release')
	@UseGuards(InternalApiKeyGuard)
	@HttpCode(200)
	async release(
		@Param('paymentId', new ZodValidationPipe(paymentIdParamSchema))
		paymentId: PaymentIdParamSchemaInput,
	): Promise<{ success: true }> {
		await this.releasePaymentHoldUseCase.execute({ paymentId });
		return { success: true };
	}

	@Post('dev/:paymentId/simulate')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.CLIENT)
	@HttpCode(200)
	async simulateDevPaymentOutcome(
		@Param('paymentId', new ZodValidationPipe(paymentIdParamSchema))
		paymentId: PaymentIdParamSchemaInput,
		@Body(new ZodValidationPipe(simulateDevPaymentOutcomeSchema))
		body: SimulateDevPaymentOutcomeSchemaInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	): Promise<{
		id: string;
		orderId: string;
		status: string;
		gatewayStatus: string | null;
		gatewayStatusDetail: string | null;
	}> {
		this.assertDevPaymentSimulationEnabled();

		return await this.simulateDevPaymentOutcomeUseCase.execute({
			paymentId,
			clientId: currentUser.id,
			outcome: body.outcome,
		});
	}

	private assertDevPaymentSimulationEnabled(): void {
		if (
			this.appSettings.isProduction ||
			!this.appSettings.skipMercadoPagoCheckoutInDevMode
		)
			throw new NotFoundException();
	}
}
