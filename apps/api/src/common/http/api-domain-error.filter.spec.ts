import { mapApiDomainErrorToHttpException } from '@app/common/http/api-domain-error.filter';
import {
	AuthenticationRequiredError,
	AuthInvalidCredentialsError,
	AuthRefreshTokenInvalidError,
	AuthRefreshTokenRevokedError,
	AuthUserInactiveError,
	InsufficientPermissionsError,
	InvalidAccessTokenError,
} from '@modules/auth/domain/auth.errors';
import {
	OrderBoosterNotEligibleError,
	OrderBoosterNotFoundError,
	OrderInvalidTransitionError,
	OrderNotFoundError,
} from '@modules/orders/domain/order.errors';
import {
	PaymentHoldReleaseNotAllowedError,
	PaymentNotFoundError,
} from '@modules/payments/domain/payment.errors';
import {
	WalletInsufficientWithdrawableBalanceError,
	WalletNotFoundError,
} from '@modules/wallet/domain/wallet.errors';
import {
	BadRequestException,
	ForbiddenException,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';

describe('mapApiDomainErrorToHttpException', () => {
	it('maps not-found domain errors to NotFoundException', () => {
		expect(
			mapApiDomainErrorToHttpException(new OrderNotFoundError()),
		).toBeInstanceOf(NotFoundException);
		expect(
			mapApiDomainErrorToHttpException(new PaymentNotFoundError()),
		).toBeInstanceOf(NotFoundException);
		expect(
			mapApiDomainErrorToHttpException(new WalletNotFoundError()),
		).toBeInstanceOf(NotFoundException);
		expect(
			mapApiDomainErrorToHttpException(new OrderBoosterNotFoundError()),
		).toBeInstanceOf(NotFoundException);
	});

	it('maps bad-request domain errors to BadRequestException', () => {
		expect(
			mapApiDomainErrorToHttpException(
				new OrderInvalidTransitionError('awaiting_payment', 'in_progress'),
			),
		).toBeInstanceOf(BadRequestException);
		expect(
			mapApiDomainErrorToHttpException(new PaymentHoldReleaseNotAllowedError()),
		).toBeInstanceOf(BadRequestException);
		expect(
			mapApiDomainErrorToHttpException(
				new WalletInsufficientWithdrawableBalanceError(),
			),
		).toBeInstanceOf(BadRequestException);
		expect(
			mapApiDomainErrorToHttpException(new OrderBoosterNotEligibleError()),
		).toBeInstanceOf(BadRequestException);
	});

	it('maps auth errors to unauthorized and forbidden exceptions', () => {
		expect(
			mapApiDomainErrorToHttpException(new AuthenticationRequiredError()),
		).toBeInstanceOf(UnauthorizedException);
		expect(
			mapApiDomainErrorToHttpException(new InvalidAccessTokenError()),
		).toBeInstanceOf(UnauthorizedException);
		expect(
			mapApiDomainErrorToHttpException(new AuthInvalidCredentialsError()),
		).toBeInstanceOf(UnauthorizedException);
		expect(
			mapApiDomainErrorToHttpException(new AuthRefreshTokenInvalidError()),
		).toBeInstanceOf(UnauthorizedException);
		expect(
			mapApiDomainErrorToHttpException(new AuthRefreshTokenRevokedError()),
		).toBeInstanceOf(UnauthorizedException);
		expect(
			mapApiDomainErrorToHttpException(new InsufficientPermissionsError()),
		).toBeInstanceOf(ForbiddenException);
		expect(
			mapApiDomainErrorToHttpException(new AuthUserInactiveError()),
		).toBeInstanceOf(ForbiddenException);
	});

	it('returns null for unmapped errors', () => {
		expect(
			mapApiDomainErrorToHttpException(new Error('unexpected')),
		).toBeNull();
	});
});
