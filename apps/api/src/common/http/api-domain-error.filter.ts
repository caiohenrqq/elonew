import {
	mapAsBadRequest,
	mapAsConflict,
	mapAsForbidden,
	mapAsNotFound,
	mapAsUnauthorized,
	mapDomainErrorToHttpException,
	tryMapDomainErrorToHttpException,
} from '@app/common/http/domain-error.mapper';
import {
	AdminGovernanceReasonRequiredError,
	AdminOrderNotFoundError,
	AdminUserEmailAlreadyInUseError,
	AdminUserNotFoundError,
	AdminUsernameAlreadyInUseError,
	AdminUserPasswordSetupUnavailableError,
} from '@modules/admin/domain/admin.errors';
import {
	AuthenticationRequiredError,
	AuthInvalidCredentialsError,
	AuthRefreshTokenInvalidError,
	AuthRefreshTokenRevokedError,
	AuthUserBlockedError,
	AuthUserInactiveError,
	InsufficientPermissionsError,
	InternalApiKeyRequiredError,
	InvalidAccessTokenError,
	InvalidInternalApiKeyError,
} from '@modules/auth/domain/auth.errors';
import {
	ChatForbiddenError,
	ChatMessageNotFoundError,
	ChatNotWritableError,
	ChatOrderNotFoundError,
} from '@modules/chat/domain/chat.errors';
import {
	NotificationNotFoundError,
	NotificationReadConflictError,
} from '@modules/notifications/domain/notification.errors';
import {
	OrderAlreadyExistsError,
	OrderBoosterNotEligibleError,
	OrderBoosterNotFoundError,
	OrderCancellationNotAllowedError,
	OrderCredentialsPasswordMismatchError,
	OrderCredentialsStorageNotAllowedError,
	OrderInvalidTransitionError,
	OrderNotFoundError,
} from '@modules/orders/domain/order.errors';
import {
	CouponCodeAlreadyExistsError,
	CouponNotFoundError,
	OrderCouponDiscountInvalidError,
	OrderCouponFirstOrderOnlyError,
	OrderCouponInactiveError,
	OrderCouponInvalidError,
	OrderCouponNotFoundError,
	OrderPricingVersionActiveConflictError,
	OrderPricingVersionImmutableError,
	OrderPricingVersionIncompleteError,
	OrderPricingVersionNameInvalidError,
	OrderPricingVersionNotActiveError,
	OrderPricingVersionNotFoundError,
	OrderQuoteAlreadyUsedError,
	OrderQuoteExpiredError,
	OrderQuoteNotFoundError,
	OrderRankNotPricedError,
	OrderRankProgressionInvalidError,
	OrderUnsupportedPricingServiceTypeError,
} from '@modules/orders/domain/order-pricing.errors';
import {
	PaymentAlreadyExistsError,
	PaymentAmountInvalidError,
	PaymentCheckoutResumeNotAllowedError,
	PaymentHoldReleaseNotAllowedError,
	PaymentInvalidTransitionError,
	PaymentNotFoundError,
	PaymentOrderNotFoundError,
	PaymentWebhookNotificationMismatchError,
	PaymentWebhookSignatureInvalidError,
	PaymentWebhookTopicNotSupportedError,
} from '@modules/payments/domain/payment.errors';
import {
	InvalidRatingScoreError,
	OrderNotRatableError,
	RatingAlreadySubmittedError,
	RatingNotAllowedError,
	RatingOrderNotFoundError,
	RatingWindowClosedError,
} from '@modules/ratings/domain/rating.errors';
import {
	TicketAccessDeniedError,
	TicketInvalidStatusTransitionError,
	TicketMessageOperationInvalidError,
	TicketNotFoundError,
	TicketOrderAccessDeniedError,
	TicketOrderLinkUnsupportedError,
} from '@modules/tickets/domain/ticket.errors';
import {
	UserEmailAlreadyInUseError,
	UserEmailConfirmationTokenInvalidError,
	UsernameAlreadyInUseError,
	UserPasswordResetTokenInvalidError,
} from '@modules/users/domain/user.errors';
import {
	WalletInsufficientWithdrawableBalanceError,
	WalletInvalidAmountError,
	WalletNotFoundError,
} from '@modules/wallet/domain/wallet.errors';
import {
	ArgumentsHost,
	BadRequestException,
	Catch,
	type ExceptionFilter,
	type HttpException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

export function mapApiDomainErrorToHttpException(
	error: unknown,
): HttpException | null {
	if (
		error instanceof UserEmailAlreadyInUseError ||
		error instanceof UsernameAlreadyInUseError
	)
		return mapDomainErrorToHttpException(error, [
			{
				errorTypes: [UserEmailAlreadyInUseError, UsernameAlreadyInUseError],
				toException: () =>
					new BadRequestException('Registration is unavailable.'),
			},
		]);

	return tryMapDomainErrorToHttpException(error, [
		{
			errorTypes: [
				OrderCouponInvalidError,
				OrderCouponNotFoundError,
				OrderCouponInactiveError,
				OrderCouponFirstOrderOnlyError,
				OrderCouponDiscountInvalidError,
			],
			toException: () => new BadRequestException('Coupon is invalid.'),
		},
		mapAsUnauthorized(
			AuthenticationRequiredError,
			InvalidAccessTokenError,
			InternalApiKeyRequiredError,
			InvalidInternalApiKeyError,
			AuthInvalidCredentialsError,
			AuthRefreshTokenInvalidError,
			AuthRefreshTokenRevokedError,
			PaymentWebhookSignatureInvalidError,
			PaymentWebhookNotificationMismatchError,
			PaymentWebhookTopicNotSupportedError,
		),
		mapAsForbidden(AuthUserInactiveError, AuthUserBlockedError),
		mapAsForbidden(InsufficientPermissionsError),
		mapAsForbidden(ChatForbiddenError),
		mapAsForbidden(TicketAccessDeniedError),
		mapAsForbidden(RatingNotAllowedError),
		mapAsNotFound(
			ChatOrderNotFoundError,
			ChatMessageNotFoundError,
			OrderNotFoundError,
			OrderBoosterNotFoundError,
			OrderQuoteNotFoundError,
			OrderPricingVersionNotFoundError,
			AdminOrderNotFoundError,
			AdminUserNotFoundError,
			PaymentNotFoundError,
			PaymentOrderNotFoundError,
			WalletNotFoundError,
			NotificationNotFoundError,
			TicketNotFoundError,
			RatingOrderNotFoundError,
			CouponNotFoundError,
		),
		mapAsBadRequest(
			OrderAlreadyExistsError,
			OrderBoosterNotEligibleError,
			OrderInvalidTransitionError,
			OrderCancellationNotAllowedError,
			OrderCredentialsStorageNotAllowedError,
			OrderCredentialsPasswordMismatchError,
			OrderUnsupportedPricingServiceTypeError,
			OrderRankNotPricedError,
			OrderRankProgressionInvalidError,
			OrderQuoteExpiredError,
			OrderQuoteAlreadyUsedError,
			OrderPricingVersionImmutableError,
			OrderPricingVersionIncompleteError,
			OrderPricingVersionNameInvalidError,
			OrderPricingVersionNotActiveError,
			PaymentAlreadyExistsError,
			PaymentAmountInvalidError,
			PaymentCheckoutResumeNotAllowedError,
			PaymentInvalidTransitionError,
			PaymentHoldReleaseNotAllowedError,
			WalletInvalidAmountError,
			WalletInsufficientWithdrawableBalanceError,
			UserEmailConfirmationTokenInvalidError,
			UserPasswordResetTokenInvalidError,
			AdminGovernanceReasonRequiredError,
			AdminUserEmailAlreadyInUseError,
			AdminUsernameAlreadyInUseError,
			AdminUserPasswordSetupUnavailableError,
			TicketInvalidStatusTransitionError,
			TicketMessageOperationInvalidError,
			TicketOrderAccessDeniedError,
			TicketOrderLinkUnsupportedError,
			OrderNotRatableError,
			RatingWindowClosedError,
			InvalidRatingScoreError,
		),
		mapAsConflict(OrderPricingVersionActiveConflictError, ChatNotWritableError),
		mapAsConflict(NotificationReadConflictError),
		mapAsConflict(RatingAlreadySubmittedError),
		mapAsConflict(CouponCodeAlreadyExistsError),
	]);
}

@Catch()
export class ApiDomainErrorFilter
	extends BaseExceptionFilter
	implements ExceptionFilter
{
	override catch(exception: unknown, host: ArgumentsHost): void {
		const mappedException = mapApiDomainErrorToHttpException(exception);
		super.catch(mappedException ?? exception, host);
	}
}
