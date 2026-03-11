import {
	mapAsBadRequest,
	mapAsNotFound,
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
	WalletInsufficientWithdrawableBalanceError,
	WalletInvalidAmountError,
	WalletNotFoundError,
} from '@modules/wallet/domain/wallet.errors';
import {
	ArgumentsHost,
	Catch,
	type ExceptionFilter,
	type HttpException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

export function mapApiDomainErrorToHttpException(
	error: unknown,
): HttpException | null {
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
