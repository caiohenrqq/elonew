import {
	mapAsBadRequest,
	mapAsNotFound,
	mapDomainErrorToHttpException,
	tryMapDomainErrorToHttpException,
} from '@app/common/http/domain-error.mapper';
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
	PaymentAlreadyExistsError,
	PaymentAmountInvalidError,
	PaymentHoldReleaseNotAllowedError,
	PaymentInvalidTransitionError,
	PaymentNotFoundError,
	PaymentOrderNotFoundError,
} from '@modules/payments/domain/payment.errors';
import {
	UserEmailAlreadyInUseError,
	UserEmailConfirmationTokenInvalidError,
	UsernameAlreadyInUseError,
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
		mapAsNotFound(
			OrderNotFoundError,
			OrderBoosterNotFoundError,
			PaymentNotFoundError,
			PaymentOrderNotFoundError,
			WalletNotFoundError,
		),
		mapAsBadRequest(
			OrderAlreadyExistsError,
			OrderBoosterNotEligibleError,
			OrderInvalidTransitionError,
			OrderCancellationNotAllowedError,
			OrderCredentialsStorageNotAllowedError,
			OrderCredentialsPasswordMismatchError,
			PaymentAlreadyExistsError,
			PaymentAmountInvalidError,
			PaymentInvalidTransitionError,
			PaymentHoldReleaseNotAllowedError,
			WalletInvalidAmountError,
			WalletInsufficientWithdrawableBalanceError,
			UserEmailConfirmationTokenInvalidError,
		),
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
