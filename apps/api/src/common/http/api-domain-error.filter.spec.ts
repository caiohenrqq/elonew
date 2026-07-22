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
import { CouponCodeAlreadyExistsError } from '@modules/orders/domain/order-pricing.errors';
import {
	PaymentHoldReleaseNotAllowedError,
	PaymentNotFoundError,
} from '@modules/payments/domain/payment.errors';
import { RatingAlreadySubmittedError } from '@modules/ratings/domain/rating.errors';
import {
	UserEmailAlreadyInUseError,
	UsernameAlreadyInUseError,
} from '@modules/users/domain/user.errors';
import {
	WalletInsufficientWithdrawableBalanceError,
	WalletNotFoundError,
} from '@modules/wallet/domain/wallet.errors';
import {
	BadRequestException,
	ConflictException,
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

	it('maps conflict domain errors to ConflictException', () => {
		expect(
			mapApiDomainErrorToHttpException(new RatingAlreadySubmittedError()),
		).toBeInstanceOf(ConflictException);
		expect(
			mapApiDomainErrorToHttpException(new CouponCodeAlreadyExistsError()),
		).toBeInstanceOf(ConflictException);
	});

	it('masks sign-up conflicts so accounts cannot be enumerated', () => {
		for (const error of [
			new UserEmailAlreadyInUseError(),
			new UsernameAlreadyInUseError(),
		]) {
			const exception = mapApiDomainErrorToHttpException(error);

			expect(exception).toBeInstanceOf(BadRequestException);
			expect(exception?.message).toBe('Registration is unavailable.');
			expect(exception?.message).not.toContain('already in use');
		}
	});

	it('returns null for unmapped errors', () => {
		expect(
			mapApiDomainErrorToHttpException(new Error('unexpected')),
		).toBeNull();
	});
});
