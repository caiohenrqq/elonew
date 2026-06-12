import { InvalidMoneyError, Money } from '@packages/shared/money/money';

describe('Money', () => {
	describe('construction', () => {
		it('builds from integer cents', () => {
			expect(Money.fromCents(3500).cents).toBe(3500);
		});

		it('converts a decimal amount to cents', () => {
			expect(Money.fromDecimal(35).cents).toBe(3500);
			expect(Money.fromDecimal(12.59).cents).toBe(1259);
		});

		it('absorbs binary floating-point noise when converting 2-decimal amounts', () => {
			expect(Money.fromDecimal(0.1 + 0.2).cents).toBe(30);
			expect(Money.fromDecimal(1.1).cents).toBe(110);
			expect(Money.fromDecimal(19.99).cents).toBe(1999);
		});

		it('rejects non-integer cents', () => {
			expect(() => Money.fromCents(10.5)).toThrow(InvalidMoneyError);
		});

		it('rejects non-finite decimals', () => {
			expect(() => Money.fromDecimal(Number.POSITIVE_INFINITY)).toThrow(
				InvalidMoneyError,
			);
			expect(() => Money.fromDecimal(Number.NaN)).toThrow(InvalidMoneyError);
		});
	});

	describe('arithmetic', () => {
		it('adds and subtracts without drift', () => {
			const total = Money.fromDecimal(0.1)
				.add(Money.fromDecimal(0.2))
				.add(Money.fromDecimal(0.3));
			expect(total.cents).toBe(60);
		});

		it('keeps a running balance exact across many credits and debits', () => {
			let balance = Money.zero();
			for (let i = 0; i < 1000; i++) balance = balance.add(Money.fromCents(7));
			balance = balance.subtract(Money.fromCents(7000));
			expect(balance.isZero()).toBe(true);
		});
	});

	describe('percentage (booster split, coupons, extras)', () => {
		it('computes the 70% booster split with half-up rounding', () => {
			expect(Money.fromDecimal(100).percentage(0.7).cents).toBe(7000);
			expect(Money.fromCents(1799).percentage(0.7).cents).toBe(1259);
		});

		it('rounds half away from zero deterministically', () => {
			expect(Money.fromCents(2451).percentage(0.5).cents).toBe(1226);
			expect(Money.fromCents(2453).percentage(0.5).cents).toBe(1227);
		});

		it('applies an extras modifier rate', () => {
			expect(Money.fromDecimal(80).percentage(0.25).cents).toBe(2000);
			expect(Money.fromCents(4999).percentage(0.35).cents).toBe(1750);
		});

		it('rejects a non-finite rate', () => {
			expect(() => Money.fromCents(100).percentage(Number.NaN)).toThrow(
				InvalidMoneyError,
			);
		});
	});

	describe('comparison and clamping', () => {
		it('clamps a discount to the subtotal with min', () => {
			const subtotal = Money.fromDecimal(50);
			const discount = Money.fromDecimal(80);
			expect(subtotal.min(discount).cents).toBe(5000);
		});

		it('floors a remaining total at zero with max', () => {
			const remaining = Money.fromDecimal(50).subtract(Money.fromDecimal(80));
			expect(Money.zero().max(remaining).cents).toBe(0);
			expect(remaining.isNegative()).toBe(true);
		});

		it('compares and tests equality', () => {
			expect(Money.fromCents(100).compare(Money.fromCents(200))).toBe(-1);
			expect(Money.fromCents(200).compare(Money.fromCents(100))).toBe(1);
			expect(Money.fromCents(100).compare(Money.fromCents(100))).toBe(0);
			expect(Money.fromCents(100).equals(Money.fromCents(100))).toBe(true);
		});
	});

	describe('display boundary', () => {
		it('exposes a decimal amount for presentation', () => {
			expect(Money.fromCents(1259).toDecimal()).toBe(12.59);
		});
	});
});
