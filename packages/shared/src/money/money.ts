export class InvalidMoneyError extends Error {
	constructor(value: unknown) {
		super(`Invalid money amount: ${String(value)}`);
		this.name = 'InvalidMoneyError';
	}
}

export class Money {
	private constructor(public readonly cents: number) {}

	static fromCents(cents: number): Money {
		if (!Number.isInteger(cents) || !Number.isSafeInteger(cents))
			throw new InvalidMoneyError(cents);

		return new Money(cents);
	}

	static fromDecimal(amount: number): Money {
		if (!Number.isFinite(amount)) throw new InvalidMoneyError(amount);

		return Money.fromCents(roundHalfAwayFromZero(amount * 100));
	}

	static zero(): Money {
		return new Money(0);
	}

	add(other: Money): Money {
		return Money.fromCents(this.cents + other.cents);
	}

	subtract(other: Money): Money {
		return Money.fromCents(this.cents - other.cents);
	}

	min(other: Money): Money {
		return this.cents <= other.cents ? this : other;
	}

	max(other: Money): Money {
		return this.cents >= other.cents ? this : other;
	}

	percentage(rate: number): Money {
		if (!Number.isFinite(rate)) throw new InvalidMoneyError(rate);

		return Money.fromCents(roundHalfAwayFromZero(this.cents * rate));
	}

	compare(other: Money): number {
		if (this.cents < other.cents) return -1;
		if (this.cents > other.cents) return 1;

		return 0;
	}

	equals(other: Money): boolean {
		return this.cents === other.cents;
	}

	isNegative(): boolean {
		return this.cents < 0;
	}

	isZero(): boolean {
		return this.cents === 0;
	}

	toDecimal(): number {
		return this.cents / 100;
	}
}

function roundHalfAwayFromZero(value: number): number {
	return Math.sign(value) * Math.round(Math.abs(value));
}
