import { ZodValidationPipe } from '@app/common/http/zod-validation.pipe';
import { AppSettingsService } from '@app/common/settings/app-settings.service';
import type { AuthenticatedUser } from '@modules/auth/application/authenticated-user';
import { CurrentUser } from '@modules/auth/presentation/decorators/current-user.decorator';
import { Public } from '@modules/auth/presentation/decorators/public.decorator';
import { Roles } from '@modules/auth/presentation/decorators/roles.decorator';
import { InternalApiKeyGuard } from '@modules/auth/presentation/guards/internal-api-key.guard';
import { JwtAuthGuard } from '@modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/presentation/guards/roles.guard';
import { PaymentLifecycleLogger } from '@modules/payments/application/logging/payment-lifecycle.logger';
import { ConfirmPaymentUseCase } from '@modules/payments/application/use-cases/confirm-payment/confirm-payment.use-case';
import { CreatePaymentUseCase } from '@modules/payments/application/use-cases/create-payment/create-payment.use-case';
import { FailPaymentUseCase } from '@modules/payments/application/use-cases/fail-payment/fail-payment.use-case';
import { GetPaymentUseCase } from '@modules/payments/application/use-cases/get-payment/get-payment.use-case';
import { HandlePaymentConfirmedWebhookUseCase } from '@modules/payments/application/use-cases/handle-payment-confirmed-webhook/handle-payment-confirmed-webhook.use-case';
import { ReconcileStaleCheckoutsUseCase } from '@modules/payments/application/use-cases/reconcile-stale-checkouts/reconcile-stale-checkouts.use-case';
import { ReleasePaymentHoldUseCase } from '@modules/payments/application/use-cases/release-payment-hold/release-payment-hold.use-case';
import { ResumePaymentCheckoutUseCase } from '@modules/payments/application/use-cases/resume-payment-checkout/resume-payment-checkout.use-case';
import { SimulateDevPaymentOutcomeUseCase } from '@modules/payments/application/use-cases/simulate-dev-payment-outcome/simulate-dev-payment-outcome.use-case';
import { StartCheckoutUseCase } from '@modules/payments/application/use-cases/start-checkout/start-checkout.use-case';
import {
	Body,
	Controller,
	Get,
	Headers,
	HttpCode,
	NotFoundException,
	Optional,
	Param,
	Post,
	UseGuards,
} from '@nestjs/common';
import { Role } from '@packages/auth/roles/role';
import type { PaymentMethod } from '@packages/shared/payments/payment-method';
import {
	type CreatePaymentSchemaInput,
	createPaymentSchema,
	mercadoPagoWebhookSchema,
	type OrderIdParamSchemaInput,
	orderIdParamSchema,
	type PaymentIdParamSchemaInput,
	paymentIdParamSchema,
	type ReconcileStaleCheckoutsSchemaInput,
	reconcileStaleCheckoutsSchema,
	type SimulateDevPaymentOutcomeSchemaInput,
	type StartCheckoutSchemaInput,
	simulateDevPaymentOutcomeSchema,
	startCheckoutSchema,
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
		private readonly reconcileStaleCheckoutsUseCase: ReconcileStaleCheckoutsUseCase,
		private readonly resumePaymentCheckoutUseCase: ResumePaymentCheckoutUseCase,
		private readonly simulateDevPaymentOutcomeUseCase: SimulateDevPaymentOutcomeUseCase,
		private readonly startCheckoutUseCase: StartCheckoutUseCase,
		private readonly appSettings: AppSettingsService,
		@Optional()
		private readonly paymentLifecycleLogger?: PaymentLifecycleLogger,
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

	@Post('checkout')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(Role.CLIENT)
	async checkout(
		@Body(new ZodValidationPipe(startCheckoutSchema))
		body: StartCheckoutSchemaInput,
		@CurrentUser() currentUser: AuthenticatedUser,
	): Promise<{
		orderId: string;
		paymentId: string;
		status: string;
		grossAmount: number;
		boosterAmount: number;
		paymentMethod: PaymentMethod;
		checkoutUrl: string;
	}> {
		return await this.startCheckoutUseCase.execute({
			clientId: currentUser.id,
			quoteId: body.quoteId,
			paymentMethod: body.paymentMethod,
			now: new Date(),
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
		@Body() body: unknown,
		@Headers('x-signature') signature?: string,
		@Headers('x-request-id') requestId?: string,
	): Promise<{ processed: boolean }> {
		const parsed = mercadoPagoWebhookSchema.safeParse(body);
		if (!parsed.success) {
			this.paymentLifecycleLogger?.emit(
				{
					event: 'payment.lifecycle',
					operation: 'mercadopago_webhook',
					outcome: 'skipped',
					webhook_ignored_reason: 'unsupported_notification_format',
					webhook_request_id: requestId,
				},
				Date.now(),
			);
			return { processed: false };
		}

		return await this.handlePaymentConfirmedWebhookUseCase.execute({
			eventId: parsed.data.id,
			topic: parsed.data.type,
			notificationResourceId: parsed.data.data.id,
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

	@Post('internal/reconcile-stale-checkouts')
	@UseGuards(InternalApiKeyGuard)
	@HttpCode(200)
	async reconcileStaleCheckouts(
		@Body(new ZodValidationPipe(reconcileStaleCheckoutsSchema))
		body: ReconcileStaleCheckoutsSchemaInput,
	): Promise<{
		skipped: boolean;
		reason?: 'lock_unavailable';
		scannedCount: number;
		confirmedCount: number;
		failedCount: number;
		pendingUpdatedCount: number;
		skippedCount: number;
		gatewayErrorCount: number;
	}> {
		return await this.reconcileStaleCheckoutsUseCase.execute({
			now: body.now ? new Date(body.now) : new Date(),
			limit: body.limit,
		});
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
