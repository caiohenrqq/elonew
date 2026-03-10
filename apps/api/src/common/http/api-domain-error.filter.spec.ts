import { mapApiDomainErrorToHttpException } from '@app/common/http/api-domain-error.filter';
import {
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
import { BadRequestException, NotFoundException } from '@nestjs/common';

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
	});

	it('returns null for unmapped errors', () => {
		expect(
			mapApiDomainErrorToHttpException(new Error('unexpected')),
		).toBeNull();
	});
});
